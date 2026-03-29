import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppContext } from '../context/AppContext';
import ListSection from '../components/ListSection';
import ListItem from '../components/ListItem';
import { Package, Shield, CheckCircle2, RefreshCw, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { calculateSyncRate } from '../logic/LearningEngine';

export default function HomeScreen() {
  const {
    products,
    contextualFactors,
    weatherContext,
    apiStatus,
    refreshWeather,
    actualOrders,
    addActualOrder,
  } = useAppContext();

  const [filter, setFilter] = useState<'key' | 'all'>('key');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  // Per-product quantity adjustments (productId -> qty)
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  };

  const displayProducts = filter === 'key' ? products.filter(p => p.isKeyItem) : products;

  // Resolve effective quantity: user adjustment if set, otherwise AI recommendation
  // Keys are numeric product IDs from internal state — not user input.
  const effectiveQty = (productId: number): number => {
    // eslint-disable-next-line security/detect-object-injection
    if (adjustments[productId] !== undefined) return adjustments[productId];
    // eslint-disable-next-line security/detect-object-injection
    return contextualFactors[productId]?.recommended || products.find(p => p.id === productId)?.baseOrder || 0;
  };

  const totalQty = displayProducts.reduce((sum, p) => sum + effectiveQty(p.id), 0);
  const totalCost = displayProducts.reduce((sum, p) => {
    const product = products.find(x => x.id === p.id)!;
    return sum + effectiveQty(p.id) * product.price * product.costRate;
  }, 0);
  const totalSaving = Object.values(contextualFactors).reduce((sum, f) => sum + (f.saving || 0), 0);

  const syncRate = calculateSyncRate(actualOrders.slice(0, 30));

  const adjust = (productId: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdjustments(prev => {
      // productId is a numeric internal ID — not user-controlled input.
      // eslint-disable-next-line security/detect-object-injection
      const current = prev[productId] ?? (contextualFactors[productId]?.recommended || 0);
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  };

  const handleConfirm = async () => {
    if (confirmed) {
      setConfirmed(false);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const p of displayProducts) {
      const ai = contextualFactors[p.id]?.recommended || p.baseOrder;
      const actual = effectiveQty(p.id);
      await addActualOrder({
        date: todayStr,
        productId: p.id,
        aiRecommended: ai,
        actualQty: actual,
        dayId: weatherContext.dayId,
        weatherId: weatherContext.weatherId,
      });
    }
    setConfirmed(true);
  };

  const renderKPI = (label: string, value: string, color: string = colors.text) => (
    <View style={styles.kpiCard}>
      <Text style={[typography.caption, { marginBottom: 4 }]}>{label}</Text>
      <Text style={[typography.h2, { color }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}
    >
      {/* Weather Header */}
      <View style={styles.weatherHeader}>
        <View style={styles.weatherInfo}>
          <View style={[styles.iconCircle, { width: 48, height: 48, backgroundColor: colors.surface }]}>
            {(() => {
              const iconName = weatherContext.weather?.icon;
              if (iconName === 'Sun') return <Sun size={28} color={colors.text} />;
              if (iconName === 'CloudRain') return <CloudRain size={28} color={colors.text} />;
              if (iconName === 'CloudSnow') return <CloudSnow size={28} color={colors.text} />;
              if (iconName === 'CloudLightning') return <CloudLightning size={28} color={colors.text} />;
              return <Cloud size={28} color={colors.text} />;
            })()}
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={typography.h3}>{weatherContext.weather?.label || '取得中...'}</Text>
            <View style={styles.weatherStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: apiStatus === 'success' ? colors.success : colors.warning }]} />
              <Text style={typography.caption}>
                {apiStatus === 'success' ? '自動取得完了' : (apiStatus === 'loading' ? '取得中...' : '手動選択中')}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRefresh();
          }}
          style={styles.refreshBtn}
        >
          <RefreshCw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        {renderKPI('発注数', `${totalQty}個`)}
        {renderKPI('コスト', `¥${Math.round(totalCost).toLocaleString()}`)}
        {renderKPI('削減見込', `¥${totalSaving.toLocaleString()}`, colors.success)}
        {renderKPI('同期率', `${syncRate}%`, syncRate >= 80 ? colors.success : colors.warning)}
      </View>

      {/* Guardian Alert */}
      <View style={styles.guardianAlert}>
        <Shield size={16} color={colors.text} style={{ marginRight: 8 }} />
        <Text style={[typography.bodySecondary, { flex: 1 }]}>
          {weatherContext.dayType?.label}曜日 × {weatherContext.weather?.label} の発注推奨。
          数量を調整して確定すると、AIが学習します。
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          onPress={() => setFilter('key')}
          style={[styles.filterTab, filter === 'key' && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, filter === 'key' && styles.filterTabTextActive]}>重点管理</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>全商品</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <ListSection>
        {displayProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={typography.bodySecondary}>表示する商品がありません</Text>
          </View>
        ) : (
          displayProducts.map((p, index) => {
            const cf = contextualFactors[p.id];
            const aiQty = cf?.recommended || p.baseOrder;
            const qty = effectiveQty(p.id);
            const isAdjusted = adjustments[p.id] !== undefined && adjustments[p.id] !== aiQty;

            return (
              <ListItem
                key={p.id}
                icon={Package}
                title={p.name}
                subtitle={`AI推奨: ${aiQty}個 ${isAdjusted ? '(調整済)' : `(${cf?.confidence || 'データ不足'})`}`}
                isLast={index === displayProducts.length - 1}
                rightComponent={
                  <View style={styles.qtyAdjuster}>
                    <TouchableOpacity onPress={() => adjust(p.id, -1)} style={styles.adjBtn}>
                      <Minus size={14} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[typography.h2, { minWidth: 36, textAlign: 'center' }]}>{qty}</Text>
                    <TouchableOpacity onPress={() => adjust(p.id, 1)} style={styles.adjBtn}>
                      <Plus size={14} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                }
              />
            );
          })
        )}
      </ListSection>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, confirmed && styles.confirmBtnDone]}
        onPress={handleConfirm}
      >
        {confirmed ? (
          <>
            <CheckCircle2 size={20} color={colors.surface} style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>発注確定済み（タップで取消）</Text>
          </>
        ) : (
          <>
            <Package size={20} color={colors.surface} style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>この内容で発注を確定</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  weatherInfo: { flexDirection: 'row', alignItems: 'center' },
  weatherStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  guardianAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: colors.text },
  emptyContainer: { padding: 40, alignItems: 'center' },
  qtyAdjuster: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adjBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: colors.text,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnDone: { backgroundColor: colors.success },
  confirmBtnText: { color: colors.surface, fontSize: 16, fontWeight: '800' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
});
