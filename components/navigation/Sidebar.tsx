'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  InboxIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

interface NavItem {
  name: string
  href: string
  icon: typeof InboxIcon
  badge?: number
}

const mainNavItems: NavItem[] = [
  { name: 'All Tickets', href: '/dashboard', icon: InboxIcon, badge: 0 },
  { name: 'My Tickets', href: '/dashboard/my-tickets', icon: InboxIcon },
  { name: 'Unassigned', href: '/dashboard/unassigned', icon: InboxIcon },
  { name: 'Users', href: '/dashboard/users', icon: UserGroupIcon },
  { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpenIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
]

interface FilterSection {
  name: string
  filters: {
    name: string
    value: string
    count?: number
  }[]
}

const filterSections: FilterSection[] = [
  {
    name: 'Status',
    filters: [
      { name: 'New', value: 'new', count: 3 },
      { name: 'Open', value: 'open', count: 5 },
      { name: 'Pending', value: 'pending', count: 2 },
      { name: 'Resolved', value: 'resolved', count: 1 },
      { name: 'Closed', value: 'closed', count: 8 },
    ],
  },
  {
    name: 'Priority',
    filters: [
      { name: 'Urgent', value: 'urgent', count: 1 },
      { name: 'High', value: 'high', count: 2 },
      { name: 'Medium', value: 'medium', count: 4 },
      { name: 'Low', value: 'low', count: 3 },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [showFilters, setShowFilters] = useState(true)

  return (
    <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] flex flex-col">
      {/* Main Navigation */}
      <nav className="p-4 flex-1">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5
                    ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && (
                  <span className={`
                    ml-3 inline-block py-0.5 px-2 text-xs rounded-full
                    ${isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Filters Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500">Filters</h2>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-400 hover:text-gray-500"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4">
            {filterSections.map((section) => (
              <div key={section.name}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.name}
                </h3>
                <div className="space-y-1">
                  {section.filters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className="flex items-center w-full px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      <span className="flex-1 text-left">{filter.name}</span>
                      {filter.count !== undefined && (
                        <span className="ml-2 text-xs text-gray-400">{filter.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 