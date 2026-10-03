import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ChevronRight, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Ritual } from '@/lib/types';
import { RitualImage } from '@/components/RitualImage';
import { Spinner, EmptyState, Input } from '@/components/ui';

export default function Rituals() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    supabase.from('rituals').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setRituals(data as Ritual[]);
      setLoading(false);
    });
  }, []);

  const categories = ['All', ...Array.from(new Set(rituals.map((r) => r.category)))];

  const filtered = rituals.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || r.category === category;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Puja & Ritual Catalog</h1>
          <p className="mt-2 text-gray-600">Explore our comprehensive list of sacred rituals and ceremonies.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search rituals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="w-full h-full" />}
            title="No rituals found"
            message="Try adjusting your search or filter to find what you're looking for."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ritual) => (
              <div
                key={ritual.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <RitualImage imageUrl={ritual.image_url} alt={ritual.name} />
                  <div className="absolute top-3 left-3">
                    <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold">{ritual.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-gray-900">{ritual.name}</h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{ritual.description}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Duration: ~{ritual.duration_minutes} minutes
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      Location: {ritual.location_type === 'both' ? 'Home or Temple' : ritual.location_type === 'home' ? 'Home only' : 'Temple only'}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400">Price Range</div>
                      <div className="font-bold text-amber-700">₹{ritual.price_min.toLocaleString('en-IN')} - ₹{ritual.price_max.toLocaleString('en-IN')}</div>
                    </div>
                    <Link to={`/pandits?ritual=${encodeURIComponent(ritual.name)}`}>
                      <span className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
                        Find Pandits <ChevronRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
