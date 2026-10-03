import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Star, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Review } from '@/lib/types';
import { Button, Spinner, Badge, EmptyState, Card, Stars, Textarea } from '@/components/ui';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          ritual:rituals(*),
          pandit:pandit_profiles(
            *,
            profile:profiles!user_id(id, full_name, avatar_url)
          ),
          review:reviews(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setBookings(data as Booking[]);
      setLoading(false);
    })();
  }, [user]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'amber',
      confirmed: 'blue',
      completed: 'green',
      cancelled: 'gray',
      rejected: 'red',
    };
    return <Badge color={colors[status] || 'gray'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const handleCancel = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (!error) {
      setBookings(bookings.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b));
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !user) return;
    setReviewError('');
    setSubmittingReview(true);

    const { error } = await supabase.from('reviews').insert({
      booking_id: reviewBooking.id,
      user_id: user.id,
      pandit_id: reviewBooking.pandit_id,
      rating,
      comment,
    });

    setSubmittingReview(false);
    if (error) {
      setReviewError(error.message);
      return;
    }

    setBookings(bookings.map((b) =>
      b.id === reviewBooking.id
        ? { ...b, review: { id: 'temp', booking_id: reviewBooking.id, user_id: user.id, pandit_id: reviewBooking.pandit_id, rating, comment, created_at: new Date().toISOString() } as Review }
        : b
    ));
    setReviewBooking(null);
    setRating(5);
    setComment('');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {profile?.full_name?.split(' ')[0] || 'Devotee'}!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, color: 'text-gray-900' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-600' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600' },
          ].map((stat, i) => (
            <Card key={i} className="p-5">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Bookings */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Booking History</h2>
          <Link to="/pandits"><Button variant="outline" size="sm"><Search className="w-4 h-4 mr-1" /> Book New Puja</Button></Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-full h-full" />}
            title="No bookings yet"
            message="Find a verified Pandit and book your first puja today."
            action={<Link to="/pandits"><Button>Find Pandits</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Pandit Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {booking.pandit?.photo_url ? (
                        <img src={booking.pandit.photo_url} alt={booking.pandit.profile?.full_name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                          {booking.pandit?.profile?.full_name?.charAt(0) || 'P'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{booking.ritual?.name}</h3>
                        {statusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{booking.pandit?.profile?.full_name || 'Pandit ji'}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.booking_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {booking.location_type === 'home' ? 'Home' : 'Temple'}</span>
                        <span className="font-semibold text-amber-700">₹{booking.price.toLocaleString('en-IN')}</span>
                      </div>
                      {booking.address && booking.location_type === 'home' && (
                        <p className="mt-1 text-xs text-gray-400">{booking.address}, {booking.city}</p>
                      )}
                      {booking.notes && (
                        <p className="mt-1 text-xs text-gray-400 italic">Note: {booking.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link to={`/pandits/${booking.pandit_id}`}>
                      <Button variant="ghost" size="sm">View Pandit</Button>
                    </Link>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button variant="danger" size="sm" onClick={() => handleCancel(booking.id)}>Cancel</Button>
                    )}
                    {booking.status === 'completed' && !booking.review && (
                      <Button size="sm" onClick={() => setReviewBooking(booking)}>
                        <Star className="w-4 h-4 mr-1" /> Leave Review
                      </Button>
                    )}
                    {booking.review && (
                      <div className="flex items-center gap-1 text-sm">
                        <Stars rating={booking.review.rating} />
                        <span className="text-xs text-gray-500 ml-1">Reviewed</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Review Your Experience</h3>
            <p className="mt-1 text-sm text-gray-500">{reviewBooking.ritual?.name} with {reviewBooking.pandit?.profile?.full_name}</p>
            <form onSubmit={submitReview} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                label="Your Review"
                placeholder="Share your experience with this pandit..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {reviewError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {reviewError}
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? <Spinner className="mr-2" /> : null} Submit Review
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReviewBooking(null)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
