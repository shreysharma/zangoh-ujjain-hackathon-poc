import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from './common/Button';
import { authService } from '../services/authService';

type Props = {
  onBack?: () => void;
};

const InviteScreen = ({ onBack }: Props) => {
  const [role, setRole] = useState('user');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createInvite = async () => {
    setError('');
    setInviteCode(null);
    setLoading(true);
    const res = await authService.createInvite(role || 'user');
    setLoading(false);
    if (res.error || !res.code) {
      setError(res.error || 'Invite creation failed');
      return;
    }
    setInviteCode(res.code);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Create Invite Code</Text>
          <Text style={styles.subtitle}>Generate an invite for a new user.</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Role</Text>
              <TextInput
                value={role}
                onChangeText={setRole}
                placeholder="user"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {inviteCode ? (
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>Invite Code</Text>
              <Text style={styles.inviteValue}>{inviteCode}</Text>
            </View>
          ) : null}

          <Button
            title={loading ? 'Creating...' : 'Create Invite'}
            onPress={createInvite}
            disabled={loading}
          />

          <Text style={styles.link} onPress={onBack}>
            Back to Login
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center' },
  form: { gap: 12, marginTop: 8 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  error: { color: '#dc2626', fontSize: 13 },
  inviteBox: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  inviteLabel: { fontSize: 12, color: '#92400e', fontWeight: '700' },
  inviteValue: { marginTop: 4, fontSize: 16, color: '#7c2d12', fontWeight: '700' },
  link: { marginTop: 8, color: '#2563eb', fontWeight: '600', textAlign: 'center' },
});

export default InviteScreen;
