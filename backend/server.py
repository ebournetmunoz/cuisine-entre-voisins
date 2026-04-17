from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from bson import ObjectId
import base64
import random
import string
import httpx
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'miammaison')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'miammaison-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Commission Configuration
COMMISSION_RATE = 0.14  # 14%
COMMISSION_MIN = 0.50   # Minimum 0.50€

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
stripe.api_key = STRIPE_API_KEY

# Create the main app
app = FastAPI(title="Mon Voisin Cuisine API")

# CORS (fix complet pour le dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Store reset codes temporarily
password_reset_codes = {}

# ==================== HELPERS ====================

def calculate_commission(subtotal: float) -> float:
    """Calculate platform commission (14% with minimum 0.50€)"""
    commission = subtotal * COMMISSION_RATE
    return max(commission, COMMISSION_MIN)

def extract_city_from_address(address: str) -> str:
    """Extract city name from a full address for public display"""
    if not address:
        return ""

    import re
    address = address.strip()

    match = re.search(r'\b(\d{5})\s+([A-Za-zÀ-ÿ\-\s]+?)(?:\s*,|\s*$)', address)
    if match:
        city = match.group(2).strip()
        city = re.sub(r'\s+(cedex|cedex\s*\d+)$', '', city, flags=re.IGNORECASE).strip()
        if city and len(city) > 1:
            return city.title()

    parts = [p.strip() for p in address.split(',')]
    if len(parts) >= 2:
        last_part = parts[-1]
        city = re.sub(r'^\d{5}\s*', '', last_part).strip()
        if city and len(city) > 1:
            return city.title()

    match = re.search(r'\d{5}\s+([A-Za-zÀ-ÿ\-]+)', address)
    if match:
        return match.group(1).strip().title()

    if len(address) < 30 and not any(word in address.lower() for word in ['rue', 'avenue', 'boulevard', 'place', 'allée', 'chemin']):
        return address.title()

    return ""

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_reset_code():
    """Generate a 6-digit reset code"""
    return ''.join(random.choices(string.digits, k=6))

def is_meal_still_available(available_date: str, available_time: str) -> bool:
    """Check if meal is still available based on date/time"""
    try:
        now = datetime.now()

        date_formats = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"]
        parsed_date = None

        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(available_date, fmt).date()
                break
            except ValueError:
                continue

        if not parsed_date:
            import re
            match = re.search(r'(\d{1,2})[/\-\s](\d{1,2})[/\-\s](\d{4})', available_date)
            if match:
                day, month, year = match.groups()
                parsed_date = datetime(int(year), int(month), int(day)).date()
            else:
                return True

        time_str = available_time.replace('h', ':')
        try:
            time_parts = time_str.split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
        except:
            hour, minute = 23, 59

        meal_datetime = datetime.combine(parsed_date, datetime.min.time().replace(hour=hour, minute=minute))
        return meal_datetime > now
    except Exception as e:
        logger.error(f"Error parsing meal date/time: {e}")
        return True

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[Dict] = None
    is_cook: bool = False
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[Dict] = None
    is_cook: Optional[bool] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None

class MealCreate(BaseModel):
    title: str
    description: str
    price: float
    portions: int
    category: str
    images: List[str] = []
    available_date: str
    available_time: str
    address: str = ""
    neighborhood: str = ""
    allergens: List[str] = []
    is_vegetarian: bool = False
    is_vegan: bool = False
    container_provided: bool = True
    bag_provided: bool = True
    bring_container: bool = False
    collection_instructions: str = ""

class MealResponse(BaseModel):
    id: str
    cook_id: str
    cook_name: str
    cook_avatar: Optional[str] = None
    cook_rating: float = 0.0
    title: str
    description: str
    price: float
    portions: int
    portions_left: int
    category: str
    images: List[str] = []
    available_date: str
    available_time: str
    allergens: List[str] = []
    is_vegetarian: bool = False
    is_vegan: bool = False
    location: Optional[Dict] = None
    distance: Optional[float] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    address: Optional[str] = None
    container_provided: bool = True
    bag_provided: bool = True
    bring_container: bool = False
    collection_instructions: Optional[str] = None
    created_at: datetime
    is_active: bool = True

class OrderCreate(BaseModel):
    meal_id: str
    portions: int
    message: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    meal_id: str
    meal_title: str
    meal_image: Optional[str] = None
    cook_id: str
    cook_name: str
    buyer_id: str
    buyer_name: str
    portions: int
    subtotal: float
    service_fee: float
    total_price: float
    status: str
    message: Optional[str] = None
    payment_session_id: Optional[str] = None
    created_at: datetime

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    content: str
    read: bool = False
    created_at: datetime

class ConversationResponse(BaseModel):
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int = 0

class ReviewCreate(BaseModel):
    order_id: str
    rating: int
    comment: Optional[str] = None
    quality_rating: Optional[int] = None
    quantity_rating: Optional[int] = None
    collection_rating: Optional[int] = None

class BuyerReviewCreate(BaseModel):
    order_id: str
    rating: int
    comment: Optional[str] = None
    punctuality_rating: Optional[int] = None
    communication_rating: Optional[int] = None

class ReviewResponse(BaseModel):
    id: str
    order_id: str
    cook_id: str
    cook_name: str
    reviewer_id: str
    reviewer_name: str
    rating: int
    comment: Optional[str] = None
    quality_rating: Optional[int] = None
    quantity_rating: Optional[int] = None
    collection_rating: Optional[int] = None
    created_at: datetime

