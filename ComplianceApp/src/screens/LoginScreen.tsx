import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, TOUCH_TARGETS } from '../theme';

export const LoginScreen = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Authentication Failed", "Please enter valid credentials to proceed.");
      return;
    }
    await login(email, password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.center}>
          <View style={styles.loginCard}>
            <Text style={styles.brand} accessibilityRole="header">Raytheon</Text>
            <Text style={styles.title}>Compliance System</Text>
            <Text style={styles.subtitle}>Secure Site Access Portal</Text>
            
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="e.g. operative@site.com"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Email input field"
              accessibilityHint="Enter your registered work email address"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              accessibilityLabel="Password input field"
              accessibilityHint="Enter your secure password"
            />

            <TouchableOpacity 
              testID="login-submit-btn"
              style={styles.btn} 
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in to live vault"
              accessibilityHint="Authenticates your credentials and opens the dashboard"
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="large" />
              ) : (
                <Text style={styles.btnText}>SIGN IN TO LIVE VAULT</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.m },
  loginCard: { 
    width: '100%', 
    maxWidth: 450,
    padding: SPACING.xl, 
    backgroundColor: COLORS.white, 
    borderRadius: 24, 
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: COLORS.lightGray
  },
  brand: { 
    ...TYPOGRAPHY.caption,
    fontSize: 14, 
    fontWeight: '900', 
    color: COLORS.secondary, 
    letterSpacing: 4, 
    textTransform: 'uppercase', 
    textAlign: 'center' 
  },
  title: { 
    ...TYPOGRAPHY.header, 
    fontSize: 26, 
    textAlign: 'center', 
    marginTop: SPACING.s, 
    color: COLORS.primary 
  },
  subtitle: { 
    ...TYPOGRAPHY.body, 
    color: COLORS.textLight, 
    textAlign: 'center', 
    marginBottom: SPACING.xl,
    fontWeight: '700'
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4
  },
  input: { 
    width: '100%', 
    minHeight: TOUCH_TARGETS.min + 8, 
    backgroundColor: COLORS.background, 
    borderWidth: 2, 
    borderColor: COLORS.lightGray, 
    borderRadius: 12, 
    paddingHorizontal: SPACING.m, 
    marginBottom: SPACING.m,
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.text
  },
  btn: { 
    width: '100%', 
    minHeight: 65,
    backgroundColor: COLORS.primary,
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: SPACING.s,
    ...SHADOWS.light 
  },
  btnText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: 1 
  }
});