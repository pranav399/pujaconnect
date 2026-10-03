import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Award, Languages, ShieldCheck, Calendar, Clock, ArrowLeft, Star, BookOpen, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { PanditProfileWithProfile, Ritual, Review, Booking } from '@/lib/types';
import { Button, Spinner, Stars, EmptyState, Card, Select, Input, Textarea, Badge } from '@/components/ui';

export default function PanditProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [pandit, setPandit] = useState<PanditProfileWithProfile | null>(null);
  const [panditRituals, setPanditRituals] = useState<{ ritual: Ritual; price: number; pandit_ritual_id: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'rituals' | 'reviews'>('about');

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [selectedRitualId, setSelectedRitualId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [locationType, setLocationType] = useState<'home' | 'temple'>('home');
  const [address, setAddress] = useState('');
  const [bookingCity, setBookingCity] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: pData } = await supabase
        .from('pandit_profiles')
        .select(`*, profile:profiles!user_id(id, full_name, avatar_url, phone)`)
        .eq('id', id)
        .maybeSingle();

      if (!pData) {
        setLoading(false);
        return;
      }
      setPandit(pData as PanditProfileWithProfile);

      const { data: prData } = await supabase
        .from('pandit_rituals')
        .select(`id, price, ritual:rituals(*)`)
        .eq('pandit_id', id);

      if (prData) {
        setPanditRituals(prData.map((pr: { id: string; price: number; ritual: Ritual[] | Ritual }) => ({
          ritual: Array.isArray(pr.ritual) ? pr.ritual[0] : pr.ritual,
          price: pr.price,
          pandit_ritual_id: pr.id,
        })));
      }

      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`*, user_profile:profiles!user_id(id, full_name, avatar_url)`)
        .eq('pandit_id', id)
        .order('created_at', { ascending: false });

      if (reviewData) setReviews(reviewData as Review[]);

      setLoading(false);
    })();
  }, [id]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile?.role === 'pandit') {
      setBookingError('Pandits cannot book other pandits. Please use a user account.');
      return;
    }
    if (!selectedRitualId || !bookingDate || !bookingTime) {
      setBookingError('Please fill in all required fields.');
      return;
    }
    if (locationType === 'home' && !address) {
      setBookingError('Please provide your address for a home puja.');
      return;
    }

    const ritual = panditRituals.find((pr) => pr.ritual.id === selectedRitualId);
    if (!ritual) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        pandit_id: id,
        ritual_id: selectedRitualId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        location_type: locationType,
        address: address,
        city: bookingCity || pandit?.city || '',
        notes: notes,
        price: ritual.price,
        status: 'pending',
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      setBookingError(error.message);
      return;
    }
    setBookingSuccess(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!pandit) {
    return (
      <div className="max-w-3xl mx-auto py-20">
        <EmptyState title="Pandit not found" message="The pandit profile you're looking for doesn't exist." action={<Link to="/pandits"><Button>Browse Pandits</Button></Link>} />
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/pandits" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-amber-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Pandits
          </Link>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {pandit.photo_url ? (
                <img src={pandit.photo_url} alt={pandit.profile?.full_name} className="w-28 h-28 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-5xl font-bold shadow-md">
                  {pandit.profile?.full_name?.charAt(0) || 'P'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{pandit.profile?.full_name || 'Pandit ji'}</h1>
                {pandit.verification_status === 'verified' && (
                  <Badge color="green"><ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Verified</Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-500" /> {pandit.city || 'Location not set'}{pandit.state ? `, ${pandit.state}` : ''}</span>
                <span className="flex items-center gap-1"><Award className="w-4 h-4 text-amber-500" /> {pandit.experience_years} years experience</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-amber-500" /> {pandit.total_pujas} pujas performed</span>
              </div>
              {pandit.specializations && (
                <p className="mt-2 text-sm text-gray-600"><strong>Specializations:</strong> {pandit.specializations}</p>
              )}
              <div className="mt-3 flex items-center gap-3">
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Stars rating={avgRating} size="md" />
                    <span className="text-sm text-gray-600">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No reviews yet</span>
                )}
              </div>
            </div>
            <div className="sm:ml-auto">
              <Button size="lg" onClick={() => {
                if (!user) { navigate('/login'); return; }
                setShowBooking(true);
                setActiveTab('rituals');
              }}>
                <Calendar className="w-5 h-5 mr-2" /> Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {[
            { key: 'about', label: 'About', icon: <BookOpen className="w-4 h-4" /> },
            { key: 'rituals', label: 'Rituals & Pricing', icon: <Star className="w-4 h-4" /> },
            { key: 'reviews', label: `Reviews (${reviews.length})`, icon: <Star className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-600 leading-relaxed">{pandit.bio || 'This pandit has not yet added a bio.'}</p>
              </Card>
              {pandit.languages.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Languages className="w-5 h-5 text-amber-600" /> Languages Spoken</h3>
                  <div className="flex gap-2 flex-wrap">
                    {pandit.languages.map((lang) => (
                      <Badge key={lang} color="amber">{lang}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
            <div>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Experience</dt>
                    <dd className="font-medium text-gray-900">{pandit.experience_years} years</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900">{pandit.city || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Pujas Done</dt>
                    <dd className="font-medium text-gray-900">{pandit.total_pujas}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Languages</dt>
                    <dd className="font-medium text-gray-900">{pandit.languages.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Rating</dt>
                    <dd className="font-medium text-gray-900">{reviews.length > 0 ? avgRating.toFixed(1) : 'New'}</dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        )}

        {/* Rituals Tab */}
        {activeTab === 'rituals' && (
          <div>
            {panditRituals.length === 0 ? (
              <EmptyState title="No rituals listed" message="This pandit hasn't added any rituals yet." />
            ) : (
              <>
                {showBooking && (
                  <Card className="p-6 mb-6 border-amber-200 bg-amber-50/30">
                    <h3 className="font-semibold text-gray-900 mb-4">Book a Puja</h3>
                    {bookingSuccess ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                          <ShieldCheck className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-lg text-gray-900">Booking Request Sent!</h4>
                        <p className="mt-2 text-sm text-gray-600">Redirecting to your dashboard...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleBook} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Select label="Select Ritual *" value={selectedRitualId} onChange={(e) => setSelectedRitualId(e.target.value)}>
                            <option value="">Choose a ritual...</option>
                            {panditRituals.map((pr) => (
                              <option key={pr.ritual.id} value={pr.ritual.id}>{pr.ritual.name} - ₹{pr.price.toLocaleString('en-IN')}</option>
                            ))}
                          </Select>
                          <Select label="Location Type *" value={locationType} onChange={(e) => setLocationType(e.target.value as 'home' | 'temple')}>
                            <option value="home">Home</option>
                            <option value="temple">Temple</option>
                          </Select>
                          <Input label="Date *" type="date" value={bookingDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setBookingDate(e.target.value)} />
                          <Input label="Time *" type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
                        </div>
                        {locationType === 'home' && (
                          <Input label="Address *" placeholder="Your full address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        )}
                        <Input label="City" placeholder="City" value={bookingCity} onChange={(e) => setBookingCity(e.target.value)} />
                        <Textarea label="Special Notes" placeholder="Any specific requirements or preferences..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                        {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
                        <div className="flex gap-3">
                          <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Booking Request'}</Button>
                          <Button type="button" variant="ghost" onClick={() => setShowBooking(false)}>Cancel</Button>
                        </div>
                      </form>
                    )}
                  </Card>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {panditRituals.map((pr) => (
                    <Card key={pr.ritual.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{pr.ritual.name}</h4>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{pr.ritual.description}</p>
                          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {pr.ritual.duration_minutes} min</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {pr.ritual.location_type === 'both' ? 'Home/Temple' : pr.ritual.location_type}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xs text-gray-400">Price</div>
                          <div className="font-bold text-lg text-amber-700">₹{pr.price.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      {!showBooking && (
                        <Button
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => {
                            if (!user) { navigate('/login'); return; }
                            setSelectedRitualId(pr.ritual.id);
                            setShowBooking(true);
                          }}
                        >
                          Book This Ritual <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" message="Be the first to review this pandit after your booking is completed." />
            ) : (
              <div className="space-y-4 max-w-3xl">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {review.user_profile?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{review.user_profile?.full_name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1"><Stars rating={review.rating} /></div>
                        {review.comment && <p className="mt-2 text-sm text-gray-600">{review.comment}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
