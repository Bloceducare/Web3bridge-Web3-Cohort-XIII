import { Layout } from './components/Layout';
import { StakingDashboard } from './components/StakingDashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <Layout>
      <StakingDashboard />
      <Toaster />
    </Layout>
  );
}

export default App;