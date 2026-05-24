'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createServiceCall, getServiceCalls, type ServiceCall } from '@/lib/services/serviceCallService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Phone, Zap, CheckCircle } from 'lucide-react'

type ServiceType = 'installation' | 'repair' | 'warranty' | 'consultation'

import { Suspense } from 'react'

function ServiceCallsContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')

  const [isNewCall, setIsNewCall] = useState(false)
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([])
  const [customerId, setCustomerId] = useState<string>('demo-customer-001')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType>('installation')
  const [scheduledDate, setScheduledDate] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadServiceCalls()
  }, [])

  if (!mounted) return null

  async function loadServiceCalls() {
    try {
      const calls = await getServiceCalls(customerId)
      setServiceCalls(calls)
    } catch (error) {
      console.error('Error loading service calls:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateServiceCall(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createServiceCall(
        customerId,
        serviceType,
        productId || undefined,
        scheduledDate || undefined,
        issueDescription || undefined
      )

      // Reset form
      setServiceType('installation')
      setScheduledDate('')
      setIssueDescription('')
      setIsNewCall(false)

      // Reload service calls
      await loadServiceCalls()
    } catch (error) {
      console.error('Error creating service call:', error)
      alert('Failed to create service call. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Service Calls</h1>
            <Button
              onClick={() => setIsNewCall(!isNewCall)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isNewCall ? 'Cancel' : 'New Service Call'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Service Call Form */}
          {isNewCall && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Book Service Call</h2>
                <form onSubmit={handleCreateServiceCall} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type
                    </label>
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value as ServiceType)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="installation">Installation</option>
                      <option value="repair">Repair</option>
                      <option value="warranty">Warranty Service</option>
                      <option value="consultation">Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Description
                    </label>
                    <textarea
                      value={issueDescription}
                      onChange={e => setIssueDescription(e.target.value)}
                      placeholder="Describe the issue or what you need help with..."
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Call'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Service Calls List */}
          <div className={isNewCall ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {serviceCalls.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service Calls Yet</h3>
                <p className="text-gray-600 mb-4">
                  Book a service call for installation, repair, or warranty service
                </p>
                <Button
                  onClick={() => setIsNewCall(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Book Your First Call
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceCalls.map(call => (
                  <div
                    key={call.id}
                    className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {call.service_type.charAt(0).toUpperCase() + call.service_type.slice(1)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              call.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : call.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {call.issue_description && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Issue:</strong> {call.issue_description}
                        </p>
                      </div>
                    )}

                    {call.scheduled_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Calendar className="h-4 w-4" />
                        Scheduled: {new Date(call.scheduled_date).toLocaleString()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Support
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {call.status !== 'completed' && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ServiceCalls() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <ServiceCallsContent />
    </Suspense>
  )
}
