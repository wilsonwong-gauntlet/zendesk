import EnhancedTicketList from '@/components/tickets/EnhancedTicketList'
import TicketStats from '@/components/dashboard/TicketStats'
import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track support requests
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/tickets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <TicketStats />
      </div>

      {/* Ticket List */}
      <EnhancedTicketList />
    </div>
  )
} 