class BuyerReviewResponse(BaseModel):
    id: str
    order_id: str
    buyer_id: str
    buyer_name: str
    reviewer_id: str
    reviewer_name: str
    rating: int
    comment: Optional[str] = None
    punctuality_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    created_at: datetime

class PaymentTransaction(BaseModel):
    id: str
    user_id: str
    order_id: str
    session_id: str
    amount: float
    currency: str = "eur"
    status: str
    created_at: datetime
    updated_at: datetime

class PushTokenRequest(BaseModel):
    token: str

class CreatePaymentRequest(BaseModel):
    order_id: str
    origin_url: str

# ==================== AUTH HELPERS ====================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")

    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    user_id = decode_token(credentials.credentials)
    if not user_id:
        return None
    return await db.users.find_one({"_id": ObjectId(user_id)})

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    user_doc = {
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "avatar": None,
        "bio": None,
        "location": None,
        "is_cook": False,
        "rating": 0.0,
        "reviews_count": 0,
        "created_at": datetime.utcnow()
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_doc["email"],
            "name": user_doc["name"],
            "phone": user_doc["phone"],
            "avatar": user_doc["avatar"],
            "bio": user_doc["bio"],
            "location": user_doc["location"],
            "address": user_doc.get("address"),
            "neighborhood": user_doc.get("neighborhood"),
            "is_cook": user_doc["is_cook"],
            "rating": user_doc["rating"],
            "reviews_count": user_doc["reviews_count"],
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    user_id = str(user["_id"])
    token = create_token(user_id)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone"),
            "avatar": user.get("avatar"),
            "bio": user.get("bio"),
            "location": user.get("location"),
            "address": user.get("address"),
            "neighborhood": user.get("neighborhood"),
            "is_cook": user.get("is_cook", False),
            "rating": user.get("rating", 0.0),
            "reviews_count": user.get("reviews_count", 0),
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone"),
        "avatar": user.get("avatar"),
        "bio": user.get("bio"),
        "location": user.get("location"),
        "address": user.get("address"),
        "neighborhood": user.get("neighborhood"),
        "is_cook": user.get("is_cook", False),
        "rating": user.get("rating", 0.0),
        "reviews_count": user.get("reviews_count", 0),
        "created_at": user["created_at"]
    }

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, user = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}

    if update_dict:
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_dict})

    updated_user = await db.users.find_one({"_id": user["_id"]})

    return {
        "id": str(updated_user["_id"]),
        "email": updated_user["email"],
        "name": updated_user["name"],
        "phone": updated_user.get("phone"),
        "avatar": updated_user.get("avatar"),
        "bio": updated_user.get("bio"),
        "location": updated_user.get("location"),
        "address": updated_user.get("address"),
        "neighborhood": updated_user.get("neighborhood"),
        "is_cook": updated_user.get("is_cook", False),
        "rating": updated_user.get("rating", 0.0),
        "reviews_count": updated_user.get("reviews_count", 0),
        "created_at": updated_user["created_at"]
    }


@api_router.get("/users/{user_id}/public-profile")
async def get_public_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    if not user:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    meals_cursor = db.meals.find({
        "cook_id": user_id,
        "is_active": True
    }).sort("created_at", -1).limit(20)
    meals = await meals_cursor.to_list(20)

    visible_meals = []
    for meal in meals:
        if not is_meal_still_available(meal.get("available_date", ""), meal.get("available_time", "")):
            continue
        visible_meals.append({
            "id": str(meal["_id"]),
            "title": meal["title"],
            "price": meal["price"],
            "portions_left": meal.get("portions_left", 0),
            "images": meal.get("images", []),
            "category": meal.get("category", "")
        })

    reviews_cursor = db.reviews.find({"cook_id": user_id}).sort("created_at", -1).limit(20)
    reviews = await reviews_cursor.to_list(20)

    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "bio": user.get("bio"),
        "city": extract_city_from_address(user.get("address", "")) if user.get("address") else "",
        "neighborhood": user.get("neighborhood", ""),
        "rating": user.get("rating", 0.0),
        "reviews_count": user.get("reviews_count", 0),
        "meals_count": len(visible_meals),
        "active_meals": visible_meals,
        "reviews": [{
            "id": str(review["_id"]),
            "reviewer_name": review.get("reviewer_name", "Utilisateur"),
            "rating": review.get("rating", 0),
            "comment": review.get("comment"),
            "created_at": review.get("created_at")
        } for review in reviews]
    }


# ==================== PASSWORD RESET ROUTES ====================

@api_router.post("/auth/password-reset/request")
async def request_password_reset(data: PasswordResetRequest):
    user = await db.users.find_one({"email": data.email.lower()})

    if not user:
        return {"message": "Si cet email existe, un code de réinitialisation a été envoyé"}

    code = generate_reset_code()

    password_reset_codes[data.email.lower()] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15),
        "attempts": 0
    }

    logger.info(f"Password reset code for {data.email}: {code}")

    await db.password_resets.update_one(
        {"email": data.email.lower()},
        {"$set": {
            "email": data.email.lower(),
            "code": code,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=15)
        }},
        upsert=True
    )

    return {
        "message": "Si cet email existe, un code de réinitialisation a été envoyé",
        "code_hint": code
    }

