const fs = require('fs');
let code = fs.readFileSync('src/lib/dynamic-engine/moduleRegistry.js', 'utf8');

const newModule = `
  {
    id: 'mod-extra',
    name: 'Əlavə Modullar',
    icon: 'Layers',
    slug: '/admin?tab=emails',
    description: 'E-poçt, Analitika və digər xüsusi alətlər',
    status: 'ACTIVE',
    visibility: 'ADMIN',
    permission: 'MANAGE_SETTINGS',
    isSystem: true,
    children: [
      { id: 'sub-emails', name: 'E-poçt İdarəsi', icon: 'Mail', slug: '/admin?tab=emails', status: 'ACTIVE' },
      { id: 'sub-site-texts', name: 'Məzmun İdarəsi', icon: 'FileText', slug: '/admin?tab=site-texts', status: 'ACTIVE' },
      { id: 'sub-slider', name: 'Slayderlər', icon: 'Image', slug: '/admin?tab=slider', status: 'ACTIVE' },
      { id: 'sub-notify', name: 'Bildirişlər', icon: 'Bell', slug: '/admin?tab=notify', status: 'ACTIVE' },
      { id: 'sub-adslots', name: 'Reklam Yerləri', icon: 'MonitorPlay', slug: '/admin?tab=adslots', status: 'ACTIVE' },
      { id: 'sub-analytics', name: 'Analitika', icon: 'LineChart', slug: '/admin?tab=analytics', status: 'ACTIVE' }
    ]
  }
];`;

code = code.replace('  }\n];', '  },' + newModule);

fs.writeFileSync('src/lib/dynamic-engine/moduleRegistry.js', code);
console.log('Updated moduleRegistry.js');
