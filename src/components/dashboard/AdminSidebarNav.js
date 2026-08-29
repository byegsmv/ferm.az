"use client";
import React, { useState, useEffect } from 'react';
import { Link, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';

function NavItem({ item, pathname, depth = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // If it doesn't have a valid slug, we shouldn't render it as a link
  if (!item.slug && (!item.children || item.children.length === 0)) return null;
  
  const hasChildren = item.children && item.children.length > 0;
  
  const basePath = item.slug ? item.slug.split('?')[0] : '';
  const isTab = item.slug && item.slug.includes('?tab=');
    const tabName = isTab ? item.slug.split('?tab=')[1] : null;
    const currentTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    
    const isActive = isTab 
      ? (currentTab === tabName && pathname === '/admin')
      : item.slug === '/admin'
        ? (pathname === basePath && (!currentTab || currentTab === 'stats' || currentTab === 'activity'))
        : basePath && pathname.startsWith(basePath);

  const toggleOpen = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const paddingLeft = `${(depth * 1) + 0.75}rem`;

  return (
    <div className="flex flex-col space-y-0.5">
      <Link
        href={item.slug || "#"}
        onClick={hasChildren && !item.slug ? toggleOpen : undefined}
        className={`flex items-center gap-3 py-2.5 pr-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive && !hasChildren
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        style={{ paddingLeft }}
      >
        {item.icon && (
          <Icon
            name={item.icon}
            size={18}
            className={`shrink-0 ${isActive && !hasChildren ? 'text-brand-600' : 'text-gray-400'}`}
            strokeWidth={isActive && !hasChildren ? 2 : 1.8}
          />
        )}
        {!item.icon && depth > 0 && (
          <div className="w-[18px] flex justify-center shrink-0">
             <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          </div>
        )}
        <span className="flex-1 text-[13px] font-semibold text-gray-800 leading-snug">{item.name || item.label}</span>
        {item.badge && (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-brand-600 text-white tracking-wide shrink-0">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors text-[10px] font-bold ${
              isOpen ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={11} />
            <span>{item.children.length}</span>
          </button>
        )}
      </Link>
      
      {hasChildren && isOpen && (
        <div className="flex flex-col space-y-0.5 mt-0.5">
          {item.children.map(child => (
             child.status === 'ACTIVE' && <NavItem key={child.id || child.slug || child.href} item={child} pathname={pathname} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [modules, setModules] = useState([
    { slug: "/admin", icon: "dashboard", label: "Dashboard", exact: true, status: 'ACTIVE' },
    { slug: "/admin/builder", icon: "sparkles", label: "Visual System Builder", badge: "PRO", status: 'ACTIVE' },
    { slug: "/admin/products", icon: "package", label: "Məhsullar", status: 'ACTIVE' },
    { slug: "/admin/orders", icon: "cart", label: "Sifarişlər", status: 'ACTIVE' },
    { slug: "/admin/users", icon: "users", label: "İstifadəçilər", status: 'ACTIVE' },
    { slug: "/admin/settings", icon: "settings", label: "Tənzimləmələr", status: 'ACTIVE' },
  ]);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/modules'),
      apiFetch('/api/categories?all=true')
    ])
      .then(([modRes, catRes]) => {
        if (modRes && modRes.modules) {
          // Filter top-level and children recursively by status
          const filterActive = (mods) => mods
            .filter(m => m.status !== 'INACTIVE' && m.status !== 'HIDDEN')
            .map(m => ({ ...m, children: m.children ? filterActive(m.children) : [] }));

          const activeTree = filterActive(modRes.modules);
          
          if (catRes && catRes.categories) {
            // Find Kateqoriyalar module
            const buildCategoryTree = (moduleTree) => {
              for (let m of moduleTree) {
                if (m.slug === '/admin/categories' || m.name === 'Kateqoriyalar' || m.id === 'mod-categories') {
                  const dbCats = catRes.categories.filter(c => !c.parentId && c.isActive).map(c => {
                    const children = catRes.categories.filter(sub => sub.parentId === c.id && sub.isActive).map(sub => ({
                      id: sub.id,
                      name: sub.nameAz || sub.name,
                      slug: `/admin/categories?edit=${sub.id}`,
                      status: 'ACTIVE',
                      icon: sub.icon || 'cornerDownRight',
                      children: []
                    }));
                    return {
                      id: c.id,
                      name: c.nameAz || c.name,
                      slug: `/admin/categories?edit=${c.id}`,
                      status: 'ACTIVE',
                      icon: c.icon || 'folder',
                      children
                    };
                  });
                  m.children = [...(m.children || []), ...dbCats];
                }
                if (m.children && m.children.length > 0) {
                  buildCategoryTree(m.children);
                }
              }
            };
            buildCategoryTree(activeTree);
          }
          
          if (activeTree.length > 0) {
            setModules(activeTree);
          }
        }
      })
      .catch(console.error);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredModules = modules.filter(m => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesSelf = m.name?.toLowerCase().includes(term) || m.label?.toLowerCase().includes(term) || m.slug?.toLowerCase().includes(term);
    const matchesChild = m.children?.some(c => c.name?.toLowerCase().includes(term) || c.slug?.toLowerCase().includes(term));
    return matchesSelf || matchesChild;
  });

  return (
    <aside className="hidden md:flex w-72 h-screen sticky top-0 bg-white border-r border-[var(--border)] flex-col shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Icon name="shield" size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900 tracking-tight leading-none">Admin Panel</p>
          <p className="text-[11px] text-gray-400 mt-0.5">İdarəetmə Mərkəzi</p>
        </div>
      </div>

      {/* Sürətli Axtarış (Quick Command Search) */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus-within:border-brand-500 focus-within:bg-white transition-all shadow-2xs">
          <Icon name="search" size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Bölmə və ya modul axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-800 outline-none font-medium placeholder-gray-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav data-lenis-prevent="true" className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 min-h-0 scrollbar-thin">
        {filteredModules.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Heç bir modul tapılmadı
          </div>
        ) : (
          filteredModules.map((mod) => (
            <NavItem key={mod.id || mod.slug || mod.href} item={mod} pathname={pathname} depth={0} />
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500">Sistem aktivdir</span>
        </div>
      </div>
    </aside>
  );
}
