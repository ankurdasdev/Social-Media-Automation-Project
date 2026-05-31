const fs = require('fs');
const path = 'client/components/contacts/columns.tsx';
let content = fs.readFileSync(path, 'utf8');

const groups = [
  { id: 'group-contact-details', title: 'Contact Details', color: '#1e293b', startMarker: '// ── 1. Contact Details' },
  { id: 'group-automation-run', title: 'Automation Run', color: '#f59e0b', startMarker: '// ── 2. Automation Run' },
  { id: 'group-whatsapp-protocol', title: 'WhatsApp Protocol', color: '#10b981', startMarker: '// ── 3. WhatsApp' },
  { id: 'group-gmail-protocol', title: 'Gmail Protocol', color: '#3b82f6', startMarker: '// ── 4. Gmail' },
  { id: 'group-instagram-protocol', title: 'Instagram Protocol', color: '#ec4899', startMarker: '// ── 5. Instagram' },
  { id: 'group-tracking', title: 'Tracking', color: '#6366f1', startMarker: '// ── 6. Tracking' }
];

const splitIndex = content.indexOf('// ── 1. Contact Details');
let before = content.substring(0, splitIndex);
let rest = content.substring(splitIndex);
let newRest = "";

for (let i = 0; i < groups.length; i++) {
  const g = groups[i];
  const startIdx = rest.indexOf(g.startMarker);
  let endIdx = -1;
  if (i < groups.length - 1) {
    endIdx = rest.indexOf(groups[i+1].startMarker);
  } else {
    endIdx = rest.lastIndexOf('];');
  }
  
  const chunk = rest.substring(startIdx, endIdx);
  const formattedChunk = chunk.split('\n').map(line => '    ' + line).join('\n');
  
  newRest += `  {\n    id: "${g.id}",\n    header: () => <GroupHeader id="${g.id}" defaultTitle="${g.title}" defaultColor="${g.color}" />,\n    columns: [\n${formattedChunk}\n    ]\n  },\n`;
}

fs.writeFileSync(path, before + newRest + '];\n');
console.log("Refactored successfully.");
