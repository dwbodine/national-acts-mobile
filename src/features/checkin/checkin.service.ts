import { config, request } from "../../api/client";
import { parseCheckIn } from "./ticket";
export async function checkIn(
  ticketId: string,
  token: string,
  eventId: number,
) {
  if (!token.trim()) throw new Error("Sign in before checking in tickets.");
  if (!config.apiKey.trim())
    throw new Error("Set EXPO_PUBLIC_API_KEY before checking in tickets.");
  if (!Number.isInteger(eventId) || eventId <= 0)
    throw new Error("Select a valid event before checking in tickets.");
  const response = await request(
    `/mobile/ticket/checkin/${encodeURIComponent(ticketId)}`,
    { token, apiKey: config.apiKey, body: { eventId } },
  );
  return parseCheckIn(response);
}
