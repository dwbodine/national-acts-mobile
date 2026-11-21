import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "./src/auth/AuthProvider";
import { LoginScreen } from "./src/auth/LoginScreen";
import { features } from "./src/features/registry";
import { colors, styles } from "./src/components/ui";
export default function Shell() {
  const { user, loading, logout } = useAuth();
  const { feature: selected = features[0].id } = useLocalSearchParams<{
    feature?: string;
  }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const Feature = (
    features.find((feature) => feature.id === selected) ?? features[0]
  ).component;
  return (
    <SafeAreaView style={styles.page}>
      <View
        style={{
          minHeight: 76,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 18,
          backgroundColor: colors.panel,
        }}
      >
        {user && features.length > 1 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open functions menu"
            onPress={() => setMenuOpen(true)}
            style={{ padding: 10 }}
          >
            <Text style={{ color: colors.text, fontSize: 28 }}>☰</Text>
          </Pressable>
        )}
        <Image
          source={require("./assets/logo.png")}
          accessibilityLabel="National Acts"
          resizeMode="contain"
          style={{ width: 150, height: 52 }}
        />
        {!!user && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenuOpen(false);
              void logout().catch(() =>
                Alert.alert(
                  "Storage error",
                  "Unable to clear saved session. Please retry sign out.",
                ),
              );
            }}
            style={{ marginLeft: "auto", padding: 12 }}
          >
            <Text style={{ color: colors.accent }}>Sign out</Text>
          </Pressable>
        )}
      </View>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : user ? (
        <Feature key={selected} />
      ) : (
        <LoginScreen />
      )}
      <Modal
        visible={!!user && menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000b",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.panel,
              padding: 24,
              borderRadius: 16,
              gap: 20,
            }}
          >
            <Text style={styles.title}>Functions</Text>
            {features.map((feature) => (
              <Pressable
                accessibilityRole="button"
                key={feature.id}
                onPress={() => {
                  router.replace({
                    pathname: "/[feature]",
                    params: { feature: feature.id },
                  });
                  setMenuOpen(false);
                }}
              >
                <Text style={styles.text}>{feature.title}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setMenuOpen(false)}
            >
              <Text style={{ color: colors.accent }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
