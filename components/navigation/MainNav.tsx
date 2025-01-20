'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavItem, getNavigationByRole } from '@/lib/navigation'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { User } from '@supabase/supabase-js'
import { signOutAction } from '@/app/actions'
import { SubmitButton } from '@/components/submit-button'

interface MainNavProps {
  user: User | null
  userRole?: string
  userEmail?: string
}

export function MainNav({ user, userRole, userEmail }: MainNavProps) {
  const pathname = usePathname()
  const navItems = getNavigationByRole(userRole)

  return (
    <nav className="bg-white shadow-sm dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800 dark:text-white">
                NexusDesk
              </Link>
            </div>

            {/* Navigation Items */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'border-indigo-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - User section */}
          <div className="flex items-center space-x-4">
            {userEmail && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {userEmail}
              </span>
            )}
            {userRole && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
            <ThemeSwitcher />
            <form action={signOutAction}>
              <SubmitButton variant="ghost" size="sm" pendingText="Signing out...">
                Sign out
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
} 