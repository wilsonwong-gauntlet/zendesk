import TicketList from '@/components/tickets/TicketList'
import TicketForm from '@/components/tickets/TicketForm'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Tickets</h2>
          <TicketList />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-6">Create Ticket</h2>
          <TicketForm />
        </div>
      </div>
    </div>
  )
} 