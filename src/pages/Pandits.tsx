import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Star, Languages, Award, Search, ShieldCheck, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PanditProfileWithProfile, Ritual } from '@/lib/types';
import { Spinner, Stars, EmptyState, Select, Input, Button } from '@/components/ui';

interface PanditWithRating extends PanditProfileWithProfile {
  avg_rating?: number;
  review_count?: number;
  ritual_price?: number;
}

export default function Pandits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pandits, setPandits] = useState<PanditWithRating[]>([]);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [ritualName, setRitualName] = useState(searchParams.get('ritual') || '');
  const [minExperience, setMinExperience] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState('experience');

  useEffect(() => {
    supabase.from('rituals').select('id, name').order('name').then(({ data }) => {
      if (data) setRituals(data as Ritual[]);
    });
  }, []);

  useEffect(() => {
    const fetchPandits = async () => {
      setLoading(true);

      let query = supabase
        .from('pandit_profiles')
        .select(`
          *,
          profile:profiles!user_id(id, full_name, avatar_url, phone)
        `)
        .eq('verification_status', 'verified');

      if (city) query = query.ilike('city', `%${city}%`);
      if (minExperience) query = query.gte('experience_years', parseInt(minExperience));
      if (language) query = query.contains('languages', [language]);

      const { data, error } = await query.order('experience_years', { ascending: false });

      if (error || !data) {
        setLoading(false);
        return;
      }

      let result = data as PanditWithRating[];

      if (ritualName) {
        const ritual = rituals.find((r) => r.name === ritualName);
        if (ritual) {
          const { data: prData } = await supabase
            .from('pandit_rituals')
            .select('pandit_id, price')
            .eq('ritual_id', ritual.id);
          const panditRitualMap = new Map((prData || []).map((pr: { pandit_id: string; price: number }) => [pr.pandit_id, pr.price]));
          result = result.filter((p) => panditRitualMap.has(p.id));
          result = result.map((p) => ({ ...p, ritual_price: panditRitualMap.get(p.id) }));
        }
      }

      const panditIds = result.map((p) => p.id);
      if (panditIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('pandit_id, rating')
          .in('pandit_id', panditIds);
        const ratingMap = new Map<string, { sum: number; count: number }>();
        (reviews || []).forEach((r: { pandit_id: string; rating: number }) => {
          const existing = ratingMap.get(r.pandit_id) || { sum: 0, count: 0 };
          existing.sum += r.rating;
          existing.count += 1;
          ratingMap.set(r.pandit_id, existing);
        });
        result = result.map((p) => {
          const r = ratingMap.get(p.id);
          return { ...p, avg_rating: r ? r.sum / r.count : 0, review_count: r ? r.count : 0 };
        });
      } else {
        result = result.map((p) => ({ ...p, avg_rating: 0, review_count: 0 }));
      }

      if (sortBy === 'rating') {
        result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      } else if (sortBy === 'experience') {
        result.sort((a, b) => b.experience_years - a.experience_years);
      } else if (sortBy === 'pujas') {
        result.sort((a, b) => b.total_pujas - a.total_pujas);
      }

      setPandits(result);
      setLoading(false);
    };

    if (rituals.length > 0 || !ritualName) {
      fetchPandits();
    } else {
      fetchPandits();
    }
  }, [city, ritualName, minExperience, language, sortBy, rituals]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ritualName) params.set('ritual', ritualName);
    if (city) params.set('city', city);
    setSearchParams(params);
  };

  const allLanguages = ['Hindi', 'Sanskrit', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Punjabi'];

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Verified Pandits</h1>
          <p className="mt-2 text-gray-600">Browse trusted Pandits and book your sacred ritual.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <aside className="lg:col-span-1">
            <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 sticky top-20">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Search className="w-5 h-5 text-amber-600" /> Filters</h3>

              <Select
                label="Puja / Ritual"
                value={ritualName}
                onChange={(e) => setRitualName(e.target.value)}
              >
                <option value="">All Rituals</option>
                {rituals.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </Select>

              <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Select
                label="Minimum Experience"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
              >
                <option value="">Any</option>
                <option value="1">1+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
                <option value="15">15+ years</option>
                <option value="20">20+ years</option>
              </Select>

              <Select
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">Any Language</option>
                {allLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </Select>

              <Button type="submit" className="w-full">Apply Filters</Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setCity('');
                  setRitualName('');
                  setMinExperience('');
                  setLanguage('');
                  setSearchParams({});
                }}
              >
                Clear All
              </Button>
            </form>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {loading ? 'Searching...' : `${pandits.length} pandit${pandits.length !== 1 ? 's' : ''} found`}
              </p>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-44"
              >
                <option value="experience">Sort: Experience</option>
                <option value="rating">Sort: Rating</option>
                <option value="pujas">Sort: Pujas Performed</option>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="w-10 h-10" />
              </div>
            ) : pandits.length === 0 ? (
              <EmptyState
                icon={<Search className="w-full h-full" />}
                title="No pandits found"
                message="Try adjusting your filters to find more pandits."
              />
            ) : (
              <div className="space-y-4">
                {pandits.map((pandit) => (
                  <Link
                    key={pandit.id}
                    to={`/pandits/${pandit.id}`}
                    className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {pandit.photo_url ? (
                          <img src={pandit.photo_url} alt={pandit.profile?.full_name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                            {pandit.profile?.full_name?.charAt(0) || 'P'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-amber-700 transition-colors">
                            {pandit.profile?.full_name || 'Pandit ji'}
                          </h3>
                          {pandit.verification_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <ShieldCheck className="w-4 h-4" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-500" /> {pandit.city || 'Location not set'}{pandit.state ? `, ${pandit.state}` : ''}</span>
                          <span className="flex items-center gap-1"><Award className="w-4 h-4 text-amber-500" /> {pandit.experience_years} yrs exp</span>
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-amber-500" /> {pandit.total_pujas} pujas</span>
                        </div>
                        {pandit.bio && <p className="mt-2 text-sm text-gray-600 line-clamp-1">{pandit.bio}</p>}
                        <div className="mt-3 flex items-center gap-4 flex-wrap">
                          {pandit.languages.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Languages className="w-4 h-4 text-gray-400" />
                              <div className="flex gap-1">
                                {pandit.languages.slice(0, 4).map((lang) => (
                                  <span key={lang} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lang}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {pandit.review_count && pandit.review_count > 0 ? (
                            <div className="flex items-center gap-1">
                              <Stars rating={pandit.avg_rating || 0} />
                              <span className="text-sm text-gray-600 ml-1">({pandit.review_count})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No reviews yet</span>
                          )}
                          {pandit.ritual_price && (
                            <span className="ml-auto font-bold text-amber-700">₹{pandit.ritual_price.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
