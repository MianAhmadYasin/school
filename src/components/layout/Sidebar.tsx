import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Package,
  FileText,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: Array<'admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'librarian'>;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'],
  },
  {
    id: 'students',
    label: 'Students',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin', 'teacher'],
  },
  {
    id: 'teachers',
    label: 'Teachers',
    icon: <GraduationCap className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    id: 'academics',
    label: 'Academics',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['admin', 'teacher'],
  },
  {
    id: 'results',
    label: 'Results',
    icon: <FileText className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student', 'parent'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Package className="w-5 h-5" />,
    roles: ['admin', 'librarian'],
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: <FileText className="w-5 h-5" />,
    roles: ['admin', 'student'],
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: <Bell className="w-5 h-5" />,
    roles: ['admin', 'accountant'],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: <Bell className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student', 'parent'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin'],
  },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const allowedItems = navItems.filter((item) =>
    profile?.role ? item.roles.includes(profile.role) : false
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">GG-SMS</h1>
        <p className="text-sm text-gray-600 mt-1">Ghani Grammar School</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {allowedItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
          <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
