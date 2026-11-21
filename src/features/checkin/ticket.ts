import moment from "moment";

export interface TicketCheckIn {
  ticketId: string;
  checkInStatus: number;
  checkInTime?: string;
  errorMessage: string;
}

function validate(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,256}$/.test(value))
    throw new Error("QR code does not contain a valid ticketId.");
  return value;
}
// Supported QR contracts: raw ID, {"ticketId":"..."}, or HTTPS URL with ?ticketId=...
export function getTicketId(payload: string): string {
  const value = payload.trim();
  if (value.startsWith("{")) {
    try {
      return validate(JSON.parse(value).ticketId);
    } catch {
      throw new Error("QR code must contain a valid ticketId.");
    }
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      return validate(new URL(value).searchParams.get("ticketId"));
    } catch {
      throw new Error(
        "Ticket URL must include a valid ticketId query parameter.",
      );
    }
  }
  return validate(value);
}
export function parseCheckIn(data: unknown): TicketCheckIn {
  const result = (data as { ticketCheckIn?: unknown })?.ticketCheckIn ?? data;
  const ticket = result as TicketCheckIn | null;
  if (!ticket) throw new Error("Check-in response is missing.");
  if (typeof ticket.ticketId !== "string")
    throw new Error(
      typeof ticket.errorMessage === "string" && ticket.errorMessage.trim()
        ? `Invalid ticket - ${ticket.errorMessage.trim()}`
        : "Invalid ticket",
    );
  if (!Number.isInteger(ticket.checkInStatus))
    throw new Error("Invalid check-in status.");
  if (ticket.checkInStatus === 4 && typeof ticket.errorMessage !== "string")
    throw new Error("Unexpected check-in response from the server.");
  return ticket;
}

export function resultMessage(ticket: TicketCheckIn): string {
  const time = ticket.checkInTime
    ? moment(ticket.checkInTime).format("h:mm A")
    : "";
  let msg = "";
  switch (ticket.checkInStatus) {
    case 1:
      msg = "Checked in";
      if (time) msg += ` at ${time}`;
      break;
    case 2:
      msg = "Already checked in";
      if (time) msg += ` at ${time}`;
      break;
    case 3:
      msg = "Not a valid ticket number";
      if (typeof ticket.errorMessage === "string" && ticket.errorMessage.trim())
        msg += `. ${ticket.errorMessage.trim()}`;
      break;
    default:
      msg = ticket.errorMessage || "Unable to check in this ticket.";
      break;
  }
  return msg;
}
