import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Globe } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

const Footer: React.FC = () => {
  const { t, supportedLanguages } = useTranslation();
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl font-bold">
                <span className="text-orange-500">Incredible</span>
                <span className="text-white"> India</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              {t('footer.description')}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' },
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href="#"
                    className="bg-gray-800 hover:bg-orange-500 p-2 rounded-full transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {[
                t('footer.destinations'),
                t('footer.vrTours'),
                t('footer.about'),
                t('footer.contact'),
              ].map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.destinations')}</h3>
            <ul className="space-y-2">
              {[
                'Taj Mahal, Agra',
                'Jaipur, Rajasthan',
                'Kerala Backwaters',
                'Ladakh',
                'Goa Beaches',
                'Varanasi',
              ].map((destination, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {destination}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400">hello@incredibleindia.vr</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400">+1-800-INDIA-VR</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400">New Delhi, India</span>
              </div>
            </div>

            {/* Language Support */}
            <div className="mt-6">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>{t('footer.languages')}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {['🇺🇸 EN', '🇫🇷 FR', '🇩🇪 DE', '🇯🇵 JP', '🇨🇳 CN'].map((lang, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              {t('footer.copyright')}
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                {t('footer.privacy')}
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                {t('footer.terms')}
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                {t('footer.cookies')}
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                {t('footer.support')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;