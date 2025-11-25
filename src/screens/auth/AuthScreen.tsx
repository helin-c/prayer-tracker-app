// src/screens/auth/AuthScreen.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        settings.language === "tr" ? "Eksik bilgi" : "Missing information",
        settings.language === "tr"
          ? "Lütfen e-posta ve şifreyi gir."
          : "Please enter both email and password."
      );
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>{t.auth.title}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
        </Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, isLogin && styles.toggleChipActive]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[
                styles.toggleText,
                isLogin && styles.toggleTextActive,
              ]}
            >
              {t.auth.login}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleChip,
              !isLogin && styles.toggleChipActive,
            ]}
            onPress={() => setMode("register")}
          >
            <Text
              style={[
                styles.toggleText,
                !isLogin && styles.toggleTextActive,
              ]}
            >
              {t.auth.register}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t.auth.email}</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={palette.textMuted}
          />

          <Text style={styles.label}>{t.auth.password}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={palette.textMuted}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? t.auth.loginButton : t.auth.registerButton}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 24,
    },
    toggleRow: {
      flexDirection: "row",
      marginBottom: 24,
    },
    toggleChip: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      marginRight: 8,
    },
    toggleChipActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    toggleText: {
      color: palette.textSecondary,
      fontWeight: "500",
    },
    toggleTextActive: {
      color: "#ffffff",
    },
    form: {
      marginTop: 8,
    },
    label: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 4,
      marginTop: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: palette.textPrimary,
      backgroundColor: palette.card,
    },
    button: {
      marginTop: 24,
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: palette.accent,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 16,
    },
  });
