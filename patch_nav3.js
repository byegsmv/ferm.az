const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AdminSidebarNav.js', 'utf8');

// Update NavItem props
code = code.replace(/function NavItem\(\{ item, pathname, depth = 0 \}\)/g, 'function NavItem({ item, pathname, depth = 0, currentTab })');

// Update NavItem recursive call
code = code.replace(/<NavItem key=\{child.id \|\| child.slug \|\| child.href\} item=\{child\} pathname=\{pathname\} depth=\{depth \+ 1\} \/>/g, 
  '<NavItem key={child.id || child.slug || child.href} item={child} pathname={pathname} depth={depth + 1} currentTab={currentTab} />');

// Update NavItem top-level call
code = code.replace(/<NavItem key=\{mod.id \|\| mod.slug \|\| mod.href\} item=\{mod\} pathname=\{pathname\} depth=\{0\} \/>/g, 
  '<NavItem key={mod.id || mod.slug || mod.href} item={mod} pathname={pathname} depth={0} currentTab={searchParams?.get("tab")} />');

// Update isActive logic inside NavItem
code = code.replace(/const currentTab = typeof window !== 'undefined' \? new URLSearchParams\(window.location.search\).get\('tab'\) : null;/g, '');

fs.writeFileSync('src/components/dashboard/AdminSidebarNav.js', code);
console.log('Patched NavItem hydration issue.');
