import { request } from '../../api/client';
import { parseCheckIn } from './ticket';
export async function checkIn(ticketId: string, token: string) {
  return parseCheckIn(await request(`/mobile/ticket/checkin/${encodeURIComponent(ticketId)}`, { token }));
}
