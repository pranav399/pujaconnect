import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, ShieldCheck, Users, Star, Clock, ChevronRight, Flame, BookOpen, Heart } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Ritual } from '@/lib/types';
import { RitualImage } from '@/components/RitualImage';

export default function Home() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [panditCount, setPanditCount] = useState(0);
  const [searchRitual, setSearchRitual] = useState('');
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    supabase.from('rituals').select('*').limit(6).then(({ data }) => {
      if (data) setRituals(data as Ritual[]);
    });
    supabase
      .from('pandit_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .then(({ count }) => setPanditCount(count || 0));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchRitual) params.set('ritual', searchRitual);
    if (searchCity) params.set('city', searchCity);
    window.location.href = `/pandits?${params.toString()}`;
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L37 23H60L42 37L49 60L30 46L11 60L18 37L0 23H23Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" /> {panditCount}+ Verified Pandits Available
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Book Trusted Pandits for
              <span className="block bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Sacred Rituals & Ceremonies</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Discover verified Pandits near you. Transparent pricing, detailed ritual information, and effortless booking for home or temple ceremonies.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-10 bg-white rounded-2xl shadow-lg p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Puja type (e.g. Satyanarayan Katha)"
                  value={searchRitual}
                  onChange={(e) => setSearchRitual(e.target.value)}
                  className="w-full py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 border-t sm:border-t-0 sm:border-l border-gray-100">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="City (e.g. Mumbai)"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full py-2.5 text-sm focus:outline-none"
                />
              </div>
              <Button type="submit" size="md" className="flex-shrink-0">
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Users className="w-6 h-6 text-amber-600" />, label: 'Verified Pandits', value: `${panditCount}+` },
              { icon: <BookOpen className="w-6 h-6 text-amber-600" />, label: 'Rituals Offered', value: '14+' },
              { icon: <MapPin className="w-6 h-6 text-amber-600" />, label: 'Cities Covered', value: '10+' },
              { icon: <Star className="w-6 h-6 text-amber-600" />, label: 'Happy Devotees', value: '1000+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 mb-3">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rituals */}
      {rituals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Popular Pujas & Rituals</h2>
            <p className="mt-3 text-gray-600">Browse our most requested ceremonies</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rituals.map((ritual) => (
              <Link
                key={ritual.id}
                to={`/pandits?ritual=${encodeURIComponent(ritual.name)}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <RitualImage imageUrl={ritual.image_url} alt={ritual.name} />
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-amber-700">
                      ₹{ritual.price_min.toLocaleString('en-IN')} - ₹{ritual.price_max.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-amber-700 transition-colors">{ritual.name}</h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{ritual.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ritual.duration_minutes} min</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ritual.location_type === 'both' ? 'Home/Temple' : ritual.location_type === 'home' ? 'Home' : 'Temple'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/rituals"><Button variant="outline">View All Rituals <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-gradient-to-b from-white to-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">How PujaConnect Works</h2>
            <p className="mt-3 text-gray-600">Book your puja in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search className="w-8 h-8" />, step: '1', title: 'Search & Discover', desc: 'Find verified Pandits by ritual type, location, language, and experience.' },
              { icon: <Calendar className="w-8 h-8" />, step: '2', title: 'Book & Schedule', desc: 'Select your ritual, choose date and time, and send a booking request.' },
              { icon: <Heart className="w-8 h-8" />, step: '3', title: 'Perform & Review', desc: 'Pandit confirms your booking. After the ceremony, share your experience.' },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg mb-5">
                  {item.icon}
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-7 h-7 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center text-xs font-bold text-amber-600">{item.step}</div>
                <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Are you a Pandit?</h2>
              <p className="mt-2 text-amber-100">Join PujaConnect and reach thousands of devotees seeking your services.</p>
            </div>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50">
                <Flame className="w-5 h-5 mr-2" /> Join as a Pandit
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
