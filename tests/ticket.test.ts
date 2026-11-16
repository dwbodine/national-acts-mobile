import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTicketId, parseCheckIn, resultMessage } from '../src/features/checkin/ticket.ts';
test('extracts supported QR payloads', () => {
  for (const value of [' abc-123 ', '{"ticketId":"abc-123"}', 'https://example.com/?ticketId=abc-123']) assert.equal(getTicketId(value), 'abc-123');
});
test('rejects malformed QR values instead of posting them', () => {
  for (const value of ['', '{}', '{bad', 'https://example.com/ticket', '../admin', '{"ticketId":123}', 'https://example.com/?ticketId=a%2Fb']) assert.throws(() => getTicketId(value));
});
test('maps all integer status values and accepts direct or wrapped responses', () => {
  for (const [status, message] of [[1, 'Checked in'], [2, 'Already checked in'], [0, 'Invalid ticket'], [7, 'Invalid ticket']] as const) {
    const ticket = { ticketId: 'abc', checkInStatus: status, errorMessage: 'Invalid ticket' };
    assert.equal(resultMessage(parseCheckIn(ticket)), message);
    assert.deepEqual(parseCheckIn({ ticketCheckIn: ticket }), ticket);
  }
});
test('rejects malformed server responses', () => {
  for (const data of [null, {}, { ticketId: 'a', checkInStatus: '1', errorMessage: '' }, { ticketId: 'a', checkInStatus: 1.2, errorMessage: '' }]) assert.throws(() => parseCheckIn(data));
});

test('formats check-in times with AM/PM without changing the server time zone', () => {
  for (const [time, expected] of [['16:03:15', '4:03 PM'], ['00:03:15', '12:03 AM'], ['12:03:15', '12:03 PM']]) {
    for (const status of [1, 2]) {
      const prefix = status === 1 ? 'Checked in' : 'Already checked in';
      assert.equal(resultMessage({ ticketId: 'abc', checkInStatus: status, errorMessage: '', checkInTime: `2025-07-05 ${time}` }), `${prefix} at ${expected}`);
    }
  }
});
