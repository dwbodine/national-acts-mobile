import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, styles, colors } from "../../components/ui";
import { EventSelection } from "./EventSelection";
import { useEvents } from "./EventsProvider";
import { useAuth } from "../../auth/AuthProvider";
import { checkIn } from "../checkin/checkin.service";
import { formatCheckInDate } from "./checkin-date";
import { resultMessage } from "../checkin/ticket";

export function AttendeesScreen() {
  const { entries, sellerId, eventId, refreshAfterCheckIn } = useEvents();
  const { user } = useAuth();
  const [confirmation, setConfirmation] = useState<{
    name: string;
    barcode: string;
    eventId: number;
    eventTitle: string;
    orderId: number;
    ticketType: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    success: boolean;
  } | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function confirmCheckIn() {
    if (locked.current || !confirmation || !user?.token || user.disableCheckIn)
      return;
    locked.current = true;
    setBusy(true);
    try {
      const result = await checkIn(
        confirmation.barcode,
        user.token,
        confirmation.eventId,
      );
      if (result.ticketId !== confirmation.barcode)
        throw new Error(
          "Server returned a different ticket. Please verify with staff.",
        );
      const success = result.checkInStatus === 1 || result.checkInStatus === 2;
      let text = resultMessage(result);
      if (success) {
        try {
          await refreshAfterCheckIn(result);
        } catch {
          text +=
            ". Check-in was recorded, but attendee refresh failed. Refresh events to confirm the latest list.";
        }
      }
      if (mounted.current) setFeedback({ text, success });
    } catch (error) {
      if (mounted.current)
        setFeedback({
          text:
            error instanceof Error
              ? error.message
              : "Unable to check in. Check your connection.",
          success: false,
        });
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const [search, setSearch] = useState("");
  const event =
    sellerId === undefined
      ? undefined
      : entries[sellerId]?.events.find(
          (item) => item.originalEventId === eventId,
        );
  const attendees = (event?.orders ?? []).flatMap((order) =>
    (order.tickets ?? []).map((ticket) => ({
      ticket,
      order,
      name:
        [
          ticket.attendeeFirstName || order.purchaserFirstName,
          ticket.attendeeLastName || order.purchaserLastName,
        ]
          .filter(Boolean)
          .join(" ") || "Unnamed attendee",
    })),
  );
  const filtered = attendees.filter((item) =>
    `${item.name} ${item.order.ticketPartnerOrderId} ${item.ticket.ticketType ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <>
      <FlatList
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item) =>
          `${item.order.ticketPartnerOrderId}:${item.ticket.ticketPartnerOrderTicketId}`
        }
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 18 }}>
            <Text style={styles.title}>Event attendees</Text>
            <EventSelection />
            {event && (
              <>
                <Text style={styles.text}>
                  {attendees.filter((item) => item.ticket.isCheckedIn).length}{" "}
                  checked in out of {attendees.length} tickets
                </Text>
                <TextInput
                  style={styles.input}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name, order or ticket type"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Search attendees"
                />
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.text}>
            {event
              ? "No attendees match."
              : "Select a seller and event to view attendees."}
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              marginBottom: 12,
              gap: 6,
              backgroundColor: colors.panel,
              borderRadius: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Check in ${item.name}`}
              disabled={
                busy ||
                item.ticket.isCheckedIn ||
                !item.ticket.barcode ||
                !event?.eventId ||
                !user?.token ||
                user.disableCheckIn ||
                item.ticket.isActive === false ||
                item.order.isActive === false ||
                item.order.isDeleted ||
                item.ticket.isRefunded ||
                item.ticket.isChargedBack
              }
              onPress={() => {
                if (!event?.eventId || !item.ticket.barcode) return;
                setFeedback(null);
                setConfirmation({
                  name: item.name,
                  barcode: item.ticket.barcode,
                  eventId: event.eventId,
                  eventTitle:
                    event.eventTitle || event.title || `Event ${event.eventId}`,
                  orderId: item.order.ticketPartnerOrderId,
                  ticketType: item.ticket.ticketType || "Ticket",
                });
              }}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text
                style={[
                  styles.text,
                  { color: item.ticket.isCheckedIn ? colors.muted : colors.accent, fontWeight: "700" },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
            <Text style={styles.text}>
              Order {item.order.ticketPartnerOrderId} -{" "}
              {item.ticket.ticketType || "Ticket"} -{" "}
              {item.ticket.barcode || "No barcode"}
            </Text>
            <Text style={styles.text}>
              {item.ticket.isCheckedIn
                ? `Checked in${item.ticket.checkedInDate ? ` at ${formatCheckInDate(item.ticket.checkedInDate)}` : ""}`
                : "Not checked in"}
            </Text>
            {(item.ticket.isActive === false ||
              item.order.isActive === false ||
              item.order.isDeleted ||
              item.ticket.isRefunded ||
              item.ticket.isChargedBack) && (
              <Text style={styles.error}>
                Inactive, refunded or charged back
              </Text>
            )}
          </View>
        )}
      />
      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!locked.current) setConfirmation(null);
        }}
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
            accessibilityViewIsModal
            style={{
              padding: 24,
              gap: 16,
              backgroundColor: colors.panel,
              borderRadius: 16,
            }}
          >
            <Text style={styles.title}>
              {feedback ? "Check-in result" : "Check in attendee?"}
            </Text>
            <Text style={styles.text}>{confirmation?.name}</Text>
            <Text style={styles.text}>{confirmation?.eventTitle}</Text>
            <Text style={styles.text}>
              Order {confirmation?.orderId} - {confirmation?.ticketType}
            </Text>
            <Text style={styles.text}>Ticket: {confirmation?.barcode}</Text>
            {feedback ? (
              <>
                <Text
                  accessibilityLiveRegion="polite"
                  style={feedback.success ? styles.text : styles.error}
                >
                  {feedback.text}
                </Text>
                <Button title="Close" onPress={() => setConfirmation(null)} />
              </>
            ) : (
              <>
                <Text style={styles.text}>
                  Confirm manual check-in for this ticket.
                </Text>
                {busy && (
                  <ActivityIndicator accessibilityLabel="Checking in attendee" />
                )}
                <Button
                  title={busy ? "Checking in..." : "Confirm check-in"}
                  disabled={busy || !user?.token || user.disableCheckIn}
                  onPress={() => void confirmCheckIn()}
                />
                <Button
                  title="Cancel"
                  disabled={busy}
                  onPress={() => setConfirmation(null)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
