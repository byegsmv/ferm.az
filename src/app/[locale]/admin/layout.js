import React from 'react';
import AdminSidebarNav from '@/components/dashboard/AdminSidebarNav';
import AdminCopilotWidget from '@/components/dashboard/AdminCopilotWidget';

export const metadata = {
  title: 'Admin Panel | FermerMarket',
  description: 'FermerMarket İdarəetmə Paneli',
};

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <AdminSidebarNav />
      {/* Content area */}
      <div className="flex-1 min-w-0">
        <main className="py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <AdminCopilotWidget />
    </div>
  );
}