@api_router.post("/auth/password-reset/verify")
async def verify_password_reset(data: PasswordResetVerify):
    email = data.email.lower()

    reset_data = password_reset_codes.get(email)

    if not reset_data:
        db_reset = await db.password_resets.find_one({"email": email})
        if db_reset:
            reset_data = {
                "code": db_reset["code"],
                "expires_at": db_reset["expires_at"],
                "attempts": db_reset.get("attempts", 0)
            }

    if not reset_data:
        raise HTTPException(status_code=400, detail="Aucune demande de réinitialisation trouvée pour cet email")

    if datetime.utcnow() > reset_data["expires_at"]:
        password_reset_codes.pop(email, None)
        await db.password_resets.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Le code a expiré. Veuillez en demander un nouveau")

    if reset_data.get("attempts", 0) >= 5:
        password_reset_codes.pop(email, None)
        await db.password_resets.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Trop de tentatives. Veuillez demander un nouveau code")

    if reset_data["code"] != data.code:
        if email in password_reset_codes:
            password_reset_codes[email]["attempts"] = password_reset_codes[email].get("attempts", 0) + 1
        await db.password_resets.update_one(
            {"email": email},
            {"$inc": {"attempts": 1}}
        )
        raise HTTPException(status_code=400, detail="Code incorrect")

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    hashed_password = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_password}}
    )

    password_reset_codes.pop(email, None)
    await db.password_resets.delete_one({"email": email})

    return {"message": "Mot de passe mis à jour avec succès"}

# ==================== MEALS ROUTES ====================

@api_router.post("/meals")
async def create_meal(meal_data: MealCreate, user = Depends(get_current_user)):
    if not user.get("is_cook"):
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"is_cook": True}})

    meal_address = meal_data.address if meal_data.address else user.get("address", "")
    meal_neighborhood = meal_data.neighborhood if meal_data.neighborhood else user.get("neighborhood", "")
    city = extract_city_from_address(meal_address) if meal_address else ""

    meal_doc = {
        "cook_id": str(user["_id"]),
        "cook_name": user["name"],
        "cook_avatar": user.get("avatar"),
        "cook_rating": user.get("rating", 0.0),
        "title": meal_data.title,
        "description": meal_data.description,
        "price": meal_data.price,
        "portions": meal_data.portions,
        "portions_left": meal_data.portions,
        "category": meal_data.category,
        "images": meal_data.images,
        "available_date": meal_data.available_date,
        "available_time": meal_data.available_time,
        "address": meal_address,
        "neighborhood": meal_neighborhood,
        "city": city,
        "allergens": meal_data.allergens,
        "is_vegetarian": meal_data.is_vegetarian,
        "is_vegan": meal_data.is_vegan,
        "location": user.get("location"),
        "container_provided": meal_data.container_provided,
        "bag_provided": meal_data.bag_provided,
        "bring_container": meal_data.bring_container,
        "collection_instructions": meal_data.collection_instructions,
        "is_active": True,
        "created_at": datetime.utcnow()
    }

    result = await db.meals.insert_one(meal_doc)

    return {
        "id": str(result.inserted_id),
        "cook_id": meal_doc["cook_id"],
        "cook_name": meal_doc["cook_name"],
        "cook_avatar": meal_doc.get("cook_avatar"),
        "cook_rating": meal_doc.get("cook_rating", 0.0),
        "title": meal_doc["title"],
        "description": meal_doc["description"],
        "price": meal_doc["price"],
        "portions": meal_doc["portions"],
        "portions_left": meal_doc["portions_left"],
        "category": meal_doc["category"],
        "images": meal_doc.get("images", []),
        "available_date": meal_doc["available_date"],
        "available_time": meal_doc["available_time"],
        "city": meal_doc.get("city", ""),
        "neighborhood": meal_doc.get("neighborhood", ""),
        "allergens": meal_doc.get("allergens", []),
        "is_vegetarian": meal_doc.get("is_vegetarian", False),
        "is_vegan": meal_doc.get("is_vegan", False),
        "location": meal_doc.get("location"),
        "container_provided": meal_doc.get("container_provided", True),
        "bag_provided": meal_doc.get("bag_provided", True),
        "bring_container": meal_doc.get("bring_container", False),
        "collection_instructions": meal_doc.get("collection_instructions", ""),
        "is_active": meal_doc["is_active"],
        "created_at": meal_doc["created_at"]
    }

