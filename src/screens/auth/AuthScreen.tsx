import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const error = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert("Login failed", error.message);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    const error = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert("Registration failed", error.message);
    } else {
      Alert.alert(
        "Account created",
        "If email confirmation is enabled, check your inbox."
      );
      setMode("login");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "login" ? "Welcome Back" : "Create Account"}
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Input */}
      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Action Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={mode === "login" ? handleLogin : handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </Text>
      </TouchableOpacity>

      {/* Switch Mode */}
      <TouchableOpacity
        onPress={() =>
          setMode(mode === "login" ? "register" : "login")
        }
      >
        <Text style={styles.switchText}>
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#222",
    borderRadius: 8,
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#22cc5e",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#000",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  switchText: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 10,
  },
});
