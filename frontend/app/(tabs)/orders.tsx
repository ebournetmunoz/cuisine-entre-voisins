import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: colors.warning },
  confirmed: { label: 'Confirmée', color: colors.secondary },
  paid: { label: 'Confirmée', color: colors.secondary },
  completed: { label: 'Terminée', color: colors.textMuted },
  cancelled: { label: 'Annulée', color: colors.error },
};

interface Order {
  id: string;
  meal_id: string;
  meal_title: string;
  meal_image?: string;
  cook_id: string;
  cook_name: string;
  buyer_id: string;
  buyer_name: string;
  portions: number;
  subtotal: number;
  service_fee: number;
  total_price: number;
  status: string;
  message?: string;
  payment_session_id?: string;
  created_at: string;
  is_cook: boolean;
  has_review?: boolean;
  has_cook_review?: boolean;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyer' | 'cook'>('buyer');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBuyerReviewModal, setShowBuyerReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.log('Load orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error: any) {
      window.alert(error.response?.data?.detail || 'Mise à jour impossible');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const confirmed = window.confirm('Supprimer cette commande de votre historique ?');
    if (confirmed) {
      api.deleteOrder(orderId)
        .then(() => {
          loadOrders();
        })
        .catch((error: any) => {
          window.alert(error.response?.data?.detail || 'Suppression impossible');
        });
    }
  };

  const handleOpenReview = (order: Order) => {
    setReviewOrder(order);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleOpenBuyerReview = (order: Order) => {
    setReviewOrder(order);
    setReviewRating(5);
    setReviewComment('');
    setShowBuyerReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    
    setReviewLoading(true);
    try {
      await api.createReview({
        order_id: reviewOrder.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setShowReviewModal(false);
      loadOrders();
      window.alert('Merci ! Votre avis a été enregistré');
    } catch (error: any) {
      window.alert(error.response?.data?.detail || 'Impossible de soumettre votre avis');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitBuyerReview = async () => {
    if (!reviewOrder) return;
    
    setReviewLoading(true);
    try {
      await api.createBuyerReview({
        order_id: reviewOrder.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setShowBuyerReviewModal(false);
      loadOrders();
      window.alert('Merci ! Votre avis sur l\'acheteur a été enregistré');
    } catch (error: any) {
      window.alert(error.response?.data?.detail || 'Impossible de soumettre votre avis');
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => 
    activeTab === 'cook' ? order.is_cook : !order.is_cook
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
  const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: colors.textMuted };
  const isCook = item.is_cook;

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.imageContainer}>
          {item.meal_image ? (
            <Image
              source={{ uri: item.meal_image.startsWith('data:') ? item.meal_image : `data:image/jpeg;base64,${item.meal_image}` }}
              style={styles.mealImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant-outline" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.mealTitle} numberOfLines={1}>{item.meal_title}</Text>
          <TouchableOpacity onPress={() => router.push(`/user/${isCook ? item.buyer_id : item.cook_id}` as any)}>
            <Text style={styles.personName}>
              {isCook ? `Client: ${item.buyer_name}` : `Cuisinier: ${item.cook_name}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Portions</Text>
          <Text style={styles.detailValue}>{item.portions}</Text>
        </View>

        {!isCook && (
          <View style={styles.hybridPaymentSection}>
            <Text style={styles.hybridTitle}>💵 Paiement</Text>
            <Text style={styles.hybridAmountCook}>
              {item.total_price?.toFixed(2)} €
            </Text>
            <Text style={styles.hybridNote}>
              À payer directement au cuisinier (espèces ou Wero)
            </Text>
          </View>
        )}

        {isCook && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vous recevez du client</Text>
            <Text style={styles.priceValue}>{(item.subtotal || item.total_price).toFixed(2)} €</Text>
          </View>
        )}
      </View>

      {item.message && (
        <View style={styles.messageContainer}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {isCook && item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusUpdate(item.id, 'confirmed')}
            >
              <Ionicons name="checkmark" size={18} color={colors.white} />
              <Text style={styles.actionButtonText}>Confirmer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusUpdate(item.id, 'cancelled')}
            >
              <Ionicons name="close" size={18} color={colors.white} />
              <Text style={styles.actionButtonText}>Refuser</Text>
            </TouchableOpacity>
          </>
        )}

        {isCook && (item.status === 'confirmed' || item.status === 'paid') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusUpdate(item.id, 'completed')}
          >
            <Ionicons name="flag" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Terminer</Text>
          </TouchableOpacity>
        )}

        {!isCook && item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleStatusUpdate(item.id, 'cancelled')}
          >
            <Ionicons name="close" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'cancelled' || item.status === 'completed') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteOrder(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}

        {!isCook && item.status === 'completed' && !item.has_review && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleOpenReview(item)}
          >
            <Ionicons name="star" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Noter le cuisinier</Text>
          </TouchableOpacity>
        )}

        {isCook && item.status === 'completed' && !item.has_cook_review && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleOpenBuyerReview(item)}
          >
            <Ionicons name="star" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Noter l'acheteur</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() =>
            router.push(`/messages?userId=${isCook ? item.buyer_id : item.cook_id}` as any)
          }
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
          <Text style={styles.actionButtonText}>Contacter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
      
 if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Commandes</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buyer' && styles.tabActive]}
          onPress={() => setActiveTab('buyer')}
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={activeTab === 'buyer' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'buyer' && styles.tabTextActive]}>
            Commandes passées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cook' && styles.tabActive]}
          onPress={() => setActiveTab('cook')}
        >
          <Ionicons
            name="restaurant-outline"
            size={20}
            color={activeTab === 'cook' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'cook' && styles.tabTextActive]}>
            Commandes reçues
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'buyer'
                ? 'Commandez des plats délicieux !'
                : 'Vos commandes de clients apparaîtront ici'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Noter le cuisinier</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {reviewOrder && (
              <>
                <Text style={styles.reviewMealTitle}>{reviewOrder.meal_title}</Text>
                <Text style={styles.reviewCookName}>par {reviewOrder.cook_name}</Text>

                <Text style={styles.ratingLabel}>Votre note</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= reviewRating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= reviewRating ? colors.accent : colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.commentLabel}>Votre commentaire (optionnel)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Partagez votre expérience..."
                  placeholderTextColor={colors.textMuted}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[styles.submitReviewButton, reviewLoading && styles.buttonDisabled]}
                  onPress={handleSubmitReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color={colors.white} />
                      <Text style={styles.submitReviewButtonText}>Envoyer mon avis</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Buyer Review Modal (for cooks to rate buyers) */}
      <Modal visible={showBuyerReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Noter l'acheteur</Text>
              <TouchableOpacity onPress={() => setShowBuyerReviewModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {reviewOrder && (
              <>
                <Text style={styles.reviewMealTitle}>{reviewOrder.meal_title}</Text>
                <Text style={styles.reviewCookName}>Acheteur : {reviewOrder.buyer_name}</Text>

                <Text style={styles.ratingLabel}>Votre note</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= reviewRating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= reviewRating ? colors.accent : colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.commentLabel}>Votre commentaire (optionnel)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Comment s'est passée la transaction ?"
                  placeholderTextColor={colors.textMuted}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[styles.submitReviewButton, reviewLoading && styles.buttonDisabled]}
                  onPress={handleSubmitBuyerReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color={colors.white} />
                      <Text style={styles.submitReviewButtonText}>Envoyer mon avis</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    marginLeft: 8,
  },
  tabTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.backgroundDark,
  },
  mealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  personName: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  confirmButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  messageButton: {
  backgroundColor: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
  },
  readyButton: {
    backgroundColor: colors.secondary,
  },
  completeButton: {
    backgroundColor: colors.accent,
  },
  deleteButton: {
    backgroundColor: colors.textMuted,
  },
  reviewButton: {
    backgroundColor: colors.accent,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  // Review Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  reviewMealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  reviewCookName: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitReviewButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  hybridPaymentSection: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    padding: 8,
    marginVertical: 3,
  },
  hybridTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 2,
  },
  hybridAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  hybridAmountCook: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  hybridNote: {
    fontSize: 10,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});