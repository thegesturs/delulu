import { auth } from '@delulu/auth/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Header } from './components/header';

const title = 'Delulu Inc';
const description = 'My application.';

const CollaborationProvider = dynamic(() =>
  import('./components/collaboration-provider').then(
    (mod) => mod.CollaborationProvider
  )
);

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const { orgId } = await auth();
  if (!orgId) {
    notFound();
  }

  return (
    <>
      <Header pages={['Building Your Application']} page="Data Fetching">
        <h1>Hello World</h1>
      </Header>
    </>
  );
};

export default App;
