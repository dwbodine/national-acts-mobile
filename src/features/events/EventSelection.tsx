import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import { Button, colors, styles } from "../../components/ui";
import { useEvents } from "./EventsProvider";

function Dropdown({
  label,
  value,
  options,
  onSelect,
  disabled,
}: {
  label: string;
  value?: number;
  options: { id: number; label: string }[];
  onSelect: (id: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query),
  );
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.text}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => {
          setSearch("");
          setOpen(true);
        }}
        style={[styles.input, { opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={styles.text}>
          {options.find((option) => option.id === value)?.label ??
            `Select ${label.toLowerCase()}`}{" "}
          {"\u25BE"}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "#000b",
          }}
        >
          <View
            style={{
              maxHeight: "80%",
              padding: 20,
              gap: 16,
              backgroundColor: colors.panel,
              borderRadius: 16,
            }}
          >
            <Text style={styles.title}>{label}</Text>
            <TextInput
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${label.toLowerCase()}s`}
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Search ${label.toLowerCase()}s`}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            <FlatList
              data={filteredOptions}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <Text style={styles.text}>No matches found.</Text>
              }
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === item.id }}
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  style={{ paddingVertical: 16 }}
                >
                  <Text style={styles.text}>{item.label}</Text>
                </Pressable>
              )}
            />
            <Button title="Close" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
export function EventSelection() {
  const { user } = useAuth();
  const { sellerId, eventId, entries, selectSeller, selectEvent, load } =
    useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (sellerId === undefined) return;
    void Promise.resolve()
      .then(() => {
        if (!active) return;
        setError("");
        setLoading(true);
        return load(sellerId, retry > 0);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sellerId, load, retry]);
  const events =
    sellerId === undefined ? [] : (entries[sellerId]?.events ?? []);
  return (
    <View style={{ gap: 16 }}>
      <Dropdown
        label="Seller"
        value={sellerId}
        options={(user?.sellers ?? []).map((seller) => ({
          id: seller.sellerId,
          label: seller.sellerName || `Seller ${seller.sellerId}`,
        }))}
        onSelect={selectSeller}
      />
      {!user?.sellers?.length && (
        <Text style={styles.text}>
          No sellers are available. If this is an older saved session, sign out
          and sign in again.
        </Text>
      )}
      <Dropdown
        label="Event"
        value={eventId}
        options={events.map((event) => ({
          id: event.originalEventId,
          label: [
            event.eventTitle || event.title || `Event ${event.originalEventId}`,
            event.eventDate,
            event.venue?.name,
          ]
            .filter(Boolean)
            .join(" - "),
        }))}
        onSelect={selectEvent}
        disabled={
          sellerId === undefined || loading || !!error || !events.length
        }
      />
      {loading && <ActivityIndicator />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {sellerId !== undefined && !loading && !error && !events.length && (
        <Text style={styles.text}>
          No events are available for this seller.
        </Text>
      )}
      {sellerId !== undefined && (
        <Button
          title={loading ? "Refreshing..." : "Refresh events and attendees"}
          disabled={loading}
          onPress={() => setRetry((value) => value + 1)}
        />
      )}
    </View>
  );
}
