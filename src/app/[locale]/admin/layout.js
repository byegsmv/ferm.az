import React from 'react';

export const metadata = {
  title: 'Admin Panel | FermerMarket',
  description: 'FermerMarket İdarəetmə Paneli',
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
