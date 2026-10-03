import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Spinner } from '@/components/ui';
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, Users, Sparkles, ShieldCheck, Shield } from 'lucide-react';
import type { UserRole } from '@/lib/types';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminOption, setShowAdminOption] = useState(false);
  const ADMIN_ACCESS_CODE = 'ADMIN2026';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (role === 'admin' && adminCode !== ADMIN_ACCESS_CODE) {
      setError('Invalid admin access code.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role, phone);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate(role === 'pandit' ? '/pandit-dashboard' : role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">ॐ</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">PujaConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="mt-2 text-gray-600">Join PujaConnect to book trusted Pandits</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">I want to join as:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  role === 'user' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-200'
                }`}
              >
                <Users className={`w-6 h-6 mb-2 ${role === 'user' ? 'text-amber-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-sm text-gray-900">Devotee</div>
                <div className="text-xs text-gray-500 mt-0.5">Book pujas & rituals</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('pandit')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  role === 'pandit' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-200'
                }`}
              >
                <Sparkles className={`w-6 h-6 mb-2 ${role === 'pandit' ? 'text-amber-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-sm text-gray-900">Pandit</div>
                <div className="text-xs text-gray-500 mt-0.5">Offer puja services</div>
              </button>
              <button
                type="button"
                onClick={() => { setRole('admin'); setShowAdminOption(true); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  role === 'admin' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-200'
              }`}
              >
                <Shield className={`w-6 h-6 mb-2 ${role === 'admin' ? 'text-amber-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-sm text-gray-900">Admin</div>
                <div className="text-xs text-gray-500 mt-0.5">Manage platform</div>
              </button>
            </div>
          </div>

          {role === 'admin' && showAdminOption && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Access Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter admin access code"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Contact your platform owner for the access code.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null} Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-amber-600 hover:text-amber-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
