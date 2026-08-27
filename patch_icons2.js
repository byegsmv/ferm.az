const fs = require('fs');
let code = fs.readFileSync('src/components/ui/Icon.js', 'utf8');

const newImports = ['Layers', 'Mail', 'MonitorPlay', 'LineChart'];
for (const imp of newImports) {
  if (!code.includes(imp)) {
    code = code.replace('} from "lucide-react";', `  ${imp},\n} from "lucide-react";`);
  }
}

const required = ['Layers', 'Mail', 'MonitorPlay', 'LineChart'];
let aliases = '';
for (const req of required) {
  if (!code.includes(`  ${req}:`)) {
     aliases += `  ${req}: ${req},\n`;
  }
}

code = code.replace('export const ICONS = {', `export const ICONS = {\n${aliases}`);
fs.writeFileSync('src/components/ui/Icon.js', code);
console.log('Updated Icon.js');
