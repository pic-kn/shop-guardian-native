import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppContext } from '../context/AppContext';
import ListSection from '../components/ListSection';
import ListItem from '../components/ListItem';
import Badge from '../components/Badge';
import { BarChart2, Shield, TrendingDown, Star, Package } from 'lucide-react-native';

export default function AnalysisScreen() {
  const { products, contextualFactors } = useAppContext();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const totalSaving = Object.values(contextualFactors).reduce((sum, f) => sum + (f.saving || 0), 0);
  
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
      {/* Monthly Saving Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryInfo}>
          <Text style={typography.caption}>文脈学習AI 月間削減見込</Text>
          <Text style={[typography.h1, { color: colors.success, marginTop: 4 }]}>
            ¥{totalSaving.toLocaleString()}
          </Text>
        </View>
        <Shield size={32} color={colors.textSecondary} strokeWidth={1} />
      </View>

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
                
                {/* Minimalist Bar Chart */}
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
  summaryCard: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  summaryInfo: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  itemCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  itemCardSelected: {
    borderColor: colors.text,
  },
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
