'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'English' | 'Bengali' | 'Hindi'

interface Translations {
  [key: string]: {
    English: string
    Bengali: string
    Hindi: string
  }
}

const DICTIONARY: Translations = {
  // Navigation
  home: { English: 'Home', Bengali: 'হোম', Hindi: 'होम' },
  orders: { English: 'Orders', Bengali: 'অর্ডার', Hindi: 'ऑर्डर' },
  track_shipment: { English: 'Track Shipment', Bengali: 'শিপমেন্ট ট্র্যাক', Hindi: 'शिपमेंट ट्रैक' },
  wishlist: { English: 'Wishlist', Bengali: 'উইশলিস্ট', Hindi: 'इच्छा सूची' },
  cart: { English: 'Cart', Bengali: 'কার্ট', Hindi: 'कार्ट' },
  
  // Sidebar
  browse_categories: { English: 'Browse Categories', Bengali: 'বিভাগগুলি দেখুন', Hindi: 'श्रेणियाँ देखें' },
  account_settings: { English: 'Account Settings', Bengali: 'অ্যাকাউন্ট সেটিংস', Hindi: 'अकाउंट सेटिंग्स' },
  log_out: { English: 'Log Out', Bengali: 'লগ আউট', Hindi: 'लॉग आउट' },
  
  // Header
  search_placeholder: { English: 'Search tech, brands, and models...', Bengali: 'টেক, ব্র্যান্ড এবং মডেল খুঁজুন...', Hindi: 'टेक, ब्रांड और मॉडल खोजें...' },
  deliver_to: { English: 'Deliver to', Bengali: 'ডেলিভারি হবে', Hindi: 'डिलीवरी यहाँ होगी' },
  all_categories: { English: 'All', Bengali: 'সব', Hindi: 'सब' },
  
  // Home Page
  summer_tech_fest: { English: 'Summer Tech Fest 2026', Bengali: 'সামার টেক ফেস্ট ২০২৬', Hindi: 'समर टेक फेस्ट 2026' },
  premium_tech: { English: 'Premium Tech,', Bengali: 'প্রিমিয়াম টেক,', Hindi: 'प्रीमियम टेक,' },
  hooghly_pride: { English: 'Hooghly Pride.', Bengali: 'হুগলি গর্ব।', Hindi: 'हुगली गौरव।' },
  banner_desc: { English: 'Upgrade your lifestyle with the latest tech. Special offers for Hooghly residents.', Bengali: 'সর্বশেষ প্রযুক্তির সাথে আপনার লাইফস্টাইল উন্নত করুন। হুগলি বাসীদের জন্য বিশেষ অফার।', Hindi: 'नवीनतम तकनीक के साथ अपनी जीवनशैली को अपग्रेड करें। हुगली निवासियों के लिए विशेष ऑफर।' },
  shop_now: { English: 'Shop Now', Bengali: 'এখনই কেনাকাটা করুন', Hindi: 'अभी खरीदें' },
  view_offers: { English: 'View Offers', Bengali: 'অফার দেখুন', Hindi: 'ऑफर देखें' },
  tech_categories: { English: 'Tech Categories', Bengali: 'টেক বিভাগ', Hindi: 'टेक श्रेणियाँ' },
  trending_now: { English: 'Trending Now', Bengali: 'এখন ট্রেন্ডিং', Hindi: 'अभी ट्रेंडिंग' },
  best_seller: { English: 'Best Seller', Bengali: 'সেরা বিক্রেতা', Hindi: 'बेस्ट सेलर' },
  
  // Product Detail
   Spatial_Reality: { English: 'Spatial Reality', Bengali: 'স্পেশাল রিয়েলিটি', Hindi: 'स्थानिक वास्तविकता' },
  warranty: { English: 'Warranty', Bengali: 'ওয়ারেন্টি', Hindi: 'वारंटी' },
  months_local: { English: 'Months Local', Bengali: 'মাস লোকাল', Hindi: 'महीने लोकल' },
  add_to_cart: { English: 'Add to Cart', Bengali: 'কার্টে যোগ করুন', Hindi: 'कार्ट में जोड़ें' },
  buy_now: { English: 'Buy Now', Bengali: 'এখনই কিনুন', Hindi: 'अभी खरीदें' },
  
  // Categories
  'Smartphones & Tablets': { English: 'Smartphones & Tablets', Bengali: 'স্মার্টফোন ও ট্যাবলেট', Hindi: 'स्मार्टफोन और टैबलेट' },
  'Laptops & Computers': { English: 'Laptops & Computers', Bengali: 'ল্যাপটপ ও কম্পিউটার', Hindi: 'लैपटॉप और कंप्यूटर' },
  'Televisions & Home Audio': { English: 'Televisions & Home Audio', Bengali: 'টেলিভিশন ও হোম অডিও', Hindi: 'टेलीविज़न और होम ऑडियो' },
  'Cameras & Photo': { English: 'Cameras & Photo', Bengali: 'ক্যামেরা ও ফটো', Hindi: 'कैमरा और फोटो' },
  'Headphones & Speakers': { English: 'Headphones & Speakers', Bengali: 'হেডফোন ও স্পিকার', Hindi: 'हेडफोन और स्पीकर' },
  'Smart Home & IoT': { English: 'Smart Home & IoT', Bengali: 'স্মার্ট হোম ও আইওটি', Hindi: 'स्मार्ट होम और आईओटी' },
  'Wearable Technology': { English: 'Wearable Technology', Bengali: 'পরাযোগ্য প্রযুক্তি', Hindi: 'पहनने योग्य तकनीक' },
  'Computer Components': { English: 'Computer Components', Bengali: 'কম্পিউটার পার্টস', Hindi: 'कंप्यूटर घटक' },
  'Gaming Consoles': { English: 'Gaming Consoles', Bengali: 'গেমিং কনসোল', Hindi: 'गेमिंग कंसोल' },
  'Accessories': { English: 'Accessories', Bengali: 'এক্সেসরিজ', Hindi: 'एक्सेसरीज' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English')

  const t = (key: string) => {
    if (!DICTIONARY[key]) return key
    return DICTIONARY[key][language]
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
