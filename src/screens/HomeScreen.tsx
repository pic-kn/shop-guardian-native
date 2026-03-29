import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppContext } from '../context/AppContext';
import ListSection from '../components/ListSection';
import ListItem from '../components/ListItem';
import Badge from '../components/Badge';
import { Package, Shield, AlertCircle, CheckCircle2, RefreshCw, Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { 
    products, 
    contextualFactors, 
    weatherContext, 
    apiStatus, 
    refreshWeather,
    setWeatherId
  } = useAppContext();

  const [filter, setFilter] = useState<'key' | 'all'>('key');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  };

  const displayProducts = filter === 'key' ? products.filter(p => p.isKeyItem) : products;

  const totalQty = displayProducts.reduce((sum, p) => sum + (contextualFactors[p.id]?.recommended || p.baseOrder), 0);
  const totalCost = displayProducts.reduce((sum, p) => {
    const qty = contextualFactors[p.id]?.recommended || p.baseOrder;
    return sum + (qty * p.price * p.costRate);
  }, 0);
  const totalSaving = Object.values(contextualFactors).reduce((sum, f) => sum + (f.saving || 0), 0);

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
          <View style={[styles.productIconCircle, { width: 48, height: 48, backgroundColor: colors.surface }]}>
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
      </View>

      {/* Guardian Alert */}
      <View style={styles.guardianAlert}>
        <Shield size={16} color={colors.text} style={{ marginRight: 8 }} />
        <Text style={[typography.bodySecondary, { flex: 1 }]}>
          {weatherContext.dayType?.label}曜日 × {weatherContext.weather?.label} の発注推奨。
          データが蓄積されるほど精度が向上します。
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
            const recQty = cf?.recommended || p.baseOrder;
            const diff = recQty - p.baseOrder;
            
            return (
              <ListItem
                key={p.id}
                icon={Package}
                title={p.name}
                subtitle={`${cf?.confidence || 'データ不足'} (信頼度)`}
                isLast={index === displayProducts.length - 1}
                rightComponent={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={typography.h2}>{recQty}</Text>
                    {diff !== 0 && (
                      <Text style={[typography.caption, { color: diff < 0 ? colors.success : colors.warning }]}>
                        {diff < 0 ? `↓${Math.abs(diff)}削減` : `↑${diff}増加`}
                      </Text>
                    )}
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
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setConfirmed(!confirmed);
        }}
      >
        {confirmed ? (
          <>
            <CheckCircle2 size={20} color={colors.surface} style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>発注確定済み</Text>
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
    borderWidth: 1, borderColor: colors.borderSubtle
  },
  kpiRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    gap: 8, 
    marginVertical: 12 
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
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.text,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
  confirmBtnDone: {
    backgroundColor: colors.success,
  },
  confirmBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  productIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});
