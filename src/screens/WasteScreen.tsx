import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppContext } from '../context/AppContext';
import ListSection from '../components/ListSection';
import ListItem from '../components/ListItem';
import { X, Trash2, Camera as CameraIcon, Package } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

const WASTE_REASONS = [
  { id: 'weather', label: '天候' },
  { id: 'event', label: 'イベント' },
  { id: 'late', label: '品出し遅れ' },
  { id: 'other', label: 'その他' },
];

export default function WasteScreen() {
  const { products, addWasteLog, wasteLogs, weatherContext } = useAppContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[number] | null>(null);
  const [qty, setQty] = useState(1);
  const [reasonId, setReasonId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLogs = wasteLogs.filter(l => l.date === todayStr);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Basic EAN validation (8 or 13 digits)
    if (data.length !== 8 && data.length !== 13) return;

    const product = products.find(p => p.jan === data);
    if (product) {
      // Immediate heavy haptic for tactile feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedProduct(product);
      setIsScanning(false);
      setQty(1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('未登録の商品', `JAN: ${data} は登録されていません。`);
      setIsScanning(false);
    }
  };

  const handleConfirmWaste = async () => {
    if (!selectedProduct || !reasonId) return;
    
    const lossYen = Math.round(qty * selectedProduct.price * selectedProduct.costRate);
    await addWasteLog({
      date: todayStr,
      productId: selectedProduct.id,
      qty,
      reason: reasonId,
      dayId: weatherContext.dayId,
      weatherId: weatherContext.weatherId,
      lossYen,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedProduct(null);
    setReasonId(null);
    setQty(1);
  };

  if (!permission) return <View />;
  if (!permission.granted && isScanning) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={typography.body}>カメラの使用許可が必要です</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
          />
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>バーコードを正しく枠内に収めてください</Text>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setIsScanning(false)}
            >
              <X color={colors.surface} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.todaySummary}>
            <View style={styles.summaryItem}>
              <Text style={typography.h2}>{todayLogs.reduce((a, b) => a + b.qty, 0)}</Text>
              <Text style={typography.caption}>本日廃棄 (個)</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderColor: colors.borderSubtle }]}>
              <Text style={[typography.h2, { color: colors.danger }]}>
                ¥{todayLogs.reduce((a, b) => a + b.lossYen, 0).toLocaleString()}
              </Text>
              <Text style={typography.caption}>本日ロス</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.scanStartBtn} 
            onPress={() => setIsScanning(true)}
          >
            <CameraIcon size={32} color={colors.text} strokeWidth={1.5} />
            <Text style={styles.scanStartText}>バーコードをスキャン</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>または商品を直接選択</Text>
          <View style={styles.productGrid}>
            {products.slice(0, 6).map(p => (
              <TouchableOpacity 
                key={p.id} 
                style={styles.productCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedProduct(p);
                }}
              >
                <View style={styles.productIconCircle}>
                  <Package size={20} color={colors.textSecondary} />
                </View>
                <Text style={[typography.caption, { fontWeight: '700', marginTop: 8 }]} numberOfLines={1}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {todayLogs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>最近の記録</Text>
              <ListSection>
                {todayLogs.slice(0, 3).map((l, i) => {
                  const p = products.find(x => x.id === l.productId);
                  return (
                    <ListItem
                      key={l.id}
                      icon={Package}
                      title={p?.name || '不明'}
                      subtitle={`${l.qty}個 · ${WASTE_REASONS.find(r => r.id === l.reason)?.label}`}
                      isLast={i === 2 || i === todayLogs.length - 1}
                      rightText={`-¥${l.lossYen.toLocaleString()}`}
                    />
                  );
                })}
              </ListSection>
            </>
          )}
        </ScrollView>
      )}

      {/* Input Modal / Overlay when product is selected */}
      {selectedProduct && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.productIconCircle, { width: 64, height: 64, marginBottom: 12 }]}>
                <Package size={32} color={colors.textSecondary} />
              </View>
              <Text style={typography.h3}>{selectedProduct.name}</Text>
              <Text style={typography.bodySecondary}>¥{selectedProduct.price} (税込)</Text>
              <TouchableOpacity 
                onPress={() => setSelectedProduct(null)} 
                style={styles.modalClose}
              >
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.qtyContainer}>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQty(Math.max(1, qty - 1));
                }}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQty(qty + 1);
                }}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.caption, { textAlign: 'center', marginVertical: 12 }]}>廃棄理由</Text>
            <View style={styles.reasonGrid}>
              {WASTE_REASONS.map(r => (
                <TouchableOpacity 
                  key={r.id} 
                  style={[styles.reasonBtn, reasonId === r.id && styles.reasonBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setReasonId(r.id);
                  }}
                >
                  <View style={[styles.reasonDot, { backgroundColor: reasonId === r.id ? colors.text : colors.border }]} />
                  <Text style={[styles.reasonLabel, reasonId === r.id && styles.reasonLabelActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, !reasonId && styles.submitBtnDisabled]}
              disabled={!reasonId}
              onPress={handleConfirmWaste}
            >
              <Trash2 color={colors.surface} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>廃棄を記録する</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { backgroundColor: colors.text, padding: 12, borderRadius: 8, marginTop: 12 },
  btnText: { color: colors.surface, fontWeight: '700' },
  cameraOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scanFrame: { 
    width: 250, height: 250, 
    borderWidth: 2, borderColor: colors.surface, 
    borderRadius: 20 
  },
  scanHint: { color: colors.surface, marginTop: 24, fontWeight: '600' },
  closeBtn: { position: 'absolute', top: 60, right: 30 },
  todaySummary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  scanStartBtn: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  scanStartText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  productCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
  reasonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalClose: { position: 'absolute', top: 0, right: 0 },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  qtyBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  qtyBtnText: { fontSize: 24, color: colors.text },
  qtyVal: { fontSize: 40, fontWeight: '800', color: colors.text, minWidth: 60, textAlign: 'center' },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  reasonBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 8,
  },
  reasonBtnActive: { borderColor: colors.text, backgroundColor: colors.borderSubtle },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  reasonLabelActive: { color: colors.text },
  submitBtn: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.3 },
  submitBtnText: { color: colors.surface, fontSize: 16, fontWeight: '800' },
});
