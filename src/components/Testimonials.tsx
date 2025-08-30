import React, { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { SkeletonTestimonial } from './SkeletonLoader';
import { getLatestReviews, Review } from '../api/reviews';
import { getUserProfile } from '../api/users';
import { UserProfile } from '../api/auth';
import { useTranslation } from '../context/TranslationContext';

// A simple utility to get a flag emoji from a country name
const countryToFlag = (country: string): string => {
  const countryCode = Object.keys(countryMap).find(
    (code) => countryMap[code].toLowerCase() === country.toLowerCase()
  );
  if (!countryCode) return '🌍'; // Default globe emoji

  const a = 0x1f1e6; // Regional Indicator Symbol Letter A
  return String.fromCodePoint(
    ...countryCode.split('').map((char) => a + char.charCodeAt(0) - 'A'.charCodeAt(0))
  );
};

// You would typically have a more robust country mapping
const countryMap: { [key: string]: string } = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  IT: 'Italy',
  ES: 'Spain',
};

const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [users, setUsers] = useState<{ [key: string]: UserProfile }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const latestReviews = await getLatestReviews(3);
        setTestimonials(latestReviews);

        // Fetch user data for each review to get country info
        const userIds = latestReviews.map((r) => r.userId);
        const uniqueUserIds = [...new Set(userIds)];

        const userPromises = uniqueUserIds.map(async (userId) => {
          const userProfile = await getUserProfile(userId);
          return userProfile ? { [userId]: userProfile } : {};
        });

        const userResults = await Promise.all(userPromises);
        const usersMap = userResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setUsers(usersMap);

      } catch (err) {
        setError('Failed to load testimonials.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            {t('testimonials.title')} <span className="text-orange-500">Say</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonTestimonial
                key={index}
                className={index === 1 ? 'md:-translate-y-4' : ''}
              />
            ))
          ) : error ? (
            <div className="col-span-full text-center py-12 text-red-600">
              {error}
            </div>
          ) : (
            testimonials.map((testimonial, index) => {
              const user = users[testimonial.userId];
              const country = user?.country || 'Unknown';
              const flag = countryToFlag(country);

              return (
                <div
                  key={testimonial.id}
                  className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                    index === 1 ? 'md:-translate-y-4' : ''
                  }`}
                >
                  <div className="flex justify-center mb-6">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Quote className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>

                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-600 text-center mb-6 leading-relaxed">
                    "{testimonial.comment}"
                  </p>

                  <div className="flex items-center justify-center space-x-4">
                    <img
                      src={testimonial.userAvatar || `https://i.pravatar.cc/150?u=${testimonial.userId}`}
                      alt={testimonial.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{testimonial.userName}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <span>{flag}</span>
                        <span>{country}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {[
            { number: '50,000+', label: t('testimonials.stats.travelers') },
            { number: '4.9/5', label: t('testimonials.stats.rating') },
            { number: '95%', label: t('testimonials.stats.recommend') },
            { number: '120+', label: t('testimonials.stats.countries') },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-60 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;