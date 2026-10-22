import './styles/dashboard.css';
import { AppShell } from './components/layout/AppShell';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { useApiHealth } from './hooks/useApiHealth';

export default function App() {
  const health = useApiHealth();

  return (
    <AppShell health={health}>
      <MonitoringPage health={health} />
    </AppShell>
  );
}
