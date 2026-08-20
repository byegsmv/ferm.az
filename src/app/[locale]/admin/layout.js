import React from 'react';
import AdminSidebarNav from '@/components/dashboard/AdminSidebarNav';

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
        <main className="py-4 md:py-6 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
