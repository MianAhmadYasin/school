import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: (currentView: string) => React.ReactNode;
  initialView?: string;
}

export function DashboardLayout({ children, initialView = 'dashboard' }: DashboardLayoutProps) {
  const [currentView, setCurrentView] = useState(initialView);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children(currentView)}</main>
      </div>
    </div>
  );
}
