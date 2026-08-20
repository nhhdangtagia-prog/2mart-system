const fs = require('fs');
let code = fs.readFileSync('src/pages/PayrollPage.tsx', 'utf8');

const search = `                    <td className="p-4 text-right font-black text-blue-700 font-mono text-base">
                      {formatCurrency(item.netSalary)}
                    </td>`;

const replacement = `                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.advanceAmount || 0}
                        onChange={(e) => updateEditorItem(item.employeeCode, "advanceAmount", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right font-semibold border border-orange-200 text-orange-700 rounded-lg p-1.5 text-sm focus:outline-none focus:border-orange-500 bg-orange-50/50"
                      />
                    </td>
                    <td className="p-4 text-right font-black text-blue-700 font-mono text-base">
                      {formatCurrency(item.netSalary)}
                    </td>`;

if (code.includes(search)) {
  code = code.replace(search, replacement);
  fs.writeFileSync('src/pages/PayrollPage.tsx', code);
  console.log('Replaced successfully');
} else {
  console.log('Search string not found');
}
