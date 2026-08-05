'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import { BarChart3, Users, Package, DollarSign, TrendingUp, Settings, LogOut, Sun, Moon } from 'lucide-react';

export default function ModernAdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/admin/stats');
        setStats(data);
      } catch (err) {
        showToast('Stats yükləmə xətası', 'error');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiFetch('/api/users/me');
        if (!['ADMIN', 'SUPER_ADMIN'].includes(data.role)) {
          router.push('/login');
          return;
        }
        setUser(data);
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand-500 animate-spin mb-4 mx-auto"></div>
          <p className="text-slate-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`flex min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        
        {/* SIDEBAR */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } border-r transition-all duration-300 flex flex-col fixed h-screen`}
        >
          {/* Logo */}
          <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'} flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <h1 className="font-bold text-xl bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">FM Admin</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            >
              ☰
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {[
              { id: 'dashboard', icon: '📊', label: 'Dashboard', role: ['ADMIN', 'SUPER_ADMIN'] },
              { id: 'users', icon: '👥', label: 'İstifadəçilər', role: ['ADMIN', 'SUPER_ADMIN'] },
              { id: 'products', icon: '📦', label: 'Məhsullar', role: ['ADMIN', 'SUPER_ADMIN'] },
              { id: 'orders', icon: '🛒', label: 'Sifarişlər', role: ['ADMIN', 'SUPER_ADMIN'] },
              { id: 'pages', icon: '🖼️', label: 'Səhifələr (Builder)', role: ['SUPER_ADMIN'] },
              { id: 'modules', icon: '⚙️', label: 'Modullar', role: ['SUPER_ADMIN'] },
              { id: 'settings', icon: '⚡', label: 'Sistem Ayarları', role: ['SUPER_ADMIN'] },
            ].map(
              item =>
                item.role.includes(user.role) && (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-2'} py-3 rounded-lg font-medium transition-colors ${
                      activeTab === item.id
                        ? `${darkMode ? 'bg-brand-600' : 'bg-brand-50 text-brand-600'}`
                        : `${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="ml-3">{item.label}</span>}
                  </button>
                )
            )}
          </nav>

          {/* User Profile */}
          <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {sidebarOpen && <span className="ml-2 text-sm">{darkMode ? 'Işıq' : 'Tünd'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-2 rounded-lg text-red-500 ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
            >
              <LogOut size={18} />
              {sidebarOpen && <span className="ml-2 text-sm">Çıxış</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          
          {/* Top Bar */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b p-6 sticky top-0 z-10`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'users' && 'İstifadəçilər Yönetimi'}
                  {activeTab === 'products' && 'Məhsullar'}
                  {activeTab === 'orders' && 'Sifarişlər'}
                  {activeTab === 'pages' && 'Səhifə Builder'}
                  {activeTab === 'modules' && 'Modul Yönetimi'}
                  {activeTab === 'settings' && 'Sistem Ayarları'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {new Date().toLocaleDateString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{user.fullName}</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold">
                  {user.fullName?.charAt(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'dashboard' && <DashboardTab stats={stats} darkMode={darkMode} />}
            {activeTab === 'users' && <UsersTab darkMode={darkMode} />}
            {activeTab === 'products' && <ProductsTab darkMode={darkMode} />}
            {activeTab === 'orders' && <OrdersTab darkMode={darkMode} />}
            {activeTab === 'pages' && <PagesBuilderTab darkMode={darkMode} />}
            {activeTab === 'modules' && user.role === 'SUPER_ADMIN' && <ModulesTab darkMode={darkMode} />}
            {activeTab === 'settings' && user.role === 'SUPER_ADMIN' && <SettingsTab darkMode={darkMode} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({ stats, darkMode }) {
  const cards = [
    { icon: Users, label: 'Toplam İstifadəçi', value: stats?.users?.total || 0, color: 'blue' },
    { icon: Package, label: 'Aktiv Məhsul', value: stats?.products?.active || 0, color: 'green' },
    { icon: BarChart3, label: 'Ümumi Sifariş', value: stats?.orders?.total || 0, color: 'purple' },
    { icon: DollarSign, label: 'Aylıq Gəlir', value: `₼${stats?.revenue?.monthly || 0}`, color: 'amber' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <card.icon className={`text-${card.color}-500`} size={24} />
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{card.label}</p>
            <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-8 shadow-sm h-64 flex items-center justify-center`}>
        <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>📊 Analitika Charts (Recharts ilə əlavə olacaq)</p>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>İstifadəçi Siyahısı</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>User management interface coming soon...</p>
    </div>
  );
}

// Products Tab
function ProductsTab({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Məhsullar</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Product management interface coming soon...</p>
    </div>
  );
}

// Orders Tab
function OrdersTab({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sifarişlər</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Orders management interface coming soon...</p>
    </div>
  );
}

// Pages Builder Tab
function PagesBuilderTab({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Səhifə Builder (WYSIWYG)</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Drag-drop page builder coming soon...</p>
    </div>
  );
}

// Modules Tab
function ModulesTab({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Modul Yönetimi</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Module toggle system coming soon...</p>
    </div>
  );
}

// Settings Tab
function SettingsTab({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sistem Ayarları</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System settings interface coming soon...</p>
    </div>
  );
}
