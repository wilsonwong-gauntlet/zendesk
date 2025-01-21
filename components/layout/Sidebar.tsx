'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  Cog8ToothIcon,
  DocumentTextIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: DocumentTextIcon }
]

const adminNavigation = [
  { name: 'Channels', href: '/settings/channels', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
  { name: 'Simulator', href: '/simulator', icon: BeakerIcon }
]

export default function Sidebar({ userRole }: { userRole: string | null }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Support Desk
          </Link>
        </div>
        <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}

          {userRole === 'admin' && (
            <div className="mt-8">
              <h3 className="px-3 text-sm font-medium text-gray-500">Admin</h3>
              <div className="mt-1 space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  )
} 