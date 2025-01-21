type StatusBadgeProps = {
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
}

const statusStyles = {
  new: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  open: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  pending: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  resolved: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-600 ring-gray-500/10',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
} 