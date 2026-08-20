const fs = require('fs');
['apps/admin/package.json', 'apps/pos/package.json'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/"dev":\s*"vite"/, '"dev": "vite --host"');
  fs.writeFileSync(file, code);
});
console.log('Fixed dev script');
