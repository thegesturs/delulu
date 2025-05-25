import type { Metadata } from 'next';
import { Header } from '../../components/layout/header';

const title = 'Delulu Inc';
const description = 'My application.';

// const CollaborationProvider = dynamic(() =>
//   import('./components/collaboration-provider').then(
//     (mod) => mod.CollaborationProvider
//   )
// );

export const metadata: Metadata = {
  title,
  description,
};

const App = () => {
  // const { orgId } = await auth();
  // if (!orgId) {
  //   notFound();
  // }

  return (
    <>
      <Header pages={['Building Your Application']} page="Data Fetching">
        <h1>Hello World</h1>
      </Header>
    </>
  );
};

export default App;
