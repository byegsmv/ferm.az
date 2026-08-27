const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AdminPanel.js', 'utf8');

code = code.replace(/import \{ useSearchParams \} from 'next\/navigation';[\r\n]+"use client";/, '"use client";\nimport { useSearchParams } from \'next/navigation\';');

fs.writeFileSync('src/components/dashboard/AdminPanel.js', code);
console.log('Fixed use client order');
