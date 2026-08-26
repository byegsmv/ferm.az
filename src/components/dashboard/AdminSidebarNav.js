"use client";
import React, { useState, useEffect } from 'react';
import { Link, usePathname } from "@/i18n/routing";
import Icon from '@/components/ui/Icon';
import { apiFetch } from '@/lib/apiClient';

function NavItem({ item, pathname, depth = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // If it doesn't have a valid slug, we shouldn't render it as a link
  if (!item.slug && (!item.children || item.children.length === 0)) return null;
  
  const hasChildren = item.children && item.children.length > 0;
  
  const basePath = item.slug ? item.slug.split('?')[0] : '';
  const isActive = item.slug === '/admin' 
    ? pathname === basePath
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
        <span className="truncate flex-1">{item.name || item.label}</span>
        {item.badge && (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-brand-600 text-white tracking-wide">
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
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={14} className="text-gray-400" />
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
          const activeTree = modRes.modules.filter(m => m.status === 'ACTIVE');
          
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

  return (
    <aside className="hidden md:flex w-64 h-screen sticky top-0 bg-white border-r border-[var(--border)] flex-col shadow-sm overflow-hidden">
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

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 min-h-0 scrollbar-thin">
        {modules.map((mod) => (
          <NavItem key={mod.id || mod.slug || mod.href} item={mod} pathname={pathname} depth={0} />
        ))}
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
