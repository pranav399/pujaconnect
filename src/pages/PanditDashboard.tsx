import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { PanditProfile, Ritual, Booking, PanditRitual } from '@/lib/types';
import { Button, Spinner, Badge, EmptyState, Card, Input, Textarea, Select } from '@/components/ui';
import { Calendar, Clock, MapPin, ShieldCheck, AlertCircle, Plus, Trash2, Check, X, User as UserIcon, Sparkles, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'bookings' | 'profile' | 'rituals' | 'availability';

export default function PanditDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('bookings');
  const [panditProfile, setPanditProfile] = useState<PanditProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allRituals, setAllRituals] = useState<Ritual[]>([]);
  const [myRituals, setMyRituals] = useState<PanditRitual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Hindi']);
  const [specializations, setSpecializations] = useState('');

  // New ritual form
  const [newRitualId, setNewRitualId] = useState('');
  const [newRitualPrice, setNewRitualPrice] = useState(2100);

  // Availability
  const [availDate, setAvailDate] = useState('');
  const [availList, setAvailList] = useState<{ id: string; date: string; is_available: boolean }[]>([]);

  const allLanguages = ['Hindi', 'Sanskrit', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Punjabi'];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: pp } = await supabase
        .from('pandit_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (pp) {
        setPanditProfile(pp as PanditProfile);
        setBio(pp.bio);
        setExperienceYears(pp.experience_years);
        setCity(pp.city);
        setStateVal(pp.state);
        setLanguages(pp.languages || ['Hindi']);
        setSpecializations(pp.specializations);

        const [{ data: bData }, { data: rData }, { data: prData }, { data: aData }] = await Promise.all([
          supabase.from('bookings').select(`*, ritual:rituals(*), user_profile:profiles!user_id(id, full_name, phone)`).eq('pandit_id', pp.id).order('created_at', { ascending: false }),
          supabase.from('rituals').select('*').order('name'),
          supabase.from('pandit_rituals').select(`id, price, ritual_id, ritual:rituals(*)`).eq('pandit_id', pp.id),
          supabase.from('pandit_availability').select('*').eq('pandit_id', pp.id).order('date', { ascending: true }),
        ]);

        if (bData) setBookings(bData as Booking[]);
        if (rData) setAllRituals(rData as Ritual[]);
        if (prData) setMyRituals(prData as unknown as PanditRitual[]);
        if (aData) setAvailList(aData as { id: string; date: string; is_available: boolean }[]);
      }
      setLoading(false);
    })();
  }, [user]);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panditProfile) return;
    const { error } = await supabase
      .from('pandit_profiles')
      .update({ bio, experience_years: experienceYears, city, state: stateVal, languages, specializations, updated_at: new Date().toISOString() })
      .eq('id', panditProfile.id);
    showMsg(error ? error.message : 'Profile updated successfully!', !!error);
  };

  const addRitual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panditProfile || !newRitualId) return;
    const { data, error } = await supabase
      .from('pandit_rituals')
      .insert({ pandit_id: panditProfile.id, ritual_id: newRitualId, price: newRitualPrice })
      .select(`id, price, ritual_id, ritual:rituals(*)`)
      .single();
    if (error) { showMsg(error.message, true); return; }
    setMyRituals([...myRituals, data as unknown as PanditRitual]);
    setNewRitualId('');
    setNewRitualPrice(2100);
    showMsg('Ritual added!');
  };

  const removeRitual = async (ritualId: string) => {
    if (!panditProfile) return;
    const { error } = await supabase
      .from('pandit_rituals')
      .delete()
      .eq('pandit_id', panditProfile.id)
      .eq('ritual_id', ritualId);
    if (!error) setMyRituals(myRituals.filter((r) => r.ritual_id !== ritualId));
  };

  const updateRitualPrice = async (prId: string, price: number) => {
    const { error } = await supabase.from('pandit_rituals').update({ price }).eq('id', prId);
    if (!error) setMyRituals(myRituals.map((r) => r.id === prId ? { ...r, price } : r));
  };

  const toggleAvailability = async () => {
    if (!panditProfile || !availDate) return;
    const existing = availList.find((a) => a.date === availDate);
    if (existing) {
      const { error } = await supabase
        .from('pandit_availability')
        .update({ is_available: !existing.is_available })
        .eq('id', existing.id);
      if (!error) setAvailList(availList.map((a) => a.id === existing.id ? { ...a, is_available: !a.is_available } : a));
    } else {
      const { data, error } = await supabase
        .from('pandit_availability')
        .insert({ pandit_id: panditProfile.id, date: availDate, is_available: true })
        .select()
        .single();
      if (!error && data) setAvailList([...availList, data as { id: string; date: string; is_available: boolean }].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setAvailDate('');
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', bookingId);
    if (!error) setBookings(bookings.map((b) => b.id === bookingId ? { ...b, status: status as Booking['status'] } : b));
  };

  const toggleLanguage = (lang: string) => {
    setLanguages(languages.includes(lang) ? languages.filter((l) => l !== lang) : [...languages, lang]);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!panditProfile) {
    return (
      <div className="max-w-3xl mx-auto py-20">
        <EmptyState title="Pandit profile not found" message="Please contact support if you signed up as a pandit." />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'gray', rejected: 'red',
    };
    return <Badge color={colors[status] || 'gray'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeBookings = bookings.filter((b) => b.status === 'confirmed');
  const availableRituals = allRituals.filter((r) => !myRituals.some((pr) => pr.ritual_id === r.id));

  const tabs: { key: Tab; label: string; icon: typeof Calendar; badge?: number }[] = [
    { key: 'bookings', label: 'Bookings', icon: Calendar, badge: pendingBookings.length },
    { key: 'profile', label: 'Profile', icon: UserIcon },
    { key: 'rituals', label: 'Rituals & Pricing', icon: Sparkles },
    { key: 'availability', label: 'Availability', icon: Clock },
  ];

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">{panditProfile.city || 'Location not set'}</span>
                {panditProfile.verification_status === 'verified' && (
                  <Badge color="green"><ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Verified</Badge>
                )}
                {panditProfile.verification_status === 'pending' && (
                  <Badge color="amber">Pending Verification</Badge>
                )}
                {panditProfile.verification_status === 'rejected' && (
                  <Badge color="red">Verification Rejected</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
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

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <EmptyState icon={<Calendar className="w-full h-full" />} title="No bookings yet" message="When devotees book your services, they'll appear here." />
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{booking.ritual?.name}</h3>
                          {statusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">Booked by {booking.user_profile?.full_name || 'Devotee'}{booking.user_profile?.phone ? ` • ${booking.user_profile.phone}` : ''}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.booking_time}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {booking.location_type === 'home' ? 'Home' : 'Temple'}</span>
                          <span className="font-semibold text-amber-700">₹{booking.price.toLocaleString('en-IN')}</span>
                        </div>
                        {booking.address && booking.location_type === 'home' && (
                          <p className="mt-1 text-xs text-gray-400">{booking.address}, {booking.city}</p>
                        )}
                        {booking.notes && <p className="mt-1 text-xs text-gray-400 italic">Note: {booking.notes}</p>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {booking.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'confirmed')}><Check className="w-4 h-4 mr-1" /> Accept</Button>
                            <Button size="sm" variant="danger" onClick={() => updateBookingStatus(booking.id, 'rejected')}><X className="w-4 h-4 mr-1" /> Reject</Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'completed')}><Check className="w-4 h-4 mr-1" /> Mark Completed</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-2xl">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Edit Your Profile</h3>
              <form onSubmit={updateProfile} className="space-y-4">
                <Textarea label="Bio" placeholder="Tell devotees about your experience, training, and specialties..." rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Years of Experience" type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)} />
                  <Input label="Specializations" placeholder="e.g. Vedic, Tantric" value={specializations} onChange={(e) => setSpecializations(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" placeholder="e.g. Mumbai" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input label="State" placeholder="e.g. Maharashtra" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                  <div className="flex gap-2 flex-wrap">
                    {allLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          languages.includes(lang) ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </Card>
          </div>
        )}

        {/* Rituals Tab */}
        {tab === 'rituals' && (
          <div className="max-w-3xl space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-amber-600" /> Add Ritual Offering</h3>
              {availableRituals.length === 0 ? (
                <p className="text-sm text-gray-500">You've added all available rituals.</p>
              ) : (
                <form onSubmit={addRitual} className="flex flex-col sm:flex-row gap-3">
                  <Select value={newRitualId} onChange={(e) => setNewRitualId(e.target.value)} className="flex-1">
                    <option value="">Select a ritual...</option>
                    {availableRituals.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                  <Input type="number" placeholder="Price (₹)" min={0} value={newRitualPrice} onChange={(e) => setNewRitualPrice(parseInt(e.target.value) || 0)} className="w-40" />
                  <Button type="submit"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </form>
              )}
            </Card>

            {myRituals.length === 0 ? (
              <EmptyState icon={<Sparkles className="w-full h-full" />} title="No rituals added" message="Add rituals you offer along with your pricing." />
            ) : (
              <div className="space-y-3">
                {myRituals.map((pr) => (
                  <Card key={pr.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{pr.ritual?.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{pr.ritual?.duration_minutes} min • {pr.ritual?.location_type === 'both' ? 'Home/Temple' : pr.ritual?.location_type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">₹</span>
                          <input
                            type="number"
                            value={pr.price}
                            onChange={(e) => updateRitualPrice(pr.id, parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <button onClick={() => removeRitual(pr.ritual_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {tab === 'availability' && (
          <div className="max-w-2xl">
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Mark Your Availability</h3>
              <div className="flex gap-3">
                <Input type="date" min={new Date().toISOString().split('T')[0]} value={availDate} onChange={(e) => setAvailDate(e.target.value)} className="flex-1" />
                <Button onClick={toggleAvailability}><Plus className="w-4 h-4 mr-1" /> Mark Available</Button>
              </div>
              <p className="mt-3 text-xs text-gray-500">Mark dates when you're available to perform pujas. Click a date to toggle availability.</p>
            </Card>

            {availList.length === 0 ? (
              <EmptyState icon={<Clock className="w-full h-full" />} title="No availability set" message="Mark dates when you're available to perform pujas." />
            ) : (
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Your Availability Calendar</h4>
                <div className="space-y-2">
                  {availList.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-medium text-gray-900">{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={a.is_available ? 'green' : 'red'}>{a.is_available ? 'Available' : 'Unavailable'}</Badge>
                        <button
                          onClick={() => {
                            const date = a.date;
                            setAvailDate(date);
                            toggleAvailability();
                            setAvailDate('');
                          }}
                          className="text-xs text-amber-600 hover:underline"
                        >
                          Toggle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
