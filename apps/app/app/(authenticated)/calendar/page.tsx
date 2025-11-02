import type { Metadata } from 'next';
import { CalendarClient } from './calendar-client';

export const metadata: Metadata = {
  title: 'Calendar | Delulu',
  description: 'View and manage your scheduled posts',
};

export default function CalendarPage() {
  return <CalendarClient />;
}
