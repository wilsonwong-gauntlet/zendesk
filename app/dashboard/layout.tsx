import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { MainNav } from '@/components/navigation/MainNav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user role and email
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user?.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav 
        user={user} 
        userRole={profile?.role} 
        userEmail={profile?.email || user?.email} 
      />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          {children}
        </div>
      </main>
    </div>
  )
} 