#!/usr/bin/env python3

"""
Mon Voisin Cuisine Backend API Tests
Tests all backend APIs including authentication, meals, orders with commission, messaging, and configuration.
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
import sys

# Use the public URL from frontend environment
BASE_URL = "https://neighbor-eats-2.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.test_users = []
        self.test_meals = []
        self.test_orders = []
        self.test_messages = []
        self.auth_tokens = {}
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        print(f"🔧 Testing backend at: {BASE_URL}")

    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()

    def log_test(self, name, success, details=None):
        """Log test results"""
        status = "✅" if success else "❌"
        print(f"{status} {name}")
        if details:
            print(f"   {details}")
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{name}: {details}")

    async def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        try:
            url = f"{BASE_URL}{endpoint}"
            kwargs = {}
            if data:
                kwargs["json"] = data
            if headers:
                kwargs["headers"] = headers
            
            async with self.session.request(method, url, **kwargs) as response:
                text = await response.text()
                try:
                    return response.status, json.loads(text) if text else {}
                except json.JSONDecodeError:
                    return response.status, text
        except Exception as e:
            print(f"Request failed: {method} {endpoint} - {str(e)}")
            return None, str(e)

    async def test_health_check(self):
        """Test health check endpoint"""
        print("\n🏥 Testing Health Check")
        
        status, response = await self.make_request("GET", "/health")
        if status == 200 and response.get("status") == "ok":
            self.log_test("Health Check", True, f"Service: {response.get('service', 'Unknown')}")
        else:
            self.log_test("Health Check", False, f"Status: {status}, Response: {response}")

    async def test_fee_configuration(self):
        """Test fee configuration endpoint"""
        print("\n💰 Testing Fee Configuration")
        
        status, response = await self.make_request("GET", "/config/fees")
        if status == 200:
            expected_rate = 0.1
            expected_min = 0.5
            
            if (response.get("commission_rate") == expected_rate and 
                response.get("commission_min") == expected_min):
                self.log_test("Fee Configuration", True, 
                            f"Rate: {response['commission_rate']}, Min: {response['commission_min']}")
            else:
                self.log_test("Fee Configuration", False, 
                            f"Wrong values - Rate: {response.get('commission_rate')}, Min: {response.get('commission_min')}")
        else:
            self.log_test("Fee Configuration", False, f"Status: {status}, Response: {response}")

    async def test_authentication(self):
        """Test authentication flow"""
        print("\n🔐 Testing Authentication")
        
        # Test user registration
        test_user = {
            "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
            "password": "TestPassword123!",
            "name": "Marie Dubois",
            "phone": "+33612345678"
        }
        
        status, response = await self.make_request("POST", "/auth/register", test_user)
        if status == 200 and "token" in response:
            self.log_test("User Registration", True, f"User: {test_user['name']}")
            self.test_users.append(test_user)
            self.auth_tokens[test_user["email"]] = response["token"]
            
            # Store user ID for later tests
            test_user["id"] = response["user"]["id"]
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {response}")
            return False

        # Test user login
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        status, response = await self.make_request("POST", "/auth/login", login_data)
        if status == 200 and "token" in response:
            self.log_test("User Login", True, f"Token received")
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")

        # Test profile access with token
        headers = {"Authorization": f"Bearer {self.auth_tokens[test_user['email']]}"}
        status, response = await self.make_request("GET", "/auth/me", headers=headers)
        if status == 200 and response.get("email") == test_user["email"]:
            self.log_test("Profile Access", True, f"User: {response.get('name')}")
        else:
            self.log_test("Profile Access", False, f"Status: {status}, Response: {response}")

        # Test profile update
        update_data = {
            "bio": "Passionnée de cuisine française traditionnelle",
            "is_cook": True
        }
        
        status, response = await self.make_request("PUT", "/auth/profile", update_data, headers)
        if status == 200 and response.get("bio") == update_data["bio"]:
            self.log_test("Profile Update", True, f"Bio updated")
        else:
            self.log_test("Profile Update", False, f"Status: {status}, Response: {response}")

        # Create a second user for order testing
        second_user = {
            "email": f"cook_{uuid.uuid4().hex[:8]}@example.com",
            "password": "CookPassword123!",
            "name": "Pierre Martineau",
            "phone": "+33687654321"
        }
        
        status, response = await self.make_request("POST", "/auth/register", second_user)
        if status == 200:
            self.test_users.append(second_user)
            self.auth_tokens[second_user["email"]] = response["token"]
            second_user["id"] = response["user"]["id"]
            self.log_test("Second User Registration", True, f"User: {second_user['name']}")
        else:
            self.log_test("Second User Registration", False, f"Status: {status}, Response: {response}")

        return True

    async def test_meals_crud(self):
        """Test meals CRUD operations"""
        print("\n🍽️ Testing Meals CRUD")
        
        if not self.test_users:
            self.log_test("Meals CRUD", False, "No authenticated users available")
            return

        # Use the second user as cook
        cook = self.test_users[1]
        headers = {"Authorization": f"Bearer {self.auth_tokens[cook['email']]}"}

        # Create a meal
        meal_data = {
            "title": "Coq au Vin Traditionnel",
            "description": "Un délicieux coq au vin préparé selon la recette de ma grand-mère",
            "price": 15.50,
            "portions": 4,
            "category": "Plat principal",
            "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ"],
            "available_date": "2024-02-01",
            "available_time": "19:00",
            "allergens": ["sulfites"],
            "is_vegetarian": False,
            "is_vegan": False
        }
        
        status, response = await self.make_request("POST", "/meals", meal_data, headers)
        if status == 200 and "id" in response:
            meal_id = response["id"]
            self.test_meals.append(meal_id)
            self.log_test("Meal Creation", True, f"Meal: {meal_data['title']}")
        else:
            self.log_test("Meal Creation", False, f"Status: {status}, Response: {response}")
            return

        # Get single meal
        status, response = await self.make_request("GET", f"/meals/{meal_id}")
        if status == 200 and response.get("title") == meal_data["title"]:
            self.log_test("Get Single Meal", True, f"Title: {response['title']}")
        else:
            self.log_test("Get Single Meal", False, f"Status: {status}, Response: {response}")

        # List all meals
        status, response = await self.make_request("GET", "/meals")
        if status == 200 and isinstance(response, list):
            self.log_test("List All Meals", True, f"Found {len(response)} meals")
        else:
            self.log_test("List All Meals", False, f"Status: {status}, Response: {response}")

        # Get user's meals
        status, response = await self.make_request("GET", "/my-meals", headers=headers)
        if status == 200 and isinstance(response, list):
            self.log_test("Get My Meals", True, f"Found {len(response)} meals")
        else:
            self.log_test("Get My Meals", False, f"Status: {status}, Response: {response}")

        # Delete meal (soft delete)
        status, response = await self.make_request("DELETE", f"/meals/{meal_id}", headers=headers)
        if status == 200:
            self.log_test("Delete Meal", True, "Meal deleted")
        else:
            self.log_test("Delete Meal", False, f"Status: {status}, Response: {response}")

    async def test_orders_with_commission(self):
        """Test orders with commission calculation"""
        print("\n📝 Testing Orders with Commission")
        
        if len(self.test_users) < 2:
            self.log_test("Orders", False, "Need 2 users for order testing")
            return

        # Create a new meal for ordering
        cook = self.test_users[1]
        buyer = self.test_users[0]
        cook_headers = {"Authorization": f"Bearer {self.auth_tokens[cook['email']]}"}
        buyer_headers = {"Authorization": f"Bearer {self.auth_tokens[buyer['email']]}"}

        # Create a meal by cook
        meal_data = {
            "title": "Ratatouille Provençale",
            "description": "Une ratatouille authentique aux légumes de Provence",
            "price": 10.00,  # €10 for testing commission
            "portions": 3,
            "category": "Plat principal",
            "available_date": "2024-02-01",
            "available_time": "18:00",
            "is_vegetarian": True
        }
        
        status, response = await self.make_request("POST", "/meals", meal_data, cook_headers)
        if status != 200 or "id" not in response:
            self.log_test("Orders", False, "Failed to create meal for order test")
            return
            
        meal_id = response["id"]

        # Test Case 1: Order for €10 meal x 1 portion -> service_fee should be €1.00 (10%)
        order_data = {
            "meal_id": meal_id,
            "portions": 1,
            "message": "Je voudrais commander ce délicieux plat!"
        }
        
        status, response = await self.make_request("POST", "/orders", order_data, buyer_headers)
        if status == 200:
            subtotal = response.get("subtotal")
            service_fee = response.get("service_fee")
            total_price = response.get("total_price")
            
            # Check commission calculation: 10€ x 1 = 10€ subtotal, 10% = 1€ service_fee
            expected_subtotal = 10.00
            expected_service_fee = 1.00  # 10% of 10€
            expected_total = expected_subtotal + expected_service_fee
            
            if (abs(subtotal - expected_subtotal) < 0.01 and 
                abs(service_fee - expected_service_fee) < 0.01 and 
                abs(total_price - expected_total) < 0.01):
                self.log_test("Commission Test 1 (10€ order)", True, 
                            f"Subtotal: €{subtotal}, Service: €{service_fee}, Total: €{total_price}")
                self.test_orders.append(response["id"])
            else:
                self.log_test("Commission Test 1 (10€ order)", False, 
                            f"Wrong calculation - Subtotal: €{subtotal}, Service: €{service_fee}, Total: €{total_price}")
        else:
            self.log_test("Commission Test 1 (10€ order)", False, f"Status: {status}, Response: {response}")

        # Test Case 2: Create a cheaper meal for minimum commission test
        cheap_meal = {
            "title": "Soupe à l'Oignon",
            "description": "Soupe à l'oignon traditionnelle",
            "price": 4.00,  # €4 for testing minimum commission
            "portions": 2,
            "category": "Entrée",
            "available_date": "2024-02-01",
            "available_time": "18:30"
        }
        
        status, response = await self.make_request("POST", "/meals", cheap_meal, cook_headers)
        if status == 200:
            cheap_meal_id = response["id"]
            
            # Order for €4 meal x 1 portion -> service_fee should be €0.50 (minimum)
            order_data2 = {
                "meal_id": cheap_meal_id,
                "portions": 1,
                "message": "Une soupe pour ce soir"
            }
            
            status, response = await self.make_request("POST", "/orders", order_data2, buyer_headers)
            if status == 200:
                subtotal = response.get("subtotal")
                service_fee = response.get("service_fee")
                total_price = response.get("total_price")
                
                # Check minimum commission: 4€ x 1 = 4€ subtotal, min 0.50€ service_fee
                expected_subtotal = 4.00
                expected_service_fee = 0.50  # Minimum commission
                expected_total = expected_subtotal + expected_service_fee
                
                if (abs(subtotal - expected_subtotal) < 0.01 and 
                    abs(service_fee - expected_service_fee) < 0.01 and 
                    abs(total_price - expected_total) < 0.01):
                    self.log_test("Commission Test 2 (4€ order, min fee)", True, 
                                f"Subtotal: €{subtotal}, Service: €{service_fee}, Total: €{total_price}")
                    self.test_orders.append(response["id"])
                else:
                    self.log_test("Commission Test 2 (4€ order, min fee)", False, 
                                f"Wrong calculation - Subtotal: €{subtotal}, Service: €{service_fee}, Total: €{total_price}")
            else:
                self.log_test("Commission Test 2 (4€ order, min fee)", False, f"Status: {status}, Response: {response}")

        # Test getting orders with fresh headers to avoid session issues
        buyer_headers_fresh = {"Authorization": f"Bearer {self.auth_tokens[buyer['email']]}"}
        status, response = await self.make_request("GET", "/orders", headers=buyer_headers_fresh)
        if status == 200 and isinstance(response, list):
            self.log_test("Get Orders (Buyer)", True, f"Found {len(response)} orders")
        else:
            self.log_test("Get Orders (Buyer)", False, f"Status: {status}, Response: {response}")

        # Test order status update
        if self.test_orders:
            order_id = self.test_orders[0]
            status, response = await self.make_request("PUT", f"/orders/{order_id}/status?status=confirmed", 
                                                     None, cook_headers)
            if status == 200:
                self.log_test("Update Order Status", True, "Order confirmed")
            else:
                self.log_test("Update Order Status", False, f"Status: {status}, Response: {response}")

    async def test_messaging(self):
        """Test messaging system"""
        print("\n💬 Testing Messaging System")
        
        if len(self.test_users) < 2:
            self.log_test("Messaging", False, "Need 2 users for messaging test")
            return

        user1 = self.test_users[0]
        user2 = self.test_users[1]
        user1_headers = {"Authorization": f"Bearer {self.auth_tokens[user1['email']]}"}
        user2_headers = {"Authorization": f"Bearer {self.auth_tokens[user2['email']]}"}

        # Send message from user1 to user2
        message_data = {
            "receiver_id": user2["id"],
            "content": "Bonjour! Je suis intéressée par votre ratatouille. Est-elle encore disponible?"
        }
        
        status, response = await self.make_request("POST", "/messages", message_data, user1_headers)
        if status == 200 and "id" in response:
            self.log_test("Send Message", True, f"Message sent to {user2['name']}")
            self.test_messages.append(response["id"])
        else:
            self.log_test("Send Message", False, f"Status: {status}, Response: {response}")

        # Send reply from user2 to user1
        reply_data = {
            "receiver_id": user1["id"],
            "content": "Bonjour! Oui, la ratatouille est encore disponible. Souhaitez-vous la commander?"
        }
        
        status, response = await self.make_request("POST", "/messages", reply_data, user2_headers)
        if status == 200:
            self.log_test("Reply Message", True, "Reply sent")
        else:
            self.log_test("Reply Message", False, f"Status: {status}, Response: {response}")

        # Get conversation between users
        status, response = await self.make_request("GET", f"/messages/{user2['id']}", 
                                                 headers=user1_headers)
        if status == 200 and isinstance(response, list) and len(response) >= 2:
            self.log_test("Get Conversation", True, f"Found {len(response)} messages")
        else:
            self.log_test("Get Conversation", False, f"Status: {status}, Response: {response}")

        # Get all conversations
        status, response = await self.make_request("GET", "/conversations", headers=user1_headers)
        if status == 200 and isinstance(response, list):
            self.log_test("Get Conversations", True, f"Found {len(response)} conversations")
        else:
            self.log_test("Get Conversations", False, f"Status: {status}, Response: {response}")

    async def test_error_cases(self):
        """Test error handling"""
        print("\n🚨 Testing Error Cases")
        
        # Test invalid login
        invalid_login = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        status, response = await self.make_request("POST", "/auth/login", invalid_login)
        if status == 401:
            self.log_test("Invalid Login", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid Login", False, f"Status: {status}, should be 401")

        # Test accessing protected endpoint without auth
        status, response = await self.make_request("GET", "/auth/me")
        if status == 401:
            self.log_test("No Auth Header", True, "Correctly rejected request without auth")
        else:
            self.log_test("No Auth Header", False, f"Status: {status}, should be 401")

        # Test invalid meal ID
        status, response = await self.make_request("GET", "/meals/invalid-id")
        if status == 404:
            self.log_test("Invalid Meal ID", True, "Correctly returned 404")
        else:
            self.log_test("Invalid Meal ID", False, f"Status: {status}, should be 404")

    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Mon Voisin Cuisine Backend Tests")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            await self.test_health_check()
            await self.test_fee_configuration()
            
            # Authentication must pass for other tests to work
            auth_success = await self.test_authentication()
            if auth_success:
                await self.test_meals_crud()
                await self.test_orders_with_commission()
                await self.test_messaging()
            
            await self.test_error_cases()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"Total: {self.results['passed'] + self.results['failed']}")
        
        if self.results['failed'] > 0:
            print(f"\n🔍 Failures:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        success_rate = (self.results['passed'] / (self.results['passed'] + self.results['failed'])) * 100 if (self.results['passed'] + self.results['failed']) > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! Backend is working well.")
        elif success_rate >= 70:
            print("⚠️ Good, but some issues need attention.")
        else:
            print("🔧 Multiple issues detected. Backend needs fixes.")

async def main():
    """Main test runner"""
    tester = BackendTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())