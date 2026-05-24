'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Mail, Phone, MapPin, Eye, MessageCircle, PhoneCall } from 'lucide-react'
import Link from 'next/link'
import { triggerManualAICall } from '@/lib/services/voiceService'
import { toast } from 'sonner'

interface Customer {
  id: string
  contact_email: string
  contact_phone: string
  preferred_contact: string
  notification_enabled: boolean
  created_at: string
  profile: {
    full_name: string
  } | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    fullName: '',
    address: '',
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    const filtered = customers.filter(c =>
      c.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_phone.includes(searchQuery) ||
      (c.profile?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredCustomers(filtered)
  }, [searchQuery, customers])



  async function loadCustomers() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('*, profile:profiles(full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = createClient()

      // Create new customer
      const { data, error } = await supabase
        .from('customers')
        .insert({
          contact_email: formData.email,
          contact_phone: formData.phone,
          notification_enabled: true,
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('profiles')
        .upsert({
          id: data.id,
          full_name: formData.fullName,
        })

      const normalizedCustomer = {
        ...data,
        profile: {
          full_name: formData.fullName,
        },
      }

      setCustomers([normalizedCustomer, ...customers])
      setFormData({ email: '', phone: '', fullName: '', address: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Failed to add customer')
    }
  }

  async function handleAICall(phone: string, name: string) {
    try {
      const call = await triggerManualAICall(phone, name)
      if (call) {
        toast.success(`AI Call initiated to ${name}`)
      } else {
        toast.error(`Failed to initiate AI call`)
      }
    } catch (error) {
      toast.error("Connectivity error")
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer database and contact details</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-lg font-medium shadow-sm transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Customer</h3>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Customer address"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                Save Customer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border-0 p-0 focus:ring-0 bg-transparent text-sm placeholder:text-gray-400 h-6"
          />
        </div>
      </div>

      {/* Customers List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading customers...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {customer.profile?.full_name || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a
                          href={`mailto:${customer.contact_email}`}
                          className="hover:text-blue-600"
                        >
                          {customer.contact_email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <div className="flex flex-col">
                          <a
                            href={`tel:${customer.contact_phone}`}
                            className="hover:text-blue-600 font-bold"
                          >
                            {customer.contact_phone}
                          </a>
                          <a 
                            href={`https://wa.me/${customer.contact_phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="h-2 w-2" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                          customer.notification_enabled
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {customer.notification_enabled ? 'Active' : 'Muted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAICall(customer.contact_phone, customer.profile?.full_name || 'Customer')}
                      >
                        <PhoneCall className="h-4 w-4 mr-1" />
                        Call AI
                      </Button>
                      <Link href={`/owner/customers/${customer.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && customers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}
    </div>
  )
}
