import React from 'react';
import NoCodeAdminStudio from '@/components/dashboard/NoCodeAdminStudio';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Tənzimləmələr</h1>
          <p className="text-gray-500 mt-1">Sistemin əsas işləmə məntiqi və konfiqurasiyaları.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <NoCodeAdminStudio />
      </div>
    </div>
  );
}
