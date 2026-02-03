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
  onSignupSuccess?: (token: string) => void;
  onBackToLogin?: () => void;
};

const SignupScreen = ({ onSignupSuccess, onBackToLogin }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !inviteCode.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setIsLoading(true);
    const res = await authService.signup(name.trim(), email.trim(), password.trim(), inviteCode.trim());
    setIsLoading(false);
    if (res.error || !res.token) {
      setError(res.error || 'Signup failed');
      return;
    }
    onSignupSuccess?.(res.token);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Use your invite code to join Divya Darshak.</Text>

          <View style={styles.form}>
            <LabeledInput label="Name" value={name} onChangeText={setName} placeholder="Enter your name" />
            <LabeledInput label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" />
            <LabeledInput label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
            <LabeledInput label="Invite Code" value={inviteCode} onChangeText={setInviteCode} placeholder="Enter invite code" />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={isLoading ? 'Signing up...' : 'Sign Up'}
            onPress={onSubmit}
            disabled={isLoading}
          />

          <Text style={styles.link} onPress={onBackToLogin}>
            Already have an account? Log in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
};

const LabeledInput = ({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: InputProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      style={styles.input}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 500,
    padding: 20,
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
  link: { marginTop: 8, color: '#2563eb', fontWeight: '600', textAlign: 'center' },
});

export default SignupScreen;
