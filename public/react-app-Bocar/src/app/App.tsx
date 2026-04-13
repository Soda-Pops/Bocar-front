import { Router } from '@/app/Router';
import { AppProviders } from '@/app/providers';

function App() {
  return (
    <AppProviders>
      <Router />
    </AppProviders>
  );
}

export default App;
