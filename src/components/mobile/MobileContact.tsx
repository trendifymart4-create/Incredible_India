import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';

const MobileContact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      content: "+91 1234567890",
      action: "tel:+911234567890"
    },
    {
      icon: Mail,
      title: "Email",
      content: "hello@incredibleindia.com",
      action: "mailto:hello@incredibleindia.com"
    },
    {
      icon: MapPin,
      title: "Address",
      content: "New Delhi, India",
      action: null
    },
    {
      icon: Clock,
      title: "Working Hours",
      content: "Mon-Fri: 9AM-6PM IST",
      action: null
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  return (
    <div className="pt-16 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-600">Get in touch with our team</p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              className="bg-white rounded-lg p-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={info.action ? { scale: 0.98 } : {}}
              onClick={info.action ? () => window.location.href = info.action : undefined}
            >
              <info.icon className="text-orange-500 mb-2" size={20} />
              <p className="text-xs font-medium text-gray-800 mb-1">{info.title}</p>
              <p className="text-xs text-gray-600">{info.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="px-4">
        <motion.div
          className="bg-white rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <MessageCircle className="text-orange-500 mr-2" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Send us a message</h2>
          </div>

          {submitSuccess && (
            <motion.div
              className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-green-800 text-sm">
                ✅ Message sent successfully! We'll get back to you soon.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div>
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div>
              <textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors resize-none"
              ></textarea>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg flex items-center justify-center transition-colors"
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Send Message
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            {
              question: "How do I book a VR tour?",
              answer: "Simply browse our destinations and click on the VR button to start an immersive experience."
            },
            {
              question: "Are the tours free?",
              answer: "Basic tours are free, while premium experiences require a subscription."
            },
            {
              question: "Can I use this offline?",
              answer: "Some content is available offline after downloading through our mobile app."
            }
          ].map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <h3 className="font-medium text-gray-800 mb-2">{faq.question}</h3>
              <p className="text-sm text-gray-600">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileContact;