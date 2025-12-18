// @ts-nocheck
// ============================================================================
// FILE: src/screens/tracker/TasbihScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Vibration,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTasbihStore } from '../../store/tasbihStore';

export const TasbihScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    currentCount,
    targetCount,
    zikrName,
    sessionId,
    increment,
    startNewSession,
    saveSession,
    resetCounter,
    completeReset,
    updateSessionSettings,
  } = useTasbihStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempTarget, setTempTarget] = useState('');

  // YENİ: Kaydetme işlemi sırasında loading durumu
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState({ visible: false, text: '' });

  const showToast = (text) => {
    setToast({ visible: true, text });
    setTimeout(() => setToast({ visible: false, text: '' }), 2200);
  };

  // Common zikr presets with translation
  const PRESETS = [
    {
      name: t('tasbih.presets.subhanallah'),
      translation: t('tasbih.presets.subhanallahTrans'),
      target: 33,
    },
    {
      name: t('tasbih.presets.alhamdulillah'),
      translation: t('tasbih.presets.alhamdulillahTrans'),
      target: 33,
    },
    {
      name: t('tasbih.presets.allahuAkbar'),
      translation: t('tasbih.presets.allahuAkbarTrans'),
      target: 34,
    },
    {
      name: t('tasbih.presets.laIlahaIllallah'),
      translation: t('tasbih.presets.laIlahaIllallahTrans'),
      target: 100,
    },
    {
      name: t('tasbih.presets.astaghfirullah'),
      translation: t('tasbih.presets.astaghfirullahTrans'),
      target: 100,
    },
  ];

  // Calculate progress
  const hasTarget = targetCount > 0;
  const progress = hasTarget
    ? Math.min((currentCount / targetCount) * 100, 100)
    : 0;
  const isTargetReached = hasTarget && currentCount >= targetCount;

  // Haptic feedback on count
  const handleIncrement = () => {
    increment();

    // Vibrate on milestones
    const nextCount = currentCount + 1;
    if (nextCount % 33 === 0 || (hasTarget && nextCount === targetCount)) {
      Vibration.vibrate(100);
    }
  };

  // Quick select preset
  const handlePresetSelect = (preset) => {
    startNewSession(preset.name, preset.target);
  };

  // Open settings modal
  const handleOpenSettings = () => {
    setTempName(zikrName);
    setTempTarget(targetCount > 0 ? targetCount.toString() : '');
    setShowSettingsModal(true);
  };

  // Apply settings
  const handleApplySettings = () => {
    const name = tempName.trim();
    const target = parseInt(tempTarget) || 0;

    updateSessionSettings(name, target);
    setShowSettingsModal(false);
  };

  // Reset with confirmation
  const handleReset = () => {
    if (currentCount === 0) return;

    Alert.alert(
      t('tasbih.alerts.resetCounter'),
      t('tasbih.alerts.resetMessage'),
      [
        { text: t('tasbih.alerts.cancel'), style: 'cancel' },
        {
          text: t('tasbih.alerts.reset'),
          style: 'destructive',
          onPress: resetCounter,
        },
      ]
    );
  };

  // Complete reset with confirmation
  const handleCompleteReset = () => {
    Alert.alert(
      t('tasbih.alerts.clearEverything'),
      t('tasbih.alerts.clearMessage'),
      [
        { text: t('tasbih.alerts.cancel'), style: 'cancel' },
        {
          text: t('tasbih.alerts.clearAll'),
          style: 'destructive',
          onPress: completeReset,
        },
      ]
    );
  };

  // Save session with Loading State
  const handleSave = async () => {
    if (isSaving) return; // Çift tıklamayı önle

    setIsSaving(true);
    try {
      await saveSession();
      // Başarılı olduğunda
      showToast(
        sessionId
          ? t('tasbih.alerts.progressUpdated')
          : t('tasbih.alerts.zikrSaved')
      );
      setShowSaveModal(false);
    } catch (error) {
      console.error(error);
      showToast(t('tasbih.alerts.error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Open save modal
  const handleOpenSaveModal = () => {
    if (currentCount === 0) {
      Alert.alert(
        t('tasbih.alerts.nothingToSave'),
        t('tasbih.alerts.countFirst')
      );
      return;
    }

    if (!zikrName.trim()) {
      Alert.alert(
        t('tasbih.alerts.nameRequired'),
        t('tasbih.alerts.setNameFirst'),
        [
          { text: t('tasbih.alerts.cancel'), style: 'cancel' },
          { text: t('tasbih.alerts.setName'), onPress: handleOpenSettings },
        ]
      );
      return;
    }

    setShowSaveModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tasbih.title')}</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ZikrHistory')}
        >
          <Ionicons name="time-outline" size={24} color="#00A86B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Zikr Info */}
        <TouchableOpacity
          style={styles.zikrInfoCard}
          onPress={handleOpenSettings}
          activeOpacity={0.7}
        >
          <View style={styles.zikrInfoLeft}>
            {zikrName ? (
              <>
                <Text style={styles.zikrNameText}>{zikrName}</Text>
                {hasTarget && (
                  <Text style={styles.zikrTargetText}>
                    {t('tasbih.target')}: {targetCount}
                  </Text>
                )}
                {sessionId && (
                  <View style={styles.continuingBadge}>
                    <Ionicons name="sync" size={12} color="#3498DB" />
                    <Text style={styles.continuingText}>
                      {t('tasbih.continuingSession')}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.zikrPlaceholder}>
                {t('tasbih.setNameTarget')}
              </Text>
            )}
          </View>
          <Ionicons name="settings-outline" size={20} color="#666" />
        </TouchableOpacity>

        {/* Main Counter */}
        <View style={styles.counterSection}>
          <View
            style={[
              styles.counterCircle,
              isTargetReached && styles.counterCircleComplete,
            ]}
          >
            <Text style={styles.counterText}>{currentCount}</Text>
            {hasTarget && (
              <Text style={styles.targetText}>/ {targetCount}</Text>
            )}

            {isTargetReached && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#00A86B" />
              </View>
            )}
          </View>

          {/* Progress Bar */}
          {hasTarget && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
        </View>

        {/* Main Action - Counter Button */}
        <TouchableOpacity
          style={styles.incrementButton}
          onPress={handleIncrement}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={64} color="#FFF" />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleOpenSaveModal}
          >
            <Ionicons name="bookmark" size={20} color="#00A86B" />
            <Text style={[styles.actionButtonText, { color: '#00A86B' }]}>
              {t('tasbih.save')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color="#F39C12" />
            <Text style={[styles.actionButtonText, { color: '#F39C12' }]}>
              {t('tasbih.reset')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleCompleteReset}
          >
            <Ionicons name="close-circle" size={20} color="#DC3545" />
            <Text style={[styles.actionButtonText, { color: '#DC3545' }]}>
              {t('tasbih.clear')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionTitle}>{t('tasbih.quickStart')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('tasbih.quickStartSubtitle')}
          </Text>

          {PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetCard}
              onPress={() => handlePresetSelect(preset)}
              activeOpacity={0.7}
            >
              <View style={styles.presetLeft}>
                <Text style={styles.presetArabic}>{preset.name}</Text>
                <Text style={styles.presetTranslation}>
                  {preset.translation}
                </Text>
              </View>
              <View style={styles.presetRight}>
                <View style={styles.presetTargetBadge}>
                  <Text style={styles.presetTargetText}>×{preset.target}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <View style={styles.modalContent}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {t('tasbih.settings')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowSettingsModal(false)}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>{t('tasbih.name')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder={t('tasbih.namePlaceholder')}
                    placeholderTextColor="#999"
                    returnKeyType="next"
                  />

                  <Text style={styles.inputLabel}>
                    {t('tasbih.targetOptional')}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempTarget}
                    onChangeText={setTempTarget}
                    placeholder={t('tasbih.targetPlaceholder')}
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />

                  <View style={styles.quickTargets}>
                    {[33, 99, 100, 500, 1000].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={styles.quickTargetButton}
                        onPress={() => setTempTarget(num.toString())}
                      >
                        <Text style={styles.quickTargetText}>{num}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.modalApplyButton}
                    onPress={handleApplySettings}
                  >
                    <Text style={styles.modalApplyButtonText}>
                      {t('tasbih.apply')}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ height: 16 }} />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Save Confirmation Modal - GÜNCELLENDİ (Spinner Eklendi) */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isSaving && setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="bookmark"
              size={48}
              color="#00A86B"
              style={{ alignSelf: 'center', marginBottom: 16 }}
            />

            <Text style={styles.modalTitle}>
              {sessionId
                ? t('tasbih.saveModal.updateSession')
                : t('tasbih.saveModal.saveSession')}
            </Text>

            <View style={styles.saveInfoCard}>
              <View style={styles.saveInfoRow}>
                <Text style={styles.saveInfoLabel}>
                  {t('tasbih.saveModal.zikr')}
                </Text>
                <Text style={styles.saveInfoValue}>{zikrName}</Text>
              </View>
              <View style={styles.saveInfoRow}>
                <Text style={styles.saveInfoLabel}>
                  {t('tasbih.saveModal.count')}
                </Text>
                <Text style={styles.saveInfoValue}>{currentCount}</Text>
              </View>
              {hasTarget && (
                <View style={styles.saveInfoRow}>
                  <Text style={styles.saveInfoLabel}>
                    {t('tasbih.saveModal.target')}
                  </Text>
                  <Text style={styles.saveInfoValue}>{targetCount}</Text>
                </View>
              )}
            </View>

            <Text style={styles.modalSubtitle}>
              {sessionId
                ? t('tasbih.saveModal.updateMessage')
                : t('tasbih.saveModal.saveMessage')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  isSaving && { opacity: 0.5 }, // Kayıt sırasında soluklaştır
                ]}
                onPress={() => setShowSaveModal(false)}
                disabled={isSaving} // Kayıt sırasında disable et
              >
                <Text style={styles.modalButtonTextCancel}>
                  {t('tasbih.saveModal.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSave}
                disabled={isSaving} // Çift tıklamayı engelle
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>
                    {sessionId
                      ? t('tasbih.saveModal.update')
                      : t('tasbih.saveModal.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toast.visible && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#4F6F64" />
            <Text style={styles.toastText}>{toast.text}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  historyButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  zikrInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  zikrInfoLeft: {
    flex: 1,
  },
  zikrNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  zikrTargetText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  zikrPlaceholder: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  continuingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  continuingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3498DB',
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  counterCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
    position: 'relative',
  },
  counterCircleComplete: {
    shadowColor: '#00A86B',
    shadowOpacity: 0.3,
    borderWidth: 3,
    borderColor: '#00A86B',
  },
  counterText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  targetText: {
    fontSize: 20,
    color: '#666',
    marginTop: -4,
  },
  completeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(224, 224, 224, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00A86B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A86B',
  },
  incrementButton: {
    width: 100,
    height: 100,
    borderRadius: 70,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    borderColor: '#00A86B',
  },
  resetButton: {
    borderColor: '#F39C12',
  },
  clearButton: {
    borderColor: '#DC3545',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  presetLeft: {
    flex: 1,
  },
  presetArabic: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  presetTranslation: {
    fontSize: 14,
    color: '#666',
  },
  presetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetTargetBadge: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetTargetText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00A86B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickTargets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickTargetButton: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00A86B',
  },
  quickTargetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A86B',
  },
  modalApplyButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  saveInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  saveInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saveInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  saveInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    height: 52, // Sabit yükseklik, spinner geldiğinde zıplamayı önler
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtonSave: {
    backgroundColor: '#00A86B',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  toastWrap: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(79,111,100,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 240,
  },
  toastText: {
    color: '#4F6F64',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
});
