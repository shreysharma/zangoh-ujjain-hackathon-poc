import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Button from './common/Button';
import { authService } from '../services/authService';

type Props = {
  onLoginSuccess?: (token: string) => void;
  onSignup?: () => void;
  onInvite?: () => void;
};

const LoginScreen = ({ onLoginSuccess, onSignup, onInvite }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setNotice('');
    setIsLoading(true);
    const res = await authService.login(email.trim(), password.trim());
    setIsLoading(false);
    if (res.error || !res.token) {
      setError(res.error || 'Login failed');
      console.log('[login] error', res.error);
      return;
    }
    console.log('[login] success, token received');
    setNotice('Login successful. Redirecting...');
    onLoginSuccess?.(res.token);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to DivyaDarshak</Text>
            <Text style={styles.subtitle}>Log in to continue to your account</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Id</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter your email"
              placeholderTextColor="#808080"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="Enter your password"
                placeholderTextColor="#808080"
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.toggle}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.66 0 3 1.34 3 3 0 .74-.27 1.42-.72 1.94M6.18 6.19C4.32 7.56 3 9.38 3 12c0 0 3 6 9 6 1.57 0 3-.4 4.3-1.1M13.73 13.73a3 3 0 01-4.24-4.24M9.88 9.88L5.1 5.1M14.12 14.12L18.9 18.9M12 6c5.14 0 9 6 9 6-.46.92-1 1.74-1.6 2.45"
                      stroke="#666666"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"
                      stroke="#666666"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke="#666666"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </Pressable>
            </View>
          </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

      <Button
        title={isLoading ? 'Logging in...' : 'Log In'}
        onPress={onSubmit}
        disabled={isLoading}
      />

      <View style={styles.linksRow}>
        <Text style={styles.linkText} onPress={onSignup}>
          Need an account? Sign up
        </Text>
        {/* <Text style={styles.linkText} onPress={onInvite}>
          Need an invite? Generate one
        </Text> */}
      </View>
    </View>

  </ScrollView>
</KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    display: 'flex',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#282828',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#282828',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#B3B3B3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000000',
  },
  toggle: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 4,
    marginBottom: 8,
  },
  noticeText: {
    color: '#16a34a',
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
  linksRow: {
    marginTop: 12,
    gap: 6,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  homeBarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  homeBar: {
    width: 170,
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 999,
  },
});

export default LoginScreen;
