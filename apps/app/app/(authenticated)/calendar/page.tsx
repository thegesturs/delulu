import { getSocials } from '@/server/socials';

export default async function CalendarPage() {
  const test = await getSocials();

  console.log('hello', test);

  return (
    <div>
      <h1>Calendar</h1>
    </div>
  );
}
