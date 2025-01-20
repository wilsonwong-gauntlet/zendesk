'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UserList() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching users:', error)
          setError(error.message)
          return
        }

        setUsers(data || [])
        setError(null)
      } catch (error) {
        console.error('Error:', error)
        setError('An error occurred while fetching users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'agent' | 'customer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Refresh the user list
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setUsers(data || [])
      
    } catch (error) {
      console.error('Error updating role:', error)
      setError('Failed to update user role')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No users found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{user.email}</h3>
                <p className="text-sm text-gray-600 mt-1">{user.full_name || 'No name set'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleUpdate(user.id, e.target.value as 'admin' | 'agent' | 'customer')}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="customer">Customer</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 