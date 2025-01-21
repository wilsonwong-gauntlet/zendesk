type PriorityBadgeProps = {
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

const priorityStyles = {
  low: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  medium: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  high: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  urgent: 'bg-red-50 text-red-700 ring-red-600/10',
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${priorityStyles[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
} 