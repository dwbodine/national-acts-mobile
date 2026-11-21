import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { request } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";

export interface EventTicket {
  ticketPartnerOrderTicketId: number;
  barcode?: string;
  ticketType?: string;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  isCheckedIn?: boolean;
  checkedInDate?: string;
  isActive?: boolean;
  isRefunded?: boolean;
  isChargedBack?: boolean;
}
export interface EventOrder {
  ticketPartnerOrderId: number;
  purchaserFirstName?: string;
  purchaserLastName?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  tickets?: EventTicket[];
}
export interface EventVenue {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
export interface SellerEvent {
  eventId?: number;
  originalEventId: number;
  eventTitle?: string;
  title?: string;
  eventDate?: string;
  venue?: EventVenue;
  orders?: EventOrder[];
}
type Entry = { events: SellerEvent[]; fetchedAt: number };
function useStore(token: string) {
  const [entries, setEntries] = useState<Record<number, Entry>>({});
  const cache = useRef<Record<number, Entry>>({});
  const pending = useRef(new Map<number, Promise<SellerEvent[]>>());
  const [sellerId, setSellerId] = useState<number>();
  const [eventId, setEventId] = useState<number>();
  const load = useCallback(
    (id: number, force = false): Promise<SellerEvent[]> => {
      const running = pending.current.get(id);
      if (running) return running;
      const saved = cache.current[id];
      if (!force && saved && Date.now() - saved.fetchedAt < 60000)
        return Promise.resolve(saved.events);
      const promise = request(
        `/events/getEventsAndOrders?portal=1&sellerId=${id}`,
        { token, method: "GET" },
      )
        .then((data) => {
          if (
            !Array.isArray(data) ||
            data.some(
              (event) => !event || typeof event.originalEventId !== "number",
            )
          )
            throw new Error("Unexpected event response. Please retry.");
          const events = data as SellerEvent[];
          cache.current = {
            ...cache.current,
            [id]: { events, fetchedAt: Date.now() },
          };
          setEntries(cache.current);
          return events;
        })
        .finally(() => {
          pending.current.delete(id);
        });
      pending.current.set(id, promise);
      return promise;
    },
    [token],
  );
  // Wait out an older fetch before requesting authoritative post-check-in data.
  async function refreshAfterCheckIn(ticket?: {
    ticketId: string;
    checkInStatus: number;
    checkInTime?: string;
  }) {
    cache.current = Object.fromEntries(
      Object.entries(cache.current).map(([id, entry]) => [
        id,
        {
          fetchedAt: 0,
          events: entry.events.map((event) => ({
            ...event,
            orders: event.orders?.map((order) => ({
              ...order,
              tickets: order.tickets?.map((item) =>
                ticket &&
                (ticket.checkInStatus === 1 || ticket.checkInStatus === 2) &&
                item.barcode === ticket.ticketId
                  ? {
                      ...item,
                      isCheckedIn: true,
                      checkedInDate: ticket.checkInTime ?? item.checkedInDate,
                    }
                  : item,
              ),
            })),
          })),
        },
      ]),
    );
    setEntries(cache.current);
    const ids = Object.keys(cache.current).map(Number);
    ids.forEach((id) => {
      cache.current[id] = { ...cache.current[id], fetchedAt: 0 };
    });
    await Promise.all(
      ids.map(async (id) => {
        await pending.current.get(id)?.catch(() => {});
        await load(id, true);
      }),
    );
  }
  return {
    entries,
    sellerId,
    eventId,
    load,
    refreshAfterCheckIn,
    selectSeller: (id: number) => {
      setSellerId(id);
      setEventId(undefined);
    },
    selectEvent: setEventId,
  };
}
const Context = createContext<ReturnType<typeof useStore> | null>(null);
function SessionStore({
  children,
  token,
}: React.PropsWithChildren<{ token: string }>) {
  return (
    <Context.Provider value={useStore(token)}>{children}</Context.Provider>
  );
}
export function EventsProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  return (
    <SessionStore
      key={`${user?.userId}:${user?.token}`}
      token={user?.token ?? ""}
    >
      {children}
    </SessionStore>
  );
}
export function useEvents() {
  const value = useContext(Context);
  if (!value) throw new Error("EventsProvider is missing.");
  return value;
}
