import { createClient } from '@/utils/supabase/server'
import UserList from '@/components/users/UserList'
import UserForm from '@/components/users/UserForm'

export default async function UsersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Users</h2>
          <UserList />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-6">Create User</h2>
          <UserForm />
        </div>
      </div>
    </div>
  )
} 