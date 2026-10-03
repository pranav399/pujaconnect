import { Link } from 'react-router-dom';
import { Search, Calendar, ShieldCheck, Heart, Users, BookOpen, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

export default function HowItWorks() {
  const steps = [
    { icon: <Search />, title: 'Search for Pandits', desc: 'Browse verified Pandits by ritual type, city, language, and years of experience. Compare profiles, pricing, and availability side by side.' },
    { icon: <Calendar />, title: 'Book a Ritual', desc: 'Choose your puja, select a date and time, and specify whether it\'s at your home or a temple. Add any special notes for the Pandit.' },
    { icon: <ShieldCheck />, title: 'Get Confirmation', desc: 'The Pandit reviews your request and confirms. You\'ll see the booking status update in real-time on your dashboard.' },
    { icon: <Heart />, title: 'Perform & Review', desc: 'After the ceremony is completed, share your experience by leaving a rating and review to help other devotees.' },
  ];

  const faqs = [
    { q: 'Are the Pandits verified?', a: 'Yes. Every Pandit on PujaConnect goes through a verification process by our admin team before being listed on the platform. Look for the "Verified" badge on profiles.' },
    { q: 'How is pricing determined?', a: 'Each Pandit sets their own pricing for the rituals they offer. You can see the exact price before booking. Prices typically include the Pandit\'s service and basic materials.' },
    { q: 'Can I book a puja for my home?', a: 'Absolutely. Most rituals can be performed at your home or at a temple. The Pandit will travel to your specified location on the booked date and time.' },
    { q: 'What if I need to cancel?', a: 'You can cancel a booking from your dashboard. If the booking is still pending, it will be cancelled immediately. For confirmed bookings, please notify the Pandit as early as possible.' },
    { q: 'Do you provide puja materials?', a: 'Many Pandits include basic materials in their pricing. You can check the ritual details for a list of required materials, and discuss specifics with your Pandit after booking.' },
  ];

  return (
    <div className="bg-stone-50">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900">How PujaConnect Works</h1>
          <p className="mt-4 text-lg text-gray-600">A simple, transparent process to book trusted Pandits for your sacred rituals.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8">{step.icon}</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-600">Step {i + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{step.title}</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-gray-900 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="mt-2 text-gray-600 pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Users className="w-8 h-8" />, title: 'For Devotees', points: ['Browse verified Pandits', 'Transparent pricing', 'Easy booking & tracking', 'Rate & review after puja'], link: '/pandits', cta: 'Find a Pandit' },
            { icon: <BookOpen className="w-8 h-8" />, title: 'For Pandits', points: ['Create your profile', 'Set your own pricing', 'Manage availability calendar', 'Accept or reject bookings'], link: '/signup', cta: 'Join as Pandit' },
            { icon: <ShieldCheck className="w-8 h-8" />, title: 'Quality Assurance', points: ['Admin verification process', 'Profile moderation', 'Reviews & ratings system', 'Dispute resolution'], link: '/rituals', cta: 'Browse Rituals' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <div className="w-8 h-8">{card.icon}</div>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{card.title}</h3>
              <ul className="mt-4 space-y-2">
                {card.points.map((point, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" /> {point}
                  </li>
                ))}
              </ul>
              <Link to={card.link} className="mt-6 block">
                <Button variant="outline" className="w-full">{card.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-14">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold text-white">Ready to book your puja?</h2>
          <p className="mt-2 text-amber-100">Find the perfect Pandit for your ceremony today.</p>
          <Link to="/pandits" className="mt-6 inline-block">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50">
              <MapPin className="w-5 h-5 mr-2" /> Find Pandits Near You
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
