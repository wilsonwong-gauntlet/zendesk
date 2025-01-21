'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  InboxIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface NavItem {
  name: string
  href: string
  icon: typeof InboxIcon
  badge?: number
}

const mainNavItems: NavItem[] = [
  { name: 'All Tickets', href: '/dashboard', icon: InboxIcon },
  { name: 'My Tickets', href: '/dashboard/my-tickets', icon: InboxIcon },
  { name: 'Unassigned', href: '/dashboard/unassigned', icon: InboxIcon },
  { name: 'Users', href: '/dashboard/users', icon: UserGroupIcon },
  { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpenIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
]

interface FilterCounts {
  status: Record<string, number>
  priority: Record<string, number>
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(true)
  const [counts, setCounts] = useState<FilterCounts>({
    status: {},
    priority: {}
  })
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchCounts = async () => {
    // Fetch total counts for each status
    const { data: statusCounts } = await supabase
      .from('tickets')
      .select('status', { count: 'exact', head: false })
      .select('status')

    // Fetch total counts for each priority
    const { data: priorityCounts } = await supabase
      .from('tickets')
      .select('priority', { count: 'exact', head: false })
      .select('priority')

    const statusTotals: Record<string, number> = {}
    const priorityTotals: Record<string, number> = {}

    statusCounts?.forEach(ticket => {
      statusTotals[ticket.status] = (statusTotals[ticket.status] || 0) + 1
    })

    priorityCounts?.forEach(ticket => {
      priorityTotals[ticket.priority] = (priorityTotals[ticket.priority] || 0) + 1
    })

    setCounts({
      status: statusTotals,
      priority: priorityTotals
    })
  }

  useEffect(() => {
    fetchCounts()

    // Set up real-time subscription for counts
    const channel = supabase
      .channel('ticket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          fetchCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeStatus = searchParams.get('status')
  const activePriority = searchParams.get('priority')

  const handleFilterClick = (type: 'status' | 'priority', value: string) => {
    const params = new URLSearchParams(searchParams)
    const currentValue = params.get(type)

    if (currentValue === value) {
      params.delete(type)
    } else {
      params.set(type, value)
    }

    router.push(`/dashboard?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/dashboard')
  }

  const filterSections = [
    {
      name: 'STATUS',
      type: 'status' as const,
      items: [
        { label: 'New', value: 'new' },
        { label: 'Open', value: 'open' },
        { label: 'Pending', value: 'pending' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' }
      ]
    },
    {
      name: 'PRIORITY',
      type: 'priority' as const,
      items: [
        { label: 'Urgent', value: 'urgent' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' }
      ]
    }
  ]

  // Update All Tickets badge count
  mainNavItems[0].badge = Object.values(counts.status).reduce((a, b) => a + b, 0)

  const hasActiveFilters = activeStatus || activePriority

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
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-400 hover:text-gray-500"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4">
            {filterSections.map((section) => (
              <div key={section.name} className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{section.name}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = 
                      section.type === 'status' 
                        ? activeStatus === item.value
                        : activePriority === item.value
                    const count = counts[section.type][item.value] || 0

                    return (
                      <button
                        key={item.value}
                        onClick={() => handleFilterClick(section.type, item.value)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`${
                          isActive ? 'bg-indigo-100' : 'bg-gray-100'
                        } text-xs px-2 py-0.5 rounded-full`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 