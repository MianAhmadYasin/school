import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const managerMenuItems = [
  { title: 'Dashboard', path: '/manager', icon: 'dashboard' },
  { title: 'Inventory', path: '/manager/inventory', icon: 'boxes' },
  { title: 'Distributions', path: '/manager/distributions', icon: 'package' },
  { title: 'Transactions', path: '/manager/transactions', icon: 'exchange' },
  { title: 'Reports', path: '/manager/reports', icon: 'chart-bar' },
  { title: 'Alerts', path: '/manager/alerts', icon: 'bell' },
  { title: 'Settings', path: '/manager/settings', icon: 'cog' },
];

export function ManagerLayout() {
  const { profile } = useAuth();

  if (profile?.role !== 'manager') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar menuItems={managerMenuItems} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

