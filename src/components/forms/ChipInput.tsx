import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Plus, X } from 'lucide-react-native';

interface ChipInputProps {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  label,
  items,
  onAdd,
  onRemove,
  placeholder = 'Add new...',
}) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          onSubmitEditing={handleAdd}
          style={[
            styles.input,
            { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary },
          ]}
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <Plus size={18} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.chipsWrap}>
        {items.map((item, idx) => (
          <View
            key={idx}
            style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
          >
            <Text style={[styles.chipText, { color: colors.textPrimary }]}>{item}</Text>
            <TouchableOpacity onPress={() => onRemove(idx)} style={{ marginLeft: 6 }}>
              <X size={14} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
