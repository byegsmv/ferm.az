const fs = require('fs'); 
const iconFile = fs.readFileSync('src/components/ui/Icon.js', 'utf8'); 
const required = ['LayoutDashboard', 'Wand2', 'Package', 'List', 'FolderTree', 'Tag', 'FlaskConical', 'Sprout', 'ShieldAlert', 'Bug', 'ShoppingCart', 'Receipt', 'Percent', 'Megaphone', 'Sparkles', 'Image', 'Users', 'UserCheck', 'Shield', 'GitBranch', 'Activity', 'Settings', 'Sliders', 'Globe', 'ToggleLeft']; 
const missing = required.filter(i => !iconFile.includes(i + ':') && !iconFile.includes("'" + i + "':") && !iconFile.includes('"' + i + '":')); 
console.log('Missing:', missing);
