import { WalletProvider } from './context/WalletContext';
import { DashboardPage as LandingPage } from './pages/Landing';
import { UserDashboard } from './pages/Dashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}
