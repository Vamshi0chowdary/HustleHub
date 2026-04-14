// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { login, register } from '../services/backendApi';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Body, Subtitle, Title } from '../components/ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

export default function AuthScreen({ navigation }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const resetErrors = () => {
    if (formError) setFormError('');
    if (Object.keys(fieldErrors).length > 0) setFieldErrors({});
  };

  const updateField = (setter) => (value) => {
    resetErrors();
    setter(value);
  };

  const validate = () => {
    const nextErrors = {};

    if (isSignUp && !name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (isSignUp && !username.trim()) {
      nextErrors.username = 'Username is required';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required';
    } else if (password.trim().length < 6) {
      nextErrors.password = 'Use at least 6 characters';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      setFormError('');

      if (isSignUp) {
        await register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          bio: '',
          skills: [],
          level: 'beginner',
        });
      } else {
        await login({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
      }

      navigation.replace('Main');
    } catch (error) {
      setFormError(error?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((prev) => !prev);
    setFormError('');
    setFieldErrors({});
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Title style={[styles.brand, { color: theme.colors.textPrimary }]}>HustleHub</Title>
            <Body style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Build your network. Ship your journey.</Body>
          </View>

          <Card style={styles.formCard}>
            <Subtitle style={[styles.title, { color: theme.colors.textPrimary }]}>
              {isSignUp ? 'Create account' : 'Welcome back'}
            </Subtitle>

            {formError ? <Text style={[styles.formError, { color: theme.colors.danger }]}>{formError}</Text> : null}

            {isSignUp ? (
              <>
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={name}
                  onChangeText={updateField(setName)}
                  error={fieldErrors.name}
                />
                <Input
                  label="Username"
                  placeholder="username"
                  value={username}
                  onChangeText={updateField(setUsername)}
                  error={fieldErrors.username}
                />
              </>
            ) : null}

            <Input
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChangeText={updateField(setEmail)}
              keyboardType="email-address"
              autoComplete="email"
              error={fieldErrors.email}
            />

            <Input
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={updateField(setPassword)}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'password'}
              error={fieldErrors.password}
            />

            <Button
              title={isSignUp ? 'Create account' : 'Sign in'}
              onPress={handleAuth}
              loading={loading}
              style={styles.submitButton}
            />

            <Button
              title={isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              onPress={switchMode}
              variant="secondary"
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerBlock: {
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  brand: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
  },
  formCard: {
    padding: 20,
    borderRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  formError: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  submitButton: {
    marginTop: 6,
    marginBottom: 12,
  },
});