@api_router.get("/meals")
async def get_meals(
    category: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance: float = 30.0,
    user = Depends(get_optional_user)
):
    query = {"is_active": True, "portions_left": {"$gt": 0}}

    if category and category != "Tous":
        query["category"] = category

    meals_cursor = db.meals.find(query).sort("created_at", -1).limit(50)
    meals = await meals_cursor.to_list(50)

    result = []
    for meal in meals:
        meal_data = {
            "id": str(meal["_id"]),
            "cook_id": meal["cook_id"],
            "cook_name": meal["cook_name"],
            "cook_avatar": meal.get("cook_avatar"),
            "cook_rating": meal.get("cook_rating", 0.0),
            "title": meal["title"],
            "description": meal["description"],
            "price": meal["price"],
            "portions": meal.get("portions", 0),
            "portions_left": meal.get("portions_left", 0),
            "category": meal["category"],
            "images": meal.get("images", []),
            "available_date": meal["available_date"],
            "available_time": meal["available_time"],
            "allergens": meal.get("allergens", []),
            "is_vegetarian": meal.get("is_vegetarian", False),
            "is_vegan": meal.get("is_vegan", False),
            "location": meal.get("location"),
            "distance": None,
            "city": meal.get("city", ""),
            "neighborhood": meal.get("neighborhood", ""),
            "created_at": meal["created_at"],
            "is_active": meal.get("is_active", True)
        }

        if not is_meal_still_available(meal["available_date"], meal["available_time"]):
            continue

        if lat and lng:
            if not meal.get("location"):
                continue

            meal_loc = meal["location"]

            if not meal_loc.get("lat") or not meal_loc.get("lng"):
                continue

            from math import radians, sin, cos, sqrt, atan2
            R = 6371
            lat1, lng1 = radians(lat), radians(lng)
            lat2, lng2 = radians(meal_loc["lat"]), radians(meal_loc["lng"])
            dlat, dlng = lat2 - lat1, lng2 - lng1
            a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            distance = R * c
            meal_data["distance"] = round(distance, 1)

            if distance > max_distance:
                continue

        result.append(meal_data)

    if lat and lng:
        result.sort(key=lambda x: x.get("distance") if x.get("distance") is not None else 9999)

    return result

@api_router.get("/meals/{meal_id}")
async def get_meal(meal_id: str, user = Depends(get_optional_user)):
    try:
        meal = await db.meals.find_one({"_id": ObjectId(meal_id)})
    except:
        raise HTTPException(status_code=404, detail="Repas non trouvé")

    if not meal:
        raise HTTPException(status_code=404, detail="Repas non trouvé")

    show_full_address = False
    if user:
        user_id = str(user["_id"])
        if meal["cook_id"] == user_id:
            show_full_address = True
        else:
            confirmed_order = await db.orders.find_one({
                "meal_id": meal_id,
                "buyer_id": user_id,
                "status": {"$in": ["confirmed", "paid", "ready", "completed"]}
            })
            if confirmed_order:
                show_full_address = True

    return {
        "id": str(meal["_id"]),
        "cook_id": meal["cook_id"],
        "cook_name": meal["cook_name"],
        "cook_avatar": meal.get("cook_avatar"),
        "cook_rating": meal.get("cook_rating", 0.0),
        "title": meal["title"],
        "description": meal["description"],
        "price": meal["price"],
        "portions": meal["portions"],
        "portions_left": meal["portions_left"],
        "category": meal["category"],
        "images": meal.get("images", []),
        "available_date": meal["available_date"],
        "available_time": meal["available_time"],
        "city": meal.get("city", ""),
        "neighborhood": meal.get("neighborhood", ""),
        "address": meal.get("address", "") if show_full_address else None,
        "allergens": meal.get("allergens", []),
        "is_vegetarian": meal.get("is_vegetarian", False),
        "is_vegan": meal.get("is_vegan", False),
        "location": meal.get("location"),
        "container_provided": meal.get("container_provided", True),
        "bag_provided": meal.get("bag_provided", True),
        "bring_container": meal.get("bring_container", False),
        "collection_instructions": meal.get("collection_instructions", ""),
        "created_at": meal["created_at"],
        "is_active": meal["is_active"]
    }

@api_router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: str, user = Depends(get_current_user)):
    try:
        meal = await db.meals.find_one({"_id": ObjectId(meal_id)})
    except:
        raise HTTPException(status_code=404, detail="Repas non trouvé")

    print("👉 DELETE MEAL ID:", meal_id)
    print("👉 MEAL FOUND:", meal)

    if not meal:
        raise HTTPException(status_code=404, detail="Repas non trouvé")

    if meal["cook_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres plats")

    existing_order = await db.orders.find_one({
        "meal_id": meal_id,
        "status": {"$nin": ["cancelled"]}
    })

    print("👉 EXISTING ORDER:", existing_order)

    if existing_order:
        await db.meals.update_one(
            {"_id": ObjectId(meal_id)},
            {
                "$set": {
                    "is_archived": True,
                    "is_active": False
                }
            }
        )
        return {"message": "Plat archivé avec succès"}

    await db.meals.delete_one({"_id": ObjectId(meal_id)})

    return {"message": "Plat supprimé avec succès"}
@api_router.get("/my-meals")
async def get_my_meals(user = Depends(get_current_user)):
    meals_cursor = db.meals.find({"cook_id": str(user["_id"])}).sort("created_at", -1)
    meals = await meals_cursor.to_list(100)

    result = []
    for meal in meals:
        is_visible = is_meal_still_available(meal.get("available_date", ""), meal.get("available_time", "")) and meal.get("is_active", True)
        result.append({
            "id": str(meal["_id"]),
            "cook_id": meal["cook_id"],
            "cook_name": meal["cook_name"],
            "cook_avatar": meal.get("cook_avatar"),
            "cook_rating": meal.get("cook_rating", 0.0),
            "title": meal["title"],
            "description": meal["description"],
            "price": meal["price"],
            "portions": meal["portions"],
            "portions_left": meal["portions_left"],
            "category": meal["category"],
            "images": meal.get("images", []),
            "available_date": meal["available_date"],
            "available_time": meal["available_time"],
            "city": meal.get("city", ""),
            "neighborhood": meal.get("neighborhood", ""),
            "address": meal.get("address", ""),
            "allergens": meal.get("allergens", []),
            "is_vegetarian": meal.get("is_vegetarian", False),
            "is_vegan": meal.get("is_vegan", False),
            "location": meal.get("location"),
            "created_at": meal["created_at"],
            "is_active": meal.get("is_active", True),
            "is_visible": is_visible
        })
    return result


