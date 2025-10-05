import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const adminMenuItems = [
  { title: 'Overview', path: '/admin', icon: 'dashboard' },
  { title: 'User Management', path: '/admin/users', icon: 'users' },
  { title: 'Students', path: '/admin/students', icon: 'user-graduate' },
  { title: 'Teachers', path: '/admin/teachers', icon: 'chalkboard-teacher' },
  { title: 'Classes', path: '/admin/classes', icon: 'school' },
  { title: 'Attendance', path: '/admin/attendance', icon: 'calendar-check' },
  { title: 'Finance', path: '/admin/finance', icon: 'money-bill' },
  { title: 'Inventory', path: '/admin/inventory', icon: 'boxes' },
  { title: 'Reports', path: '/admin/reports', icon: 'chart-bar' },
  { title: 'Settings', path: '/admin/settings', icon: 'cog' },
];

export function AdminLayout() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar menuItems={adminMenuItems} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}