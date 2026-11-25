import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../components/ui";
import type { EventTicket } from "./EventsProvider";

export function CheckInSummary({ tickets }: { tickets: EventTicket[] }) {
  const byType = new Map<string, { checkedIn: number; total: number }>();
  for (const ticket of tickets) {
    const type = ticket.ticketType?.trim() || "Ticket";
    const counts = byType.get(type) ?? { checkedIn: 0, total: 0 };
    counts.total += 1;
    if (ticket.isCheckedIn) counts.checkedIn += 1;
    byType.set(type, counts);
  }
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.title, { fontSize: 22 }]}>Check-ins</Text>
      {Array.from(byType, ([type, counts]) => (
        <Text key={type} style={styles.text}>
          {type}: {counts.checkedIn}/{counts.total}
        </Text>
      ))}
    </View>
  );
}