# ==================== ORDERS ROUTES ====================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, user = Depends(get_current_user)):
    try:
        meal = await db.meals.find_one({"_id": ObjectId(order_data.meal_id)})
    except:
        raise HTTPException(status_code=404, detail="Repas non trouvé")

    if not meal or not meal.get("is_active"):
        raise HTTPException(status_code=404, detail="Ce repas n'est plus disponible")

    if meal["portions_left"] < order_data.portions:
        raise HTTPException(status_code=400, detail="Pas assez de portions disponibles")

    if meal["cook_id"] == str(user["_id"]):
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas commander votre propre repas")

    subtotal = meal["price"] * order_data.portions
    service_fee = calculate_commission(subtotal)
    total_price = subtotal + service_fee

    order_doc = {
        "meal_id": order_data.meal_id,
        "meal_title": meal["title"],
        "meal_image": meal["images"][0] if meal.get("images") else None,
        "cook_id": meal["cook_id"],
        "cook_name": meal["cook_name"],
        "buyer_id": str(user["_id"]),
        "buyer_name": user["name"],
        "portions": order_data.portions,
        "subtotal": subtotal,
        "service_fee": round(service_fee, 2),
        "total_price": round(total_price, 2),
        "status": "pending",
        "message": order_data.message,
        "payment_session_id": None,
        "created_at": datetime.utcnow()
    }

    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)

    await db.meals.update_one(
        {"_id": ObjectId(order_data.meal_id)},
        {"$inc": {"portions_left": -order_data.portions}}
    )

    await notify_user(
        meal["cook_id"],
        "🍽️ Nouvelle commande !",
        f"{user['name']} a commandé {order_data.portions} portion(s) de {meal['title']}",
        {"type": "new_order", "order_id": order_id}
    )

    return {
        "id": order_id,
        "meal_id": order_doc["meal_id"],
        "meal_title": order_doc["meal_title"],
        "meal_image": order_doc.get("meal_image"),
        "cook_id": order_doc["cook_id"],
        "cook_name": order_doc["cook_name"],
        "buyer_id": order_doc["buyer_id"],
        "buyer_name": order_doc["buyer_name"],
        "portions": order_doc["portions"],
        "subtotal": order_doc["subtotal"],
        "service_fee": order_doc["service_fee"],
        "total_price": order_doc["total_price"],
        "status": order_doc["status"],
        "message": order_doc.get("message"),
        "payment_session_id": order_doc.get("payment_session_id"),
        "created_at": order_doc["created_at"]
    }

