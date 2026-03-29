import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppContext } from '../context/AppContext';
import ListSection from '../components/ListSection';
import ListItem from '../components/ListItem';
import Badge from '../components/Badge';
import { BarChart2, Shield, TrendingDown, Star, Package, Activity } from 'lucide-react-native';
import { calculateSyncRate } from '../logic/LearningEngine';

export default function AnalysisScreen() {
  const { products, contextualFactors, wasteLogs, actualOrders } = useAppContext();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const totalSaving = Object.values(contextualFactors).reduce((sum, f) => sum + (f.saving || 0), 0);
  const syncRate = calculateSyncRate(actualOrders.slice(0, 30));

  // Build per-week saving trend from wasteLogs (most recent 8 weeks)
  const weeklyTrend = (() => {
    const buckets: Record<string, number> = {};
    wasteLogs.forEach(l => {
      const d = new Date(l.date);
      // ISO week key: YYYY-Www
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      buckets[key] = (buckets[key] || 0) + l.lossYen;
    });
    return Object.entries(buckets)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([week, loss]) => ({ week: week.slice(-3), loss }));
  })();

  const maxLoss = Math.max(...weeklyTrend.map(w => w.loss), 1);

  // Per-product sync rate
  const productSyncRates = products.map(p => {
    const pOrders = actualOrders.filter(o => o.productId === p.id);
    const rate = calculateSyncRate(pOrders);
    return { ...p, syncRate: rate, orderCount: pOrders.length };
  }).sort((a, b) => a.syncRate - b.syncRate);

  const analysisData = products.map(p => {
    const cf = contextualFactors[p.id];
    const wr = cf?.baseWasteRate || 0;
    let pattern = '適正';
    let patternColor = colors.success;

    if (wr > 0.20) {
      pattern = '過剰発注';
      patternColor = colors.danger;
    } else if (wr > 0.05) {
      pattern = '要注意';
      patternColor = colors.warning;
    }

    return { ...p, wasteRate: wr, pattern, patternColor, cf };
  }).sort((a, b) => b.wasteRate - a.wasteRate);

  const renderMiniBar = (value: number, color: string) => (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${Math.min(100, value * 300)}%`, backgroundColor: color }]} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Summary KPIs */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { flex: 2 }]}>
          <View style={styles.kpiHeader}>
            <Shield size={16} color={colors.textSecondary} />
            <Text style={[typography.caption, { marginLeft: 6 }]}>月間削減見込</Text>
          </View>
          <Text style={[typography.h1, { color: colors.success, marginTop: 4 }]}>
            ¥{totalSaving.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.kpiCard, { flex: 1 }]}>
          <View style={styles.kpiHeader}>
            <Activity size={16} color={colors.textSecondary} />
            <Text style={[typography.caption, { marginLeft: 6 }]}>AI同期率</Text>
          </View>
          <Text style={[typography.h1, { color: syncRate >= 80 ? colors.success : colors.warning, marginTop: 4 }]}>
            {syncRate}%
          </Text>
        </View>
      </View>

      {/* Weekly Loss Trend */}
      {weeklyTrend.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>週次ロス推移</Text>
          <View style={styles.trendCard}>
            <View style={styles.trendChart}>
              {weeklyTrend.map((w, i) => (
                <View key={i} style={styles.trendCol}>
                  <View style={styles.trendBarWrapper}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: `${Math.round((w.loss / maxLoss) * 100)}%`,
                          backgroundColor: colors.warning,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{w.week}</Text>
                </View>
              ))}
            </View>
            <Text style={[typography.caption, { textAlign: 'right', marginTop: 4 }]}>
              直近{weeklyTrend.length}週のロス金額（円）
            </Text>
          </View>
        </>
      )}

      {/* Per-product sync rate */}
      <Text style={styles.sectionTitle}>商品別 AI同期率</Text>
      <ListSection>
        {productSyncRates.map((p, i) => (
          <ListItem
            key={p.id}
            icon={Package}
            title={p.name}
            subtitle={`実績${p.orderCount}件`}
            isLast={i === productSyncRates.length - 1}
            rightComponent={
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.h3, {
                  color: p.syncRate >= 80 ? colors.success : p.syncRate >= 60 ? colors.warning : colors.danger,
                }]}>
                  {p.orderCount > 0 ? `${p.syncRate}%` : '—'}
                </Text>
                <Text style={typography.caption}>同期率</Text>
              </View>
            }
          />
        ))}
      </ListSection>

      {/* Waste Analysis */}
      <Text style={styles.sectionTitle}>商品別廃棄分析</Text>

      {analysisData.map((p, index) => {
        const isSelected = selectedProductId === p.id;

        return (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.8}
            onPress={() => setSelectedProductId(isSelected ? null : p.id)}
            style={[styles.itemCard, isSelected && styles.itemCardSelected]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <View style={styles.productIconCircle}>
                  <Package size={20} color={colors.textSecondary} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={typography.h3}>{p.name}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={p.pattern} color={p.patternColor} />
                    {p.isKeyItem && <Star size={12} color={colors.warning} fill={colors.warning} />}
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.h3, { color: p.patternColor }]}>
                  {(p.wasteRate * 100).toFixed(1)}%
                </Text>
                <Text style={typography.caption}>廃棄率</Text>
              </View>
            </View>

            {renderMiniBar(p.wasteRate, p.patternColor)}

            {isSelected && p.cf && (
              <View style={styles.detailsContainer}>
                <View style={styles.divider} />
                <Text style={[typography.caption, { marginBottom: 8 }]}>曜日別廃棄トレンド</Text>

                <View style={styles.chartArea}>
                  {p.cf.dayBreakdown.map((d, i) => (
                    <View key={i} style={styles.chartCol}>
                      <View style={styles.chartBarWrapper}>
                        <View style={[styles.chartBar, { height: `${Math.min(100, d.廃棄率)}%`, backgroundColor: p.patternColor }]} />
                      </View>
                      <Text style={styles.chartLabel}>{d.day}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={typography.caption}>月間ロス(推計)</Text>
                    <Text style={typography.body}>¥{p.cf.lossYen.toLocaleString()}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={typography.caption}>AI推奨削減</Text>
                    <Text style={[typography.body, { color: colors.success }]}>
                      -¥{p.cf.saving.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  kpiRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  kpiCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  kpiHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  trendCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  trendChart: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  trendCol: { flex: 1, alignItems: 'center' },
  trendBarWrapper: {
    flex: 1,
    width: 20,
    backgroundColor: colors.background,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 4,
  },
  trendBar: { width: '100%', borderRadius: 4 },
  itemCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  itemCardSelected: { borderColor: colors.text },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemInfo: { flexDirection: 'row', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  barBg: { height: 6, backgroundColor: colors.borderSubtle, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  detailsContainer: { marginTop: 16 },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginBottom: 16 },
  chartArea: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  chartCol: { flex: 1, alignItems: 'center' },
  chartBarWrapper: { flex: 1, width: 20, backgroundColor: colors.background, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: 4 },
  chartLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 6 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.background, padding: 12, borderRadius: 12 },
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
