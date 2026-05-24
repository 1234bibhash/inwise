'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search, Mail, Phone, MapPin, ArrowLeft, Plus } from 'lucide-react'

interface Customer {
  id: string
  contact_email: string
  contact_phone: string
  preferred_contact: string | null
  notification_enabled: boolean
  created_at: string
  profile?: {
    full_name: string
  } | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredContact: 'email',
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [searchQuery, customers])

  async function loadCustomers() {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterCustomers() {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = customers.filter(
      (customer) =>
        customer.contact_email.toLowerCase().includes(query) ||
        customer.contact_phone.includes(query)
    )
    setFilteredCustomers(filtered)
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = createClient()
      const { error } = await supabase.from('customers').insert({
        contact_email: newCustomer.email,
        contact_phone: newCustomer.phone,
        preferred_contact: newCustomer.preferredContact,
        notification_enabled: true,
      })

      if (error) throw error

      setNewCustomer({
        fullName: '',
        email: '',
        phone: '',
        preferredContact: 'email',
      })
      setShowAddForm(false)
      loadCustomers()
    } catch (error) {
      console.error('Error adding customer:', error)
    }
  }

  async function deleteCustomer(customerId: string) {
    if (!confirm('Are you sure you want to remove this customer?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error
      loadCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/customer/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Add Button */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={newCustomer.fullName}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Method
                </label>
                <select
                  value={newCustomer.preferredContact}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      preferredContact: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Customer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Customers List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No customers found matching your search.' : 'No customers yet.'}
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Customer
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Customer Details
                    </h3>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <a
                            href={`mailto:${customer.contact_email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {customer.contact_email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <a
                            href={`tel:${customer.contact_phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {customer.contact_phone}
                          </a>
                        </div>
                      </div>

                      {customer.preferred_contact && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-600">Preferred Contact</p>
                            <p className="text-gray-900 capitalize">
                              {customer.preferred_contact}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 flex-shrink-0">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              customer.notification_enabled
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                            }`}
                          ></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Notifications</p>
                          <p className="text-gray-900">
                            {customer.notification_enabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-3">
                        Added {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCustomer(customer.id)}
                    className="ml-4"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
