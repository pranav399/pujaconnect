import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Layout, ProtectedRoute } from '@/components/Layout';
import Home from '@/pages/Home';
import HowItWorks from '@/pages/HowItWorks';
import Rituals from '@/pages/Rituals';
import Pandits from '@/pages/Pandits';
import PanditProfile from '@/pages/PanditProfile';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import UserDashboard from '@/pages/UserDashboard';
import PanditDashboard from '@/pages/PanditDashboard';
import AdminDashboard from '@/pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/rituals" element={<Rituals />} />
                  <Route path="/pandits" element={<Pandits />} />
                  <Route path="/pandits/:id" element={<PanditProfile />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['user']}>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pandit-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['pandit']}>
                        <PanditDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
