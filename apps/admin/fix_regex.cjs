const fs = require('fs');
let code = fs.readFileSync('src/pages/PayrollPage.tsx', 'utf8');

const regex = /<td className="p-3 text-right">\s*<input[^>]*value=\{item\.deductions\}[^>]*\/>\s*<\/td>\s*<td className="p-4 text-right font-black text-blue-700 font-mono text-base">/g;

const match = code.match(regex);
if (match) {
  const replacement = match[0].replace(/<td className="p-4 text-right font-black text-blue-700 font-mono text-base">/, `<td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.advanceAmount || 0}
                        onChange={(e) => updateEditorItem(item.employeeCode, "advanceAmount", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right font-semibold border border-orange-200 text-orange-700 rounded-lg p-1.5 text-sm focus:outline-none focus:border-orange-500 bg-orange-50/50"
                      />
                    </td>
                    <td className="p-4 text-right font-black text-blue-700 font-mono text-base">`);
  
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/pages/PayrollPage.tsx', code);
  console.log('Replaced successfully');
} else {
  console.log('Regex not matched');
}
