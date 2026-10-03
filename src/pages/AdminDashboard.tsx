import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { PanditProfileWithProfile, Booking, Profile, Ritual, UserRole } from '@/lib/types';
import { Button, Spinner, Badge, EmptyState, Card, Input, Textarea, Select } from '@/components/ui';
import { RitualImage } from '@/components/RitualImage';
import { Users, ShieldCheck, Calendar, BookOpen, Plus, Trash2, Check, X, AlertCircle, Shield, TrendingUp, Pencil, RotateCcw, UserCog } from 'lucide-react';

type Tab = 'overview' | 'pandits' | 'bookings' | 'rituals' | 'users';

type RitualAdmin = Ritual;

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [pandits, setPandits] = useState<PanditProfileWithProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allRituals, setAllRituals] = useState<RitualAdmin[]>([]);

  // New ritual form
  const [newRitualName, setNewRitualName] = useState('');
  const [newRitualDesc, setNewRitualDesc] = useState('');
  const [newRitualImageUrl, setNewRitualImageUrl] = useState('');
  const [newRitualCategory, setNewRitualCategory] = useState('General');
  const [newRitualDuration, setNewRitualDuration] = useState(90);
  const [newRitualPriceMin, setNewRitualPriceMin] = useState(1100);
  const [newRitualPriceMax, setNewRitualPriceMax] = useState(3100);
  const [newRitualLocation, setNewRitualLocation] = useState<'home' | 'temple' | 'both'>('both');
  const [newRitualMaterials, setNewRitualMaterials] = useState('All materials provided by the pandit.');

  // Edit ritual
  const [editingRitualId, setEditingRitualId] = useState<string | null>(null);
  const [editRitual, setEditRitual] = useState<Partial<Ritual>>({});

  // Edit user role
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState<UserRole>('user');

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const fetchAll = async () => {
    const [{ data: pData }, { data: bData }, { data: uData }, { data: rData }] = await Promise.all([
      supabase.from('pandit_profiles').select(`*, profile:profiles!user_id(id, full_name, avatar_url, phone)`).order('created_at', { ascending: false }),
      supabase.from('bookings').select(`*, ritual:rituals(*), pandit:pandit_profiles(*, profile:profiles!user_id(id, full_name)), user_profile:profiles!user_id(id, full_name)`).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('rituals').select('*').order('name'),
    ]);
    if (pData) setPandits(pData as PanditProfileWithProfile[]);
    if (bData) setBookings(bData as Booking[]);
    if (uData) setUsers(uData as Profile[]);
    if (rData) setAllRituals(rData as RitualAdmin[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const verifyPandit = async (panditId: string, status: 'verified' | 'rejected' | 'pending') => {
    const { error } = await supabase
      .from('pandit_profiles')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', panditId);
    if (error) { showMsg(error.message, true); return; }
    setPandits(pandits.map((p) => p.id === panditId ? { ...p, verification_status: status } : p));
    showMsg(`Pandit status updated to ${status}!`);
  };

  const addRitual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRitualName || !newRitualDesc) return;
    const { data, error } = await supabase
      .from('rituals')
      .insert({
        name: newRitualName,
        description: newRitualDesc,
        image_url: newRitualImageUrl.trim() || null,
        category: newRitualCategory,
        duration_minutes: newRitualDuration,
        price_min: newRitualPriceMin,
        price_max: newRitualPriceMax,
        location_type: newRitualLocation,
        required_materials: newRitualMaterials,
      })
      .select('*')
      .single();
    if (error) { showMsg(error.message, true); return; }
    setAllRituals([...allRituals, data as RitualAdmin].sort((a, b) => a.name.localeCompare(b.name)));
    setNewRitualName(''); setNewRitualDesc(''); setNewRitualImageUrl(''); setNewRitualCategory('General'); setNewRitualDuration(90);
    setNewRitualPriceMin(1100); setNewRitualPriceMax(3100); setNewRitualMaterials('All materials provided by the pandit.');
    showMsg('Ritual added!');
  };

  const startEditRitual = (ritual: Ritual) => {
    setEditingRitualId(ritual.id);
    setEditRitual(ritual);
  };

  const saveEditRitual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRitualId) return;
    const { error } = await supabase
      .from('rituals')
      .update({
        name: editRitual.name,
        description: editRitual.description,
        image_url: editRitual.image_url?.trim() || null,
        category: editRitual.category,
        duration_minutes: editRitual.duration_minutes,
        price_min: editRitual.price_min,
        price_max: editRitual.price_max,
        location_type: editRitual.location_type,
        required_materials: editRitual.required_materials,
      })
      .eq('id', editingRitualId);
    if (error) { showMsg(error.message, true); return; }
    setAllRituals(allRituals.map((r) => r.id === editingRitualId ? { ...r, ...editRitual } as RitualAdmin : r).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingRitualId(null);
    setEditRitual({});
    showMsg('Ritual updated!');
  };

  const deleteRitual = async (ritualId: string) => {
    const { error } = await supabase.from('rituals').delete().eq('id', ritualId);
    if (error) { showMsg(error.message, true); return; }
    setAllRituals(allRituals.filter((r) => r.id !== ritualId));
    showMsg('Ritual deleted.');
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', bookingId);
    if (error) { showMsg(error.message, true); return; }
    setBookings(bookings.map((b) => b.id === bookingId ? { ...b, status: status as Booking['status'] } : b));
    showMsg(`Booking status updated to ${status}.`);
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) { showMsg(error.message, true); return; }
    setUsers(users.map((u) => u.id === userId ? { ...u, role } : u));
    setEditingUserId(null);
    showMsg('User role updated!');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  const pendingPandits = pandits.filter((p) => p.verification_status === 'pending');

  const stats = [
    { label: 'Total Users', value: users.filter((u) => u.role === 'user').length, icon: <Users className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Pandits', value: pandits.length, icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'Pending Verifications', value: pendingPandits.length, icon: <Shield className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Bookings', value: bookings.length, icon: <Calendar className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
  ];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'gray', rejected: 'red',
    };
    return <Badge color={colors[status] || 'gray'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const tabs: { key: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'pandits', label: 'Pandits', icon: ShieldCheck, badge: pendingPandits.length },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'rituals', label: 'Rituals', icon: BookOpen },
    { key: 'users', label: 'Users', icon: Users },
  ];

  const bookingStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Manage platform, verify pandits, monitor activity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
                {t.badge ? <span className="ml-1 bg-amber-600 text-white text-xs rounded-full px-2 py-0.5">{t.badge}</span> : null}
              </button>
            );
          })}
        </div>

        {(error || success) && (
          <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg p-3 ${error ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error || success}
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <Card key={i} className="p-5">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color} mb-3`}>{stat.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-500">No bookings yet.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{b.ritual?.name}</span>
                        <span className="text-gray-500"> • {b.user_profile?.full_name} → {b.pandit?.profile?.full_name}</span>
                      </div>
                      {statusBadge(b.status)}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Pandits */}
        {tab === 'pandits' && (
          <div className="space-y-4">
            {pandits.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="w-full h-full" />} title="No pandits registered" message="Pandit registrations will appear here for verification." />
            ) : (
              pandits.map((pandit) => (
                <Card key={pandit.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {pandit.profile?.full_name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{pandit.profile?.full_name}</h3>
                          {pandit.verification_status === 'verified' && <Badge color="green"><ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Verified</Badge>}
                          {pandit.verification_status === 'pending' && <Badge color="amber">Pending</Badge>}
                          {pandit.verification_status === 'rejected' && <Badge color="red">Rejected</Badge>}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 flex items-center gap-3 flex-wrap">
                          <span>{pandit.city || 'No city'}, {pandit.state || 'No state'}</span>
                          <span>{pandit.experience_years} yrs exp</span>
                          {pandit.profile?.phone && <span>{pandit.profile.phone}</span>}
                        </div>
                        {pandit.bio && <p className="mt-1 text-xs text-gray-400 line-clamp-1">{pandit.bio}</p>}
                        {pandit.specializations && <p className="mt-0.5 text-xs text-gray-400">Specializations: {pandit.specializations}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {pandit.verification_status !== 'verified' && (
                        <Button size="sm" onClick={() => verifyPandit(pandit.id, 'verified')}><Check className="w-4 h-4 mr-1" /> Verify</Button>
                      )}
                      {pandit.verification_status !== 'rejected' && (
                        <Button size="sm" variant="danger" onClick={() => verifyPandit(pandit.id, 'rejected')}><X className="w-4 h-4 mr-1" /> Reject</Button>
                      )}
                      {pandit.verification_status !== 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => verifyPandit(pandit.id, 'pending')}><RotateCcw className="w-4 h-4 mr-1" /> Reset</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Bookings */}
        {tab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <EmptyState icon={<Calendar className="w-full h-full" />} title="No bookings" message="All platform bookings will be monitored here." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Ritual</th>
                      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Devotee</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Pandit</th>
                      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Price</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{b.ritual?.name}</td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{b.user_profile?.full_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{b.pandit?.profile?.full_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{new Date(b.booking_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">{statusBadge(b.status)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-700 hidden sm:table-cell">₹{b.price.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <select
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {bookingStatusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* Rituals */}
        {tab === 'rituals' && (
          <div className="max-w-3xl space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-amber-600" /> Add New Ritual</h3>
              <form onSubmit={addRitual} className="space-y-4">
                <Input label="Ritual Name *" required value={newRitualName} onChange={(e) => setNewRitualName(e.target.value)} placeholder="e.g. Durga Puja" />
                <Textarea label="Description *" required rows={3} value={newRitualDesc} onChange={(e) => setNewRitualDesc(e.target.value)} placeholder="Describe the ritual..." />
                <div className="grid gap-3 sm:grid-cols-[1fr_12rem] sm:items-end">
                  <Input label="Image URL" type="url" value={newRitualImageUrl} onChange={(e) => setNewRitualImageUrl(e.target.value)} placeholder="https://example.com/puja.jpg" />
                  <RitualImage imageUrl={newRitualImageUrl} alt="New ritual preview" className="h-24 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Input label="Category" value={newRitualCategory} onChange={(e) => setNewRitualCategory(e.target.value)} placeholder="e.g. Vrata" />
                  <Input label="Duration (min)" type="number" min={15} value={newRitualDuration} onChange={(e) => setNewRitualDuration(parseInt(e.target.value) || 90)} />
                  <Select label="Location Type" value={newRitualLocation} onChange={(e) => setNewRitualLocation(e.target.value as 'home' | 'temple' | 'both')}>
                    <option value="both">Home & Temple</option>
                    <option value="home">Home Only</option>
                    <option value="temple">Temple Only</option>
                  </Select>
                  <Input label="Min Price (₹)" type="number" min={0} value={newRitualPriceMin} onChange={(e) => setNewRitualPriceMin(parseInt(e.target.value) || 0)} />
                  <Input label="Max Price (₹)" type="number" min={0} value={newRitualPriceMax} onChange={(e) => setNewRitualPriceMax(parseInt(e.target.value) || 0)} />
                </div>
                <Textarea label="Required Materials" rows={2} value={newRitualMaterials} onChange={(e) => setNewRitualMaterials(e.target.value)} />
                <Button type="submit"><Plus className="w-4 h-4 mr-1" /> Add Ritual</Button>
              </form>
            </Card>

            <div className="space-y-3">
              {allRituals.map((ritual) => (
                <Card key={ritual.id} className="p-5">
                  {editingRitualId === ritual.id ? (
                    <form onSubmit={saveEditRitual} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2"><Pencil className="w-4 h-4 text-amber-600" /> Edit Ritual</h4>
                        <button type="button" onClick={() => { setEditingRitualId(null); setEditRitual({}); }} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                      <Input label="Name" required value={editRitual.name || ''} onChange={(e) => setEditRitual({ ...editRitual, name: e.target.value })} />
                      <Textarea label="Description" required rows={3} value={editRitual.description || ''} onChange={(e) => setEditRitual({ ...editRitual, description: e.target.value })} />
                      <div className="grid gap-3 sm:grid-cols-[1fr_12rem] sm:items-end">
                        <Input label="Image URL" type="url" value={editRitual.image_url || ''} onChange={(e) => setEditRitual({ ...editRitual, image_url: e.target.value || null })} placeholder="https://example.com/puja.jpg" />
                        <RitualImage imageUrl={editRitual.image_url} alt={`${editRitual.name || 'Ritual'} preview`} className="h-24 rounded-lg" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Input label="Category" value={editRitual.category || ''} onChange={(e) => setEditRitual({ ...editRitual, category: e.target.value })} />
                        <Input label="Duration (min)" type="number" min={15} value={editRitual.duration_minutes ?? 90} onChange={(e) => setEditRitual({ ...editRitual, duration_minutes: parseInt(e.target.value) || 90 })} />
                        <Select label="Location Type" value={editRitual.location_type || 'both'} onChange={(e) => setEditRitual({ ...editRitual, location_type: e.target.value as 'home' | 'temple' | 'both' })}>
                          <option value="both">Home & Temple</option>
                          <option value="home">Home Only</option>
                          <option value="temple">Temple Only</option>
                        </Select>
                        <Input label="Min Price (₹)" type="number" min={0} value={editRitual.price_min ?? 0} onChange={(e) => setEditRitual({ ...editRitual, price_min: parseInt(e.target.value) || 0 })} />
                        <Input label="Max Price (₹)" type="number" min={0} value={editRitual.price_max ?? 0} onChange={(e) => setEditRitual({ ...editRitual, price_max: parseInt(e.target.value) || 0 })} />
                      </div>
                      <Textarea label="Required Materials" rows={2} value={editRitual.required_materials || ''} onChange={(e) => setEditRitual({ ...editRitual, required_materials: e.target.value })} />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm"><Check className="w-4 h-4 mr-1" /> Save Changes</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingRitualId(null); setEditRitual({}); }}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{ritual.name}</h4>
                          <Badge color="amber">{ritual.category}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ritual.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          <span>{ritual.duration_minutes} min</span>
                          <span>₹{ritual.price_min.toLocaleString('en-IN')} - ₹{ritual.price_max.toLocaleString('en-IN')}</span>
                          <span className="capitalize">Location: {ritual.location_type === 'both' ? 'Home/Temple' : ritual.location_type}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEditRitual(ritual)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit ritual">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteRitual(ritual.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete ritual">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.length === 0 ? (
              <EmptyState icon={<Users className="w-full h-full" />} title="No users" message="Registered users will appear here." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Phone</th>
                      <th className="px-4 py-3 text-left font-medium">Role</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Joined</th>
                      <th className="px-4 py-3 text-left font-medium">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge color={u.role === 'admin' ? 'red' : u.role === 'pandit' ? 'amber' : 'blue'}>{u.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          {editingUserId === u.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editUserRole}
                                onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="user">User</option>
                                <option value="pandit">Pandit</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button onClick={() => updateUserRole(u.id, editUserRole)} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Save">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingUserId(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded" title="Cancel">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingUserId(u.id); setEditUserRole(u.role); }}
                              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                            >
                              <UserCog className="w-3.5 h-3.5" /> Edit Role
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
