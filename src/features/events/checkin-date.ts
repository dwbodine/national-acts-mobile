import moment from 'moment';

export function formatCheckInDate(value: string): string {
  const text = value.trim();
  const dateOnly = moment(text, 'YYYY-MM-DD', true);
  if (dateOnly.isValid()) return `${dateOnly.format('MM/DD/YYYY')}`;
  const timestamp = moment.parseZone(text, [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm:ss.SSS'], true);
  return timestamp.isValid() ? timestamp.format('MM/DD/YYYY h:mm A') : 'Invalid date';
}
