const fs = require('fs');
const path = require('path');
// Note: In a real environment, we would use 'js-yaml' to parse. 
// For this bootstrap, we will assume this script parses permissions.yaml
// and generates:
// 1. src/permissions/Permission.ts (Enum)
// 2. ../../database/seeds/system/01_permissions.sql
// 3. ../api-client/openapi-scopes.json (or similar)

console.log("Generating Permission outputs from permissions.yaml...");

const yamlContent = fs.readFileSync(path.join(__dirname, '../src/permissions.yaml'), 'utf8');

// Basic regex to extract permission IDs
const regex = /id:\s*"([^"]+)"/g;
let match;
const permissions = [];
while ((match = regex.exec(yamlContent)) !== null) {
  permissions.push(match[1]);
}

// 1. Generate TS Enum
const enumLines = permissions.map(p => {
  const enumKey = p.replace('.', '_').toUpperCase();
  return `  ${enumKey} = '${p}',`;
});

const tsContent = `// AUTO-GENERATED FILE. DO NOT EDIT.
// Generated from permissions.yaml

export enum Permission {
${enumLines.join('\n')}
}
`;

fs.mkdirSync(path.join(__dirname, '../src/auth'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../src/auth/Permission.ts'), tsContent);
console.log("✅ Generated src/auth/Permission.ts");

// 2. Generate SQL Seed
const sqlLines = permissions.map(p => {
  return `INSERT INTO erp.permissions (id, name) VALUES ('${p}', '${p}') ON CONFLICT DO NOTHING;`;
});

const sqlContent = `-- AUTO-GENERATED FILE. DO NOT EDIT.
-- Generated from permissions.yaml

${sqlLines.join('\n')}
`;

const dbSeedDir = path.join(__dirname, '../../../database/seeds/system');
fs.mkdirSync(dbSeedDir, { recursive: true });
fs.writeFileSync(path.join(__dirname, '../../../database/seeds/system/01_permissions.sql'), sqlContent);
console.log("✅ Generated database/seeds/system/01_permissions.sql");

console.log("🎉 All permission files generated successfully!");
