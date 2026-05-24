'use client'

import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Rocket, 
  Zap, 
  Shield, 
  Smartphone,
  Video,
  CreditCard,
  MessageCircle,
  Brain
} from 'lucide-react'

interface RoadmapItem {
  title: string
  icon: any
  description: string
  progress?: number
}

interface RoadmapPhase {
  phase: string
  status: 'completed' | 'in-progress' | 'upcoming'
  items: RoadmapItem[]
}

const ROADMAP: RoadmapPhase[] = [
  {
    phase: 'Phase 1: Foundation',
    status: 'completed',
    items: [
      { title: 'Authentication & RBAC', icon: Shield, description: 'Supabase-powered role-based access control.' },
      { title: 'Product Catalog', icon: Rocket, description: 'Interactive product listings with 3D views.' },
      { title: 'Owner Dashboard', icon: Zap, description: 'Real-time analytics and store management.' },
      { title: 'Service Bookings', icon: Clock, description: 'Customer service call management system.' }
    ]
  },
  {
    phase: 'Phase 2: Growth',
    status: 'in-progress',
    items: [
      { title: 'AR Room Preview', icon: Brain, description: 'AI-powered spatial analysis for product placement.', progress: 20 },
      { title: 'Stripe Integration', icon: CreditCard, description: 'Secure payment processing and checkout.', progress: 10 },
      { title: 'WhatsApp Integration', icon: MessageCircle, description: 'Direct customer communication channels.', progress: 80 },
      { title: 'Warranty Automation', icon: Shield, description: 'Automated expiry reminders and tracking.', progress: 5 }
    ]
  },
  {
    phase: 'Phase 3: Scale',
    status: 'upcoming',
    items: [
      { title: 'Mobile Application', icon: Smartphone, description: 'Dedicated iOS and Android apps for customers.' },
      { title: 'Video Call Support', icon: Video, description: 'Remote consultation and technical support.' },
      { title: 'Advanced Analytics', icon: Brain, description: 'Predictive inventory and revenue forecasting.' }
    ]
  }
]

export default function RoadmapPage() {
  return (
    <div className="min-h-screen">
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-gray-50 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
          Management <span className="text-gray-200">/</span> <span className="text-gray-900">Project Roadmap</span>
        </div>
      </header>

      <div className="p-8 max-w-[1200px] mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Development Roadmap</h2>
          <p className="text-gray-500 mt-2 font-medium">Tracking our journey to build the ultimate electronics management platform.</p>
        </div>

        <div className="space-y-16">
          {ROADMAP.map((phase, idx) => (
            <div key={idx} className="relative">
              {idx !== ROADMAP.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-[2px] bg-gray-100 -mb-16" />
              )}
              
              <div className="flex items-center gap-6 mb-8">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  phase.status === 'completed' ? 'bg-green-100 text-green-600' :
                  phase.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {phase.status === 'completed' ? <CheckCircle2 className="h-8 w-8" /> :
                   phase.status === 'in-progress' ? <Zap className="h-8 w-8 animate-pulse" /> :
                   <Circle className="h-8 w-8" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{phase.phase}</h3>
                  <p className={`text-sm font-bold uppercase tracking-widest ${
                    phase.status === 'completed' ? 'text-green-600' :
                    phase.status === 'in-progress' ? 'text-blue-600' :
                    'text-gray-400'
                  }`}>
                    {phase.status.replace('-', ' ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-20">
                {phase.items.map((item, i) => (
                  <div key={i} className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.description}</p>
                        
                        {item.progress !== undefined && (
                          <div className="mt-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">
                              <span>Progress</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
