'use client';

import React from 'react';
import { api as TrpcApi } from '@/trpc/react';

export default function CalendarPage() {
  const { data: hello } = TrpcApi.hello.useQuery();

  console.log('hello', hello);

  return (
    <div>
      <h1>Calendar</h1>
    </div>
  )
}
