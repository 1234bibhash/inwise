'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          ElectroHub
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-8">
          Your Complete Electronic Store Management Platform
        </p>
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
          Explore products with 3D viewers, AR room previews, and book service calls all in one place.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-700/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">For Customers</h2>
            <p className="text-slate-300 mb-6">
              Browse products, view in 3D, check how they look in your room, and book service calls easily.
            </p>
            <Link href="/customer/home">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Browse Products</Button>
            </Link>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">For Business Owners</h2>
            <p className="text-slate-300 mb-6">
              Manage customers, orders, service calls, employees, and documents from one dashboard.
            </p>
            <Link href="/owner/dashboard">
              <Button className="w-full bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Download Apps Section */}
        <div className="flex flex-col items-center mb-12 bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Download the Native Apps</h2>
          <p className="text-slate-400 mb-6 max-w-lg">
            Experience InWise directly on your desktop or mobile device. These apps connect directly to this local server.
          </p>
          <div className="flex gap-4">
            <a href="/downloads/InWise.exe" download>
              <Button variant="outline" className="text-slate-900 font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                Download for Windows
              </Button>
            </a>
            <a href="/downloads/app-debug.apk" download>
              <Button variant="outline" className="text-slate-900 font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                Download Android APK
              </Button>
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 text-left">
          <div className="bg-slate-700/30 rounded p-4">
            <h3 className="font-semibold text-white mb-2">3D Products</h3>
            <p className="text-sm text-slate-400">Interactive 3D viewers and 360° images</p>
          </div>
          <div className="bg-slate-700/30 rounded p-4">
            <h3 className="font-semibold text-white mb-2">AR Preview</h3>
            <p className="text-sm text-slate-400">See how products look in your room</p>
          </div>
          <div className="bg-slate-700/30 rounded p-4">
            <h3 className="font-semibold text-white mb-2">Service Calls</h3>
            <p className="text-sm text-slate-400">Book installation, repair, or warranty services</p>
          </div>
          <div className="bg-slate-700/30 rounded p-4">
            <h3 className="font-semibold text-white mb-2">Notifications</h3>
            <p className="text-sm text-slate-400">Get alerts about offers and warranty reminders</p>
          </div>
        </div>
      </div>
    </div>
  )
}
