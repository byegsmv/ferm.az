const fs = require('fs');
let content = fs.readFileSync('src/components/ui/Icon.js', 'utf8');

const newImports = ['Wand2', 'List', 'FolderTree', 'ShieldAlert', 'Receipt', 'GitBranch', 'ToggleLeft'];
for (const imp of newImports) {
  if (!content.includes(imp)) {
    content = content.replace('} from "lucide-react";', `  ${imp},\n} from "lucide-react";`);
  }
}

const required = ['LayoutDashboard', 'Wand2', 'Package', 'List', 'FolderTree', 'Tag', 'FlaskConical', 'Sprout', 'ShieldAlert', 'Bug', 'ShoppingCart', 'Receipt', 'Percent', 'Megaphone', 'Sparkles', 'Image', 'Users', 'UserCheck', 'Shield', 'GitBranch', 'Activity', 'Settings', 'Sliders', 'Globe', 'ToggleLeft'];

let aliases = '\n  // Added for admin modules\n';
for (const req of required) {
  aliases += `  ${req}: ${req},\n`;
}

content = content.replace('export const ICONS = {', `export const ICONS = {${aliases}`);
fs.writeFileSync('src/components/ui/Icon.js', content);
console.log('Updated Icon.js');
