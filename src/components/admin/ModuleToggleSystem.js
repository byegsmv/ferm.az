'use client';

import { useState, useEffect } from 'react';
import { ToggleLeft, Save, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';

// Available frontend modules
const MODULES = {
  CATEGORIES_SLIDER: {
    id: 'CATEGORIES_SLIDER',
    name: 'Kateqoriyalar Slider',
    description: 'Anasəhifədə kateqoriyalar sürüşkənini göstər',
    category: 'Homepage',
    default: true,
  },
  HERO_SECTION: {
    id: 'HERO_SECTION',
    name: 'Hero Bölməsi',
    description: 'Böyük başlıq və axtarış bölməsi',
    category: 'Homepage',
    default: true,
  },
  PROMO_BANNER: {
    id: 'PROMO_BANNER',
    name: 'Promosyon Banner',
    description: 'Xüsusi təkliflər banneri',
    category: 'Homepage',
    default: true,
  },
  PRODUCTS_GRID: {
    id: 'PRODUCTS_GRID',
    name: 'Məhsullar Şəbəkəsi',
    description: 'Məhsulların göstərilməsi',
    category: 'Homepage',
    default: true,
  },
  BLOG_SECTION: {
    id: 'BLOG_SECTION',
    name: 'Bloq Bölməsi',
    description: 'Ən son bloq yazıları',
    category: 'Homepage',
    default: true,
  },
  TESTIMONIALS: {
    id: 'TESTIMONIALS',
    name: 'Rəylər',
    description: 'Müştəri rəyləri göstər',
    category: 'Homepage',
    default: false,
  },
  NEWSLETTER_SIGNUP: {
    id: 'NEWSLETTER_SIGNUP',
    name: 'Haber Sayılması',
    description: 'Email abunəliyi forması',
    category: 'Homepage',
    default: false,
  },
  WEATHER_WIDGET: {
    id: 'WEATHER_WIDGET',
    name: 'Hava Durumu Widget',
    description: 'Kənd təsərrüfatçılar üçün hava durumu',
    category: 'Features',
    default: true,
  },
  AGRONOMIST_AI: {
    id: 'AGRONOMIST_AI',
    name: 'Aqronom AI Yardımcısı',
    description: 'AI xəstəlik teşhis və məsləhət',
    category: 'Features',
    default: true,
  },
  COMPARISON_TOOL: {
    id: 'COMPARISON_TOOL',
    name: 'Məhsul Müqayisə',
    description: 'Məhsulları qatarlaş müqayisə et',
    category: 'Features',
    default: true,
  },
  FAVORITES: {
    id: 'FAVORITES',
    name: 'Sevimlilər',
    description: 'İstifadəçilər sevimlilər siyahısı saxlaya bilir',
    category: 'Features',
    default: true,
  },
  DIRECT_MESSAGING: {
    id: 'DIRECT_MESSAGING',
    name: 'Birbaşa Mesajlaşma',
    description: 'Alıcı-satıcı mesajlaşması',
    category: 'Features',
    default: true,
  },
  WALLET_SYSTEM: {
    id: 'WALLET_SYSTEM',
    name: 'Pul Kisəsi Sistemi',
    description: 'Balans və gəlir sisteml',
    category: 'Features',
    default: true,
  },
  LEADERBOARD: {
    id: 'LEADERBOARD',
    name: 'Liderlik Cədvəli',
    description: 'Top satıcılar və kənd təsərrüfatçılar',
    category: 'Community',
    default: false,
  },
  STORE_RATINGS: {
    id: 'STORE_RATINGS',
    name: 'Mağaza Reytinqləri',
    description: 'Mağaza reytinq sistemi',
    category: 'Community',
    default: true,
  },
  CAMPAIGNS: {
    id: 'campaigns',
    name: 'Kampaniyalar',
    description: 'Reklam kampaniyaları',
    category: 'Marketing',
    default: true,
  },
  AD_SLOTS: {
    id: 'ad_slots',
    name: 'Reklam Yerleri',
    description: 'Banner reklam yerləri',
    category: 'Marketing',
    default: false,
  },
};

export default function ModuleToggleSystem() {
  const { showToast } = useToast();
  const [modules, setModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Homepage');
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch current modules state
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const data = await apiFetch('/api/admin/user-modules');
        const moduleState = {};
        data.forEach(m => {
          moduleState[m.module] = m.enabled;
        });
        setModules(moduleState);
      } catch (error) {
        console.error('Error fetching modules:', error);
        // Set defaults
        Object.keys(MODULES).forEach(key => {
          modules[MODULES[key].id] = MODULES[key].default;
        });
      }
      setLoading(false);
    };

    const checkAuth = async () => {
      try {
        const userData = await apiFetch('/api/users/me');
        setUser(userData);
        if (userData.role !== 'SUPER_ADMIN') {
          showToast('Sadəcə SuperAdmin bu səhifəyə daxil ola bilər', 'error');
        }
      } catch {
        showToast('Auth xətası', 'error');
      }
    };

    checkAuth();
    fetchModules();
  }, []);

  // Toggle module
  const toggleModule = (moduleId) => {
    setModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Save changes
  const saveChanges = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/user-modules', {
        method: 'POST',
        body: JSON.stringify({
          modules: Object.entries(modules).map(([id, enabled]) => ({
            module: id,
            enabled,
          })),
        }),
      });
      showToast('Modullar saxlanıldı', 'success');
    } catch (error) {
      showToast('Saxlama xətası: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    if (!confirm('Bütün modulları standart ayarlara qaytarmaq istəyirsiniz?')) return;
    
    const defaults = {};
    Object.values(MODULES).forEach(mod => {
      defaults[mod.id] = mod.default;
    });
    setModules(defaults);
    await saveChanges();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">❌ Qadağan edildi</p>
          <p className="text-gray-600 text-sm mt-2">Sadəcə SuperAdmin bu sahəyə daxil ola bilər</p>
        </div>
      </div>
    );
  }

  const categories = [...new Set(Object.values(MODULES).map(m => m.category))];
  const filteredModules = Object.values(MODULES).filter(m => m.category === selectedCategory);
  const enabledCount = Object.values(modules).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Modul Yönetimi</h1>
          <p className="text-gray-600">FermerMarket frontend xüsusiyyətlərini fəal/söndür</p>
          <p className="text-sm text-gray-500 mt-2">
            ✅ {enabledCount} / {Object.keys(MODULES).length} modul aktivdir
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-medium text-gray-700 transition-colors"
              >
                <RefreshCw size={18} />
                Standarta Sıfırla
              </button>
            </div>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saxlanılır...' : 'Saxla'}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map(module => (
            <div
              key={module.id}
              className={`${
                modules[module.id] ? 'bg-white border-brand-200' : 'bg-gray-50 border-gray-200'
              } border rounded-lg p-6 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleModule(module.id)}
                className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-all ${
                  modules[module.id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ToggleLeft size={18} />
                  {modules[module.id] ? '✅ Fəal' : '❌ Söndü'}
                </div>
              </button>

              {/* Quick Actions */}
              <div className="mt-3 flex gap-2">
                <button className="flex-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                  ⚙️ Ayarlar
                </button>
                <button className="flex-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  📊 Statistika
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Module Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h4 className="font-semibold text-blue-900 mb-3">ℹ️ Modul Sistemi Haqqında</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ SuperAdmin bütün modulları idarə edə bilər</li>
            <li>✓ Admin modulları göstərə biləcəyi sistem, superadmin tərəfindən soydülür</li>
            <li>✓ Dəyişikliklər real-time olur (səhifə yeniləməsi lazım deyil)</li>
            <li>✓ Her modul bağımsız ayarlanıb saxlanılır</li>
            <li>✓ Təkrar modula qayıtmaq mümkündür</li>
          </ul>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-brand-600">{enabledCount}</p>
            <p className="text-sm text-gray-600">Fəal Modullar</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-gray-400">{Object.keys(MODULES).length - enabledCount}</p>
            <p className="text-sm text-gray-600">Söndürülmüş</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-blue-600">{Math.round((enabledCount / Object.keys(MODULES).length) * 100)}%</p>
            <p className="text-sm text-gray-600">Aktivlik Səviyyəsi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
