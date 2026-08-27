const fs = require('fs');

// Fix Widget
let code = fs.readFileSync('src/components/dashboard/AdminCopilotWidget.js', 'utf8');
code = code.replace(/content: copy\[msgIndex\]\.content \+ \(execRes\.ok \? "\\n\\n\? \?m\?liyyat ugurla v\? avtomatik icra edildi!" : \\n\\n\? Icra x\?tas\?: \)/g, 'content: copy[msgIndex].content + (execRes.ok ? "\\n\\n✅ Əməliyyat uğurla və avtomatik icra edildi!" : "\\n\\n❌ İcra xətası: ")');
code = code.replace(/content: \? Icra x\?tas\?:  \}\]/g, 'content: "❌ İcra xətası" }]');
fs.writeFileSync('src/components/dashboard/AdminCopilotWidget.js', code);

console.log("Widget fixed");
