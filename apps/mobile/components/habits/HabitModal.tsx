// apps/mobile/components/habits/HabitModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, colors, spacing, radius, fontFamilies, fontSizes } from '@estoicismo/ui';
import { HABIT_COLORS, HABIT_EMOJIS } from '../../types/habits';
import type { Habit, CreateHabitInput, Frequency } from '../../types/habits';

interface Props {
  visible: boolean;
  habit?: Habit;           // If provided: edit mode. Else: create mode.
  onClose: () => void;
  onSave: (input: CreateHabitInput) => void;
  loading?: boolean;
}

const FREQ_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Diario', value: 'daily' },
  { label: '3×/sem', value: { times: 3, period: 'week' } },
  { label: '4×/sem', value: { times: 4, period: 'week' } },
  { label: '5×/sem', value: { times: 5, period: 'week' } },
];

function freqEqual(a: Frequency, b: Frequency): boolean {
  if (a === 'daily' && b === 'daily') return true;
  if (typeof a === 'object' && typeof b === 'object') return a.times === b.times;
  return false;
}

function parseReminderTime(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatReminderTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function HabitModal({ visible, habit, onClose, onSave, loading }: Props) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState<string>(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setFrequency(habit.frequency);
      if (habit.reminder_time) {
        setReminderEnabled(true);
        setReminderDate(parseReminderTime(habit.reminder_time));
      } else {
        setReminderEnabled(false);
      }
    } else {
      setName('');
      setIcon('🎯');
      setColor(HABIT_COLORS[0]);
      setFrequency('daily');
      setReminderEnabled(false);
    }
  }, [habit, visible]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del hábito.');
      return;
    }
    if (name.trim().length > 40) {
      Alert.alert('Nombre muy largo', 'El nombre debe tener máximo 40 caracteres.');
      return;
    }

    const input: CreateHabitInput = {
      name: name.trim(),
      icon,
      color,
      frequency,
      reminder_time: reminderEnabled ? formatReminderTime(reminderDate) : null,
    };

    onSave(input);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Text variant="label" style={{ color: colors.accent }}>
            {habit ? 'EDITAR HÁBITO' : 'NUEVO HÁBITO'}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            style={styles.cancelBtn}
          >
            <Text variant="muted">Cancelar</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre */}
          <Text variant="label" style={styles.fieldLabel}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Meditar 10 min"
            placeholderTextColor={colors.muted}
            maxLength={40}
            returnKeyType="done"
            accessibilityLabel="Nombre del hábito"
          />

          {/* Emoji */}
          <Text variant="label" style={styles.fieldLabel}>EMOJI</Text>
          <View style={styles.emojiGrid}>
            {HABIT_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setIcon(e)}
                accessibilityRole="button"
                accessibilityLabel={e}
                accessibilityState={{ selected: icon === e }}
                style={[styles.emojiOpt, icon === e && styles.emojiOptSel]}
              >
                <Text style={styles.emojiChar}>{e}</Text>
              </Pressable>
            ))}
          </View>

          {/* Color */}
          <Text variant="label" style={styles.fieldLabel}>COLOR</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Color ${c}`}
                accessibilityState={{ selected: color === c }}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSel,
                ]}
              />
            ))}
          </View>

          {/* Frecuencia */}
          <Text variant="label" style={styles.fieldLabel}>FRECUENCIA</Text>
          <View style={styles.freqRow}>
            {FREQ_OPTIONS.map(({ label, value }) => (
              <Pressable
                key={label}
                onPress={() => setFrequency(value)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: freqEqual(frequency, value) }}
                style={[
                  styles.freqOpt,
                  freqEqual(frequency, value) && styles.freqOptSel,
                ]}
              >
                <Text
                  style={[
                    styles.freqLabel,
                    freqEqual(frequency, value) && styles.freqLabelSel,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recordatorio */}
          <Text variant="label" style={styles.fieldLabel}>RECORDATORIO</Text>
          <View style={styles.reminderRow}>
            <Text variant="body" style={{ flex: 1, color: colors.ink }}>
              Notificación diaria
            </Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ true: colors.accent, false: colors.line }}
              thumbColor={colors.bg}
              accessibilityLabel="Activar recordatorio"
            />
          </View>

          {reminderEnabled && (
            <>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="default"
                  onChange={(_, date) => { if (date) setReminderDate(date); }}
                  style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                />
              ) : (
                <Pressable
                  onPress={() => setShowAndroidPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Hora del recordatorio"
                  style={styles.androidTimePicker}
                >
                  <Text style={styles.androidTimeText}>
                    {formatReminderTime(reminderDate)}
                  </Text>
                </Pressable>
              )}
              {showAndroidPicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="default"
                  onChange={(_, date) => {
                    setShowAndroidPicker(false);
                    if (date) setReminderDate(date);
                  }}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button
            variant="primary"
            label={habit ? 'Guardar cambios' : 'Crear hábito'}
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cancelBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.bgAlt,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiOpt: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptSel: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(139,111,71,0.1)',
  },
  emojiChar: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSel: {
    borderWidth: 3,
    borderColor: colors.ink,
  },
  freqRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  freqOpt: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqOptSel: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  freqLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  freqLabelSel: {
    color: colors.bg,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  androidTimePicker: {
    height: 44,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  androidTimeText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
