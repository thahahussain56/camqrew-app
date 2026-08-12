import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Order } from '../../types/order';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <View style={styles.header}>
          <Text style={[styles.orderId, { color: colors.textPrimary }]}>{order.id}</Text>
          <Badge label={order.status} variant={order.status === 'delivered' ? 'success' : 'info'} />
        </View>

        <Text style={[styles.date, { color: colors.textFaint }]}>Placed on {order.createdAt.split('T')[0]}</Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.itemsPreviewRow}>
          {order.items.slice(0, 3).map((item, i) => (
            <Image key={i} source={{ uri: item.product.image }} style={styles.itemImage} />
          ))}
          {order.items.length > 3 && (
            <View style={[styles.moreBadge, { backgroundColor: colors.chipBg }]}>
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>+{order.items.length - 3}</Text>
            </View>
          )}
          <View style={styles.totalBox}>
            <Text style={[styles.totalLabel, { color: colors.textFaint }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.accent }]}>₹{order.total.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  itemsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#0a0d12',
  },
  moreBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalBox: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});
