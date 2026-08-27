const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AdminPanel.js', 'utf8');

// Import useSearchParams
if (!code.includes('useSearchParams')) {
  code = code.replace('import { usePathname', 'import { usePathname, useSearchParams');
  if (!code.includes('useSearchParams')) {
     code = code.replace("from 'next/navigation';", "from 'next/navigation';");
     // Let's just do a regex replace for the imports.
     code = code.replace(/import \{.*\} from ['"]next\/navigation['"];/g, "import { usePathname, useRouter, useSearchParams } from 'next/navigation';");
     if (!code.includes('useSearchParams')) {
         code = "import { useSearchParams } from 'next/navigation';\n" + code;
     }
  }
}

// Replace local state with searchParams
// const [tab, setTab] = useState("stats"); -> 
// const searchParams = useSearchParams();
// const tab = searchParams.get('tab') || 'stats';
// const setTab = (t) => { window.history.pushState(null, '', `?tab=${t}`); };
code = code.replace(/const \[tab, setTab\] = useState\("stats"\);/g, 
`const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'stats';
  const setTab = (t) => { window.history.pushState(null, '', \`?tab=\${t}\`); };`);

// Remove AdminSidebar and AdminMobileNav from render
// <AdminSidebar tab={tab} setTab={setTab} badges={badges} collapsed={collapsed} setCollapsed={setCollapsed} t={t} />
// <AdminMobileNav tab={tab} setTab={setTab} />
code = code.replace(/<AdminSidebar[^>]*\/>/g, '{/* AdminSidebar Removed */}');
code = code.replace(/<AdminMobileNav[^>]*\/>/g, '{/* AdminMobileNav Removed */}');

fs.writeFileSync('src/components/dashboard/AdminPanel.js', code);
console.log('Successfully patched AdminPanel.js');
