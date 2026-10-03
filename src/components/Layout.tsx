import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Calendar, Shield, Sparkles, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import type { UserRole } from '@/lib/types';

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path ? 'text-amber-700' : 'text-gray-600 hover:text-amber-600'
    }`;

  return (
    <>
      <Link to="/" className={linkClass('/')} onClick={onNavigate}>Home</Link>
      <Link to="/pandits" className={linkClass('/pandits')} onClick={onNavigate}>Find Pandits</Link>
      <Link to="/rituals" className={linkClass('/rituals')} onClick={onNavigate}>Puja Catalog</Link>
      <Link to="/how-it-works" className={linkClass('/how-it-works')} onClick={onNavigate}>How It Works</Link>
    </>
  );
}

function UserMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center gap-3">
        <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
        <Link to="/signup"><Button size="sm">Get Started</Button></Link>
      </div>
    );
  }

  const dashboardPath =
    profile.role === 'admin' ? '/admin' : profile.role === 'pandit' ? '/pandit-dashboard' : '/dashboard';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-semibold">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">{profile.full_name.split(' ')[0]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
            <Link to={dashboardPath} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              {profile.role === 'admin' ? <Shield className="w-4 h-4" /> : profile.role === 'pandit' ? <Sparkles className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              Dashboard
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <User className="w-4 h-4" /> My Profile
            </Link>
            <button
              onClick={() => { signOut(); setOpen(false); navigate('/'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ॐ</span>
                </div>
                <span className="text-xl font-bold text-gray-900">PujaConnect</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <NavLinks />
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/pandits" className="hidden md:block">
                <Button variant="ghost" size="sm"><Search className="w-4 h-4 mr-1" /> Search</Button>
              </Link>
              <UserMenu />
              <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="flex flex-col gap-1 px-4 py-3">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ॐ</span>
                </div>
                <span className="text-xl font-bold text-white">PujaConnect</span>
              </div>
              <p className="text-sm leading-relaxed">Your trusted platform for booking verified Pandits for sacred rituals and ceremonies.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pandits" className="hover:text-amber-400 transition-colors">Find Pandits</Link></li>
                <li><Link to="/rituals" className="hover:text-amber-400 transition-colors">Puja Catalog</Link></li>
                <li><Link to="/how-it-works" className="hover:text-amber-400 transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">For Pandits</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/signup" className="hover:text-amber-400 transition-colors">Become a Pandit</Link></li>
                <li><Link to="/pandit-dashboard" className="hover:text-amber-400 transition-colors">Pandit Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/how-it-works" className="hover:text-amber-400 transition-colors">FAQ</Link></li>
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Contact Us</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} PujaConnect. All rights reserved. Made with devotion.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: UserRole[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-amber-600 w-12 h-12" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const redirect = profile.role === 'admin' ? '/admin' : profile.role === 'pandit' ? '/pandit-dashboard' : '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
