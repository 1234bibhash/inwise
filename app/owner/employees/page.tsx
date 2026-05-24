'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Phone } from 'lucide-react'

interface Employee {
  id: string
  employee_number: string
  department: string
  position: string
  hire_date: string
  is_active: boolean
  profile: {
    full_name: string
    email: string
    phone: string
  } | null
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])
  async function loadEmployees() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('employees')
        .select('*, profile:profiles(full_name, email, phone)')
        .eq('is_active', true)
        .order('hire_date', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members and staff</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-lg font-medium shadow-sm transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employees List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-600">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(employee => (
            <div
              key={employee.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {employee.profile?.full_name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[10px] font-medium uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{employee.employee_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dept</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{employee.department}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {employee.profile?.email && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-xs truncate">{employee.profile.email}</span>
                    </div>
                  )}
                  {employee.profile?.phone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="text-xs">{employee.profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
