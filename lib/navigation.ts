export type NavItem = {
  label: string
  href: string
  icon?: string
  adminOnly?: boolean
}

export type NavigationConfig = {
  [key: string]: NavItem[]
}

export const navigationConfig: NavigationConfig = {
  admin: [
    { label: 'Tickets', href: '/dashboard' },
    { label: 'Users', href: '/users' },
    { label: 'Reports', href: '/reports' },
    { label: 'Settings', href: '/settings' }
  ],
  agent: [
    { label: 'Tickets', href: '/dashboard' },
    { label: 'My Reports', href: '/my-reports' }
  ],
  customer: [
    { label: 'My Tickets', href: '/my-tickets' },
    { label: 'Submit Ticket', href: '/submit-ticket' }
  ]
}

export function getNavigationByRole(role?: string): NavItem[] {
  if (!role) return []
  return navigationConfig[role.toLowerCase()] || []
} 