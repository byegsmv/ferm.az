const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AdminSidebarNav.js', 'utf8');

if (!code.includes('useSearchParams')) {
  code = code.replace('import { Link, usePathname } from "@/i18n/routing";', 'import { Link, usePathname } from "@/i18n/routing";\nimport { useSearchParams } from "next/navigation";');
  
  code = code.replace('const pathname = usePathname();', 'const pathname = usePathname();\n  const searchParams = useSearchParams();');
  
  // Update isActive logic
  code = code.replace('const isActive = pathname === item.slug || (item.slug !== \'/admin\' && pathname.startsWith(item.slug));', 
  `const isTab = item.slug.includes('?tab=');
    const tabName = isTab ? item.slug.split('?tab=')[1] : null;
    const currentTab = searchParams?.get('tab');
    const isActive = isTab 
      ? (currentTab === tabName && pathname === '/admin') 
      : (pathname === item.slug || (item.slug !== '/admin' && pathname.startsWith(item.slug))) && (!currentTab || currentTab === 'stats' || item.slug !== '/admin');`);
      
  fs.writeFileSync('src/components/dashboard/AdminSidebarNav.js', code);
  console.log('Patched AdminSidebarNav.js');
}
