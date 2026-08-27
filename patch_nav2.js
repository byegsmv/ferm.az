const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AdminSidebarNav.js', 'utf8');

code = code.replace(/const isActive = item\.slug === '\/admin'[\s\S]*?: basePath && pathname\.startsWith\(basePath\);/, 
  `const isTab = item.slug && item.slug.includes('?tab=');
    const tabName = isTab ? item.slug.split('?tab=')[1] : null;
    const currentTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    
    const isActive = isTab 
      ? (currentTab === tabName && pathname === '/admin')
      : item.slug === '/admin'
        ? (pathname === basePath && (!currentTab || currentTab === 'stats' || currentTab === 'activity'))
        : basePath && pathname.startsWith(basePath);`);
        
fs.writeFileSync('src/components/dashboard/AdminSidebarNav.js', code);
console.log('Fixed isActive logic in AdminSidebarNav.js');
