import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  FileText, 
  Settings,
  TrendingUp,
  Plus,
  Link2,
  Lightbulb
  Shield
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Agents', href: '/dashboard/agents', icon: Users },
  { name: 'Scans', href: '/dashboard/scans', icon: Search },
  { name: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
  { name: 'Profile Audit', href: '/dashboard/profile-audit', icon: Shield },
  { name: 'Competitors', href: '/dashboard/competitors', icon: TrendingUp },
  { name: 'Citations', href: '/dashboard/citations', icon: Link2 },
  { name: 'Prompt Performance', href: '/dashboard/reports/prompts', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-2xl font-bold text-notable-600">
            Notable
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Add Agent Button */}
        <div className="absolute bottom-20 left-0 right-0 p-4">
          <Link
            href="/dashboard/agents/new"
            className="flex items-center justify-center gap-2 w-full btn-primary"
          >
            <Plus className="h-5 w-5" />
            Add Agent
          </Link>
        </div>
        
        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-sm">
              <p className="font-medium text-gray-700">Your Account</p>
              <p className="text-gray-500">Manage profile</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