@api_router.get("/orders")
async def get_orders(user = Depends(get_current_user)):
    orders_cursor = db.orders.find({
        "$or": [
            {"buyer_id": str(user["_id"])},
            {"cook_id": str(user["_id"])}
        ]
    }).sort("created_at", -1)

    orders = await orders_cursor.to_list(100)

    return [{
        "id": str(order["_id"]),
        "meal_id": order["meal_id"],
        "meal_title": order["meal_title"],
        "meal_image": order.get("meal_image"),
        "cook_id": order["cook_id"],
        "cook_name": order["cook_name"],
        "buyer_id": order["buyer_id"],
        "buyer_name": order["buyer_name"],
        "portions": order["portions"],
        "subtotal": order.get("subtotal", order.get("total_price", 0)),
        "service_fee": order.get("service_fee", 0),
        "total_price": order.get("total_price", 0),
        "status": order["status"],
        "message": order.get("message"),
        "payment_session_id": order.get("payment_session_id"),
        "created_at": order["created_at"],
        "is_cook": order["cook_id"] == str(user["_id"]),
        "has_review": order.get("has_review", False),
        "has_cook_review": order.get("has_cook_review", False)
    } for order in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user = Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    user_id = str(user["_id"])

    valid_statuses = ["pending", "confirmed", "paid", "ready", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Statut invalide")

    if status in ["confirmed", "ready"] and order["cook_id"] != user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    if status in ["cancelled", "completed"] and order["cook_id"] != user_id and order["buyer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status}})

    if status == "cancelled" and order["status"] not in ["cancelled", "completed"]:
        await db.meals.update_one(
            {"_id": ObjectId(order["meal_id"])},
            {"$inc": {"portions_left": order["portions"]}}
        )

    notification_messages = {
        "confirmed": ("✅ Commande confirmée !", f"Votre commande de {order['meal_title']} a été confirmée"),
        "paid": ("💳 Paiement reçu !", f"Le paiement pour {order['meal_title']} a été effectué"),
        "ready": ("🍽️ Commande prête !", f"Votre commande de {order['meal_title']} est prête à récupérer"),
        "completed": ("🎉 Commande terminée !", f"La commande de {order['meal_title']} est terminée"),
        "cancelled": ("❌ Commande annulée", f"La commande de {order['meal_title']} a été annulée"),
    }

    if status in notification_messages:
        title, body = notification_messages[status]
        notify_to = order["buyer_id"] if order["cook_id"] == user_id else order["cook_id"]
        await notify_user(notify_to, title, body, {"type": "order_status", "order_id": order_id, "status": status})

    return {"message": "Statut mis à jour", "status": status}

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, user = Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    user_id = str(user["_id"])

    if order["buyer_id"] != user_id and order["cook_id"] != user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    if order["status"] not in ["cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Seules les commandes annulées ou terminées peuvent être supprimées")

    await db.orders.delete_one({"_id": ObjectId(order_id)})

    return {"message": "Commande supprimée"}

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/create-session")
async def create_payment_session(order_id: str, origin_url: str, user = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if order["buyer_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Non autorisé")

    if order["status"] not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Cette commande ne peut pas être payée")

    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"

    checkout_request = CheckoutSessionRequest(
        amount=float(order["total_price"]),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "user_id": str(user["_id"]),
            "meal_title": order["meal_title"]
        }
    )

    session = await stripe_checkout.create_checkout_session(checkout_request)

    transaction_doc = {
        "user_id": str(user["_id"]),
        "order_id": order_id,
        "session_id": session.session_id,
        "amount": float(order["total_price"]),
        "currency": "eur",
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await db.payment_transactions.insert_one(transaction_doc)

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"payment_session_id": session.session_id}}
    )

    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status == "paid":
            await db.orders.update_one(
                {"payment_session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "confirmed",
                    "paid_at": datetime.utcnow()
                }}
            )

            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "paid_at": datetime.utcnow()
                }}
            )

        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")

    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)

        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"status": "paid", "updated_at": datetime.utcnow()}}
            )

            if webhook_response.metadata.get("order_id"):
                await db.orders.update_one(
                    {"_id": ObjectId(webhook_response.metadata["order_id"])},
                    {"$set": {"status": "paid"}}
                )

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@api_router.post("/payments/create-checkout")
async def create_checkout_session(request: CreatePaymentRequest, user: dict = Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(request.order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Commande non trouvée")

        if order["buyer_id"] != str(user["_id"]):
            raise HTTPException(status_code=403, detail="Non autorisé")

        if order.get("payment_status") == "paid":
            raise HTTPException(status_code=400, detail="Cette commande a déjà été payée")

        success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&order_id={request.order_id}"
        cancel_url = f"{request.origin_url}/orders"

        commission_amount = order["service_fee"]
        amount_cents = int(commission_amount * 100)

        if amount_cents < 50:
            amount_cents = 50

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Commission Cuisine entre voisins",
                        'description': f"Frais de service pour: {order['meal_title']} ({order['portions']} portion(s)). Vous paierez {order['subtotal']}€ directement au cuisinier.",
                    },
                    'unit_amount': amount_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'order_id': request.order_id,
                'buyer_id': order["buyer_id"],
                'cook_id': order["cook_id"],
                'cook_amount': str(order["subtotal"]),
            }
        )

        await db.orders.update_one(
            {"_id": ObjectId(request.order_id)},
            {"$set": {
                "payment_session_id": session.id,
                "payment_status": "pending"
            }}
        )

        await db.payment_transactions.insert_one({
            "order_id": request.order_id,
            "session_id": session.id,
            "buyer_id": order["buyer_id"],
            "cook_id": order["cook_id"],
            "amount": order["total_price"],
            "subtotal": order["subtotal"],
            "commission": order["service_fee"],
            "cook_amount": order["subtotal"],
            "currency": "eur",
            "payment_status": "pending",
            "created_at": datetime.utcnow()
        })

        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/payments/cook-earnings")
async def get_cook_earnings(user: dict = Depends(get_current_user)):
    cook_id = str(user["_id"])

    transactions = await db.payment_transactions.find({
        "cook_id": cook_id,
        "payment_status": "paid"
    }).to_list(1000)

    total_earnings = sum(t.get("cook_amount", 0) for t in transactions)
    pending_payout = sum(t.get("cook_amount", 0) for t in transactions if not t.get("paid_out"))

    return {
        "total_earnings": round(total_earnings, 2),
        "pending_payout": round(pending_payout, 2),
        "transaction_count": len(transactions)
    }

@api_router.get("/admin/payouts-pending")
async def get_pending_payouts(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"payment_status": "paid", "paid_out": {"$ne": True}}},
        {"$group": {
            "_id": "$cook_id",
            "total_amount": {"$sum": "$cook_amount"},
            "order_count": {"$sum": 1},
            "transactions": {"$push": "$_id"}
        }}
    ]

    results = await db.payment_transactions.aggregate(pipeline).to_list(1000)

    payouts = []
    for item in results:
        cook = await db.users.find_one({"_id": ObjectId(item["_id"])})
        if cook:
            payouts.append({
                "cook_id": item["_id"],
                "cook_name": cook.get("name", "Inconnu"),
                "cook_email": cook.get("email", ""),
                "amount_due": round(item["total_amount"], 2),
                "order_count": item["order_count"]
            })

    return {"pending_payouts": payouts}

# ==================== CHAT ROUTES ====================

@api_router.post("/messages")
async def send_message(message_data: MessageCreate, user = Depends(get_current_user)):
    try:
        receiver = await db.users.find_one({"_id": ObjectId(message_data.receiver_id)})
    except:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")

    if not receiver:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")

    message_doc = {
        "sender_id": str(user["_id"]),
        "sender_name": user["name"],
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "read": False,
        "created_at": datetime.utcnow()
    }

    result = await db.messages.insert_one(message_doc)

    return {
        "id": str(result.inserted_id),
        "sender_id": message_doc["sender_id"],
        "sender_name": message_doc["sender_name"],
        "receiver_id": message_doc["receiver_id"],
        "content": message_doc["content"],
        "read": message_doc["read"],
        "created_at": message_doc["created_at"]
    }

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, user = Depends(get_current_user)):
    user_id = str(user["_id"])

    messages_cursor = db.messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    }).sort("created_at", 1)

    messages = await messages_cursor.to_list(500)

    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "read": False},
        {"$set": {"read": True}}
    )

    return [{
        "id": str(msg["_id"]),
        "sender_id": msg["sender_id"],
        "sender_name": msg["sender_name"],
        "receiver_id": msg["receiver_id"],
        "content": msg["content"],
        "read": msg["read"],
        "created_at": msg["created_at"]
    } for msg in messages]

@api_router.get("/conversations")
async def get_conversations(user = Depends(get_current_user)):
    user_id = str(user["_id"])

    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": user_id},
                    {"receiver_id": user_id}
                ]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", user_id]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$content"},
                "last_message_time": {"$first": "$created_at"},
                "sender_name": {"$first": "$sender_name"}
            }
        }
    ]

    conversations = await db.messages.aggregate(pipeline).to_list(100)

    result = []
    for conv in conversations:
        other_user_id = conv["_id"]
        try:
            other_user = await db.users.find_one({"_id": ObjectId(other_user_id)})
        except:
            continue

        if other_user:
            unread = await db.messages.count_documents({
                "sender_id": other_user_id,
                "receiver_id": user_id,
                "read": False
            })

            result.append({
                "user_id": other_user_id,
                "user_name": other_user["name"],
                "user_avatar": other_user.get("avatar"),
                "last_message": conv["last_message"],
                "last_message_time": conv["last_message_time"],
                "unread_count": unread
            })

    result.sort(key=lambda x: x["last_message_time"], reverse=True)

    return result

@api_router.delete("/conversations/{other_user_id}")
async def delete_conversation(other_user_id: str, user = Depends(get_current_user)):
    user_id = str(user["_id"])

    result = await db.messages.delete_many({
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    })

    return {"message": f"Conversation supprimée ({result.deleted_count} messages)"}

# ==================== REVIEWS ROUTES ====================

@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, user = Depends(get_current_user)):
    user_id = str(user["_id"])

    try:
        order = await db.orders.find_one({"_id": ObjectId(review_data.order_id)})
    except:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if order["buyer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez évaluer que vos propres commandes")

    if order["status"] not in ["confirmed", "completed", "paid", "ready"]:
        raise HTTPException(status_code=400, detail="La commande doit être confirmée ou terminée pour laisser un avis")

    existing_review = await db.reviews.find_one({"order_id": review_data.order_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cette commande")

    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")

    cook = await db.users.find_one({"_id": ObjectId(order["cook_id"])})

    review_doc = {
        "order_id": review_data.order_id,
        "meal_id": order["meal_id"],
        "cook_id": order["cook_id"],
        "cook_name": cook["name"] if cook else "Cuisinier",
        "reviewer_id": user_id,
        "reviewer_name": user["name"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "quality_rating": review_data.quality_rating,
        "quantity_rating": review_data.quantity_rating,
        "collection_rating": review_data.collection_rating,
        "created_at": datetime.utcnow()
    }

    result = await db.reviews.insert_one(review_doc)

    all_reviews = await db.reviews.find({"cook_id": order["cook_id"]}).to_list(1000)
    if all_reviews:
        avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await db.users.update_one(
            {"_id": ObjectId(order["cook_id"])},
            {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(all_reviews)}}
        )

    await db.orders.update_one(
        {"_id": ObjectId(review_data.order_id)},
        {"$set": {"has_review": True}}
    )

    return {
        "id": str(result.inserted_id),
        **{k: v for k, v in review_doc.items() if k != "_id"}
    }

@api_router.get("/reviews/cook/{cook_id}")
async def get_cook_reviews(cook_id: str):
    reviews = await db.reviews.find({"cook_id": cook_id}).sort("created_at", -1).to_list(100)

    return [{
        "id": str(review["_id"]),
        "order_id": review["order_id"],
        "cook_id": review["cook_id"],
        "cook_name": review.get("cook_name", ""),
        "reviewer_id": review["reviewer_id"],
        "reviewer_name": review["reviewer_name"],
        "rating": review["rating"],
        "comment": review.get("comment"),
        "quality_rating": review.get("quality_rating"),
        "quantity_rating": review.get("quantity_rating"),
        "collection_rating": review.get("collection_rating"),
        "created_at": review["created_at"]
    } for review in reviews]

@api_router.get("/reviews/cook/me")
async def get_my_cook_reviews(user = Depends(get_current_user)):
    user_id = str(user["_id"])

    reviews = await db.reviews.find({"cook_id": user_id}).sort("created_at", -1).to_list(100)

    return [{
        "id": str(review["_id"]),
        "order_id": review["order_id"],
        "cook_id": review["cook_id"],
        "cook_name": review.get("cook_name", ""),
        "reviewer_id": review["reviewer_id"],
        "reviewer_name": review["reviewer_name"],
        "rating": review["rating"],
        "comment": review.get("comment"),
        "quality_rating": review.get("quality_rating"),
        "quantity_rating": review.get("quantity_rating"),
        "collection_rating": review.get("collection_rating"),
        "created_at": review["created_at"]
    } for review in reviews]

@api_router.get("/reviews/my-pending")
async def get_pending_reviews(user = Depends(get_current_user)):
    user_id = str(user["_id"])

    orders = await db.orders.find({
        "buyer_id": user_id,
        "status": {"$in": ["completed", "paid", "ready"]},
        "has_review": {"$ne": True}
    }).to_list(50)

    result = []
    for order in orders:
        meal = await db.meals.find_one({"_id": ObjectId(order["meal_id"])})
        if meal:
            result.append({
                "order_id": str(order["_id"]),
                "meal_id": order["meal_id"],
                "meal_title": meal["title"],
                "cook_id": order["cook_id"],
                "cook_name": order["cook_name"],
                "created_at": order["created_at"]
            })

    return result

@api_router.post("/reviews/buyer")
async def create_buyer_review(review_data: BuyerReviewCreate, user = Depends(get_current_user)):
    user_id = str(user["_id"])

    try:
        order = await db.orders.find_one({"_id": ObjectId(review_data.order_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de commande invalide")

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if order["cook_id"] != user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez noter que vos propres acheteurs")

    if order["status"] not in ["confirmed", "completed", "ready", "paid"]:
        raise HTTPException(status_code=400, detail="La commande doit être confirmée ou terminée pour laisser un avis")

    existing_review = await db.buyer_reviews.find_one({"order_id": review_data.order_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cette commande")

    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")

    review_doc = {
        "order_id": review_data.order_id,
        "buyer_id": order["buyer_id"],
        "buyer_name": order["buyer_name"],
        "reviewer_id": user_id,
        "reviewer_name": user["name"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "punctuality_rating": review_data.punctuality_rating,
        "communication_rating": review_data.communication_rating,
        "created_at": datetime.utcnow()
    }

    result = await db.buyer_reviews.insert_one(review_doc)

    all_reviews = await db.buyer_reviews.find({"buyer_id": order["buyer_id"]}).to_list(1000)
    if all_reviews:
        avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await db.users.update_one(
            {"_id": ObjectId(order["buyer_id"])},
            {"$set": {"buyer_rating": round(avg_rating, 1), "buyer_reviews_count": len(all_reviews)}}
        )

    await db.orders.update_one(
        {"_id": ObjectId(review_data.order_id)},
        {"$set": {"has_cook_review": True}}
    )

    return {
        "id": str(result.inserted_id),
        **{k: v for k, v in review_doc.items() if k != "_id"}
    }

@api_router.get("/reviews/buyer/{buyer_id}")
async def get_buyer_reviews(buyer_id: str):
    reviews = await db.buyer_reviews.find({"buyer_id": buyer_id}).sort("created_at", -1).to_list(100)

    return [{
        "id": str(review["_id"]),
        "order_id": review["order_id"],
        "buyer_id": review["buyer_id"],
        "buyer_name": review.get("buyer_name", ""),
        "reviewer_id": review["reviewer_id"],
        "reviewer_name": review["reviewer_name"],
        "rating": review["rating"],
        "comment": review.get("comment"),
        "punctuality_rating": review.get("punctuality_rating"),
        "communication_rating": review.get("communication_rating"),
        "created_at": review["created_at"]
    } for review in reviews]

@api_router.get("/reviews/cook-pending")
async def get_cook_pending_reviews(user = Depends(get_current_user)):
    user_id = str(user["_id"])

    orders = await db.orders.find({
        "cook_id": user_id,
        "status": {"$in": ["completed", "ready", "paid"]},
        "has_cook_review": {"$ne": True}
    }).to_list(50)

    result = []
    for order in orders:
        result.append({
            "order_id": str(order["_id"]),
            "meal_id": order["meal_id"],
            "meal_title": order.get("meal_title", "Plat"),
            "buyer_id": order["buyer_id"],
            "buyer_name": order["buyer_name"],
            "created_at": order["created_at"]
        })

    return result

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "service": "Mon Voisin Cuisine API"}

@api_router.get("/config/fees")
async def get_fees_config():
    return {
        "commission_rate": COMMISSION_RATE,
        "commission_min": COMMISSION_MIN,
        "commission_rate_percent": int(COMMISSION_RATE * 100)
    }

# ==================== PUSH NOTIFICATIONS ====================

async def send_push_notification(token: str, title: str, body: str, data: dict = None):
    message = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {}
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=message,
                headers={"Content-Type": "application/json"}
            )
            logger.info(f"Push notification sent: {response.status_code}")
            return response.json()
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return None

@api_router.post("/push-token")
async def save_push_token(request: PushTokenRequest, user = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"push_token": request.token}}
    )
    return {"message": "Token enregistré"}

@api_router.delete("/push-token")
async def delete_push_token(user = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$unset": {"push_token": ""}}
    )
    return {"message": "Token supprimé"}

async def notify_user(user_id: str, title: str, body: str, data: dict = None):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user and user.get("push_token"):
        await send_push_notification(user["push_token"], title, body, data)

@api_router.get("/download-logo")
async def download_logo():
    logo_path = "/app/logo_mon_voisin_cuisine.png"
    if os.path.exists(logo_path):
        return FileResponse(
            logo_path,
            media_type="image/png",
            filename="mon_voisin_cuisine_logo.png"
        )
    else:
        raise HTTPException(status_code=404, detail="Logo not found")

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()