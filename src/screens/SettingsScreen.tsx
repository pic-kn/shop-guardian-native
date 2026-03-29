import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppContext } from '../context/AppContext';
import ListSection from '../components/ListSection';
import ListItem from '../components/ListItem';
import { Settings as SettingsIcon, Plus, Store, Package, Download, X, Camera as CameraIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SettingsScreen() {
  const { products, addProduct, deleteProduct, storeConfig, setStoreConfig } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [isScanningJan, setIsScanningJan] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Simple form state
  const [name, setName] = useState('');
  const [jan, setJan] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('おにぎり');
  const [baseOrder, setBaseOrder] = useState('20');

  const handleJanScanned = ({ data }: { data: string }) => {
    if (data.length !== 8 && data.length !== 13) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setJan(data);
    setIsScanningJan(false);
  };

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('カメラの許可が必要です', '設定からカメラを許可してください。');
        return;
      }
    }
    setIsScanningJan(true);
  };

  const handleAddProduct = async () => {
    if (!name || !jan || !price) {
      Alert.alert('入力エラー', '商品名、JAN、価格を入力してください。');
      return;
    }

    await addProduct({
      name,
      jan,
      price: Number(price),
      category,
      costRate: 0.55,
      baseOrder: Number(baseOrder),
      iconName: 'Package',
      isKeyItem: false,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setJan('');
    setPrice('');
    setCategory('おにぎり');
    setBaseOrder('20');
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      '商品を削除',
      'この操作は取り消せません。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => deleteProduct(id) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>店舗設定</Text>
      <ListSection>
        <ListItem
          icon={Store}
          title="店舗名"
          rightComponent={
            <TextInput
              style={styles.inlineInput}
              value={storeConfig.name}
              onChangeText={val => setStoreConfig({ ...storeConfig, name: val })}
              placeholder="店舗名を入力"
            />
          }
        />
        <ListItem
          icon={SettingsIcon}
          title="自動バックアップ"
          isLast
          rightComponent={
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.text }}
              thumbColor={colors.surface}
            />
          }
        />
      </ListSection>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>登録商品一覧 ({products.length})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={16} color={colors.text} />
          <Text style={[typography.caption, { marginLeft: 4, fontWeight: '700' }]}>追加</Text>
        </TouchableOpacity>
      </View>

      <ListSection>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={typography.bodySecondary}>商品が登録されていません</Text>
          </View>
        ) : (
          products.map((p, i) => (
            <ListItem
              key={p.id}
              icon={Package}
              title={p.name}
              subtitle={`JAN: ${p.jan} | 推奨: ${p.baseOrder}個`}
              isLast={i === products.length - 1}
              onPress={() => handleDelete(p.id)}
            />
          ))
        )}
      </ListSection>

      <Text style={styles.sectionTitle}>データ管理</Text>
      <ListSection>
        <ListItem
          icon={Download}
          title="データのエクスポート"
          subtitle="JSON形式で保存"
          isLast
        />
      </ListSection>

      {/* Add Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={typography.h2}>新規商品の追加</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>商品名</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例: ツナマヨおにぎり"
              />

              <Text style={styles.inputLabel}>JANコード</Text>
              <View style={styles.janRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={jan}
                  onChangeText={setJan}
                  placeholder="13桁のバーコード数値"
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.scanBtn} onPress={handleScanPress}>
                  <CameraIcon size={20} color={colors.surface} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>価格</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="148"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>標準発注数</Text>
                  <TextInput
                    style={styles.input}
                    value={baseOrder}
                    onChangeText={setBaseOrder}
                    placeholder="20"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddProduct}>
                <Text style={styles.submitBtnText}>商品を登録する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* JAN Barcode Scanner — full-screen overlay */}
      {isScanningJan && (
        <View style={styles.scannerOverlay}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleJanScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
          />
          <View style={styles.scannerUI}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>JANコードを枠内に合わせてください</Text>
            <TouchableOpacity style={styles.scanCloseBtn} onPress={() => setIsScanningJan(false)}>
              <X color={colors.surface} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 20,
    marginTop: 16,
  },
  inlineInput: {
    textAlign: 'right',
    fontSize: 16,
    color: colors.text,
    minWidth: 150,
    paddingVertical: 4,
  },
  emptyContainer: { padding: 40, alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 60,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  form: { gap: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  janRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scanBtn: {
    backgroundColor: colors.text,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: colors.text,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  // Full-screen scanner
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  scannerUI: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: 16,
  },
  scanHint: { color: colors.surface, marginTop: 20, fontWeight: '600', fontSize: 14 },
  scanCloseBtn: { position: 'absolute', top: 60, right: 30 },
});
