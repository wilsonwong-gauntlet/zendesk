import { getTicketStatistics } from '@/lib/tickets/statistics'
import {
  DocumentTextIcon,
  InboxIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default async function TicketStats() {
  const stats = await getTicketStatistics()

  const statCards = [
    {
      name: 'New Tickets',
      value: stats.newTickets,
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Open Tickets',
      value: stats.openTickets,
      icon: InboxIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Resolved Today',
      value: stats.resolvedToday,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Urgent',
      value: stats.urgentTickets,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${card.color} rounded-md p-3`}>
                  <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 