import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatCheckInDate } from '../src/features/events/checkin-date.ts';

test('attendee timestamps retain the supplied time, including genuine midnight', () => {
  assert.equal(formatCheckInDate('2026-11-21 16:23:45'), '11/21/2026 4:23 PM');
  assert.equal(formatCheckInDate('2026-11-21 00:00:00'), '11/21/2026 12:00 AM');
  assert.equal(formatCheckInDate('2026-11-21T16:23:45-08:00'), '11/21/2026 4:23 PM');
});

test('date-only and invalid responses do not invent a midnight check-in', () => {
  assert.equal(formatCheckInDate('2026-11-21'), '11/21/2026 (time unavailable)');
  assert.equal(formatCheckInDate('invalid'), 'Date/time unavailable');
});
