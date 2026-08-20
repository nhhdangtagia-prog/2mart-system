import os
import re

base_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src'

files = [
    r'pages\PosPage.tsx',
    r'pages\InventoryPage.tsx', 
    r'pages\PurchaseImportPage.tsx',
    r'pages\PayrollPage.tsx',
    r'utils\branchStock.ts',
]

for rel_path in files:
    full_path = os.path.join(base_path, rel_path)
    if not os.path.exists(full_path):
        print(f"NOT FOUND: {full_path}")
        continue

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix label mappings - CS1 = 379b, CS2 = 285
    # Pattern: CS1: 285... -> CS2: 285...
    content = content.replace('CS1: 285 Nguyễn Lương Bằng', 'CS2: 285 Nguyễn Lương Bằng')
    content = content.replace('CS2: 379b Tôn Đức Thắng', 'CS1: 379b Tôn Đức Thắng')

    # Fix logic: isCS2 should match "285 Nguyễn Lương Bằng" (not "379b")
    # In branchStock.ts: isCS2 = branch === "379b..." -> should be "285..."
    # branchStock.ts line 53: const isCS2 = branchName === "379b Tôn Đức Thắng";
    content = content.replace(
        'const isCS2 = branchName === "379b Tôn Đức Thắng";',
        'const isCS2 = branchName === "285 Nguyễn Lương Bằng";'
    )
    # Also fix the cs1/cs2 stock mapping in branchStock.ts
    # Line 38: if (bs.branch === "285...") cs1 = bs.stock -> cs2 = bs.stock
    # Line 39: if (bs.branch === "379b...") cs2 = bs.stock -> cs1 = bs.stock
    content = content.replace(
        'if (bs.branch === "285 Nguyễn Lương Bằng") cs1 = bs.stock;',
        'if (bs.branch === "285 Nguyễn Lương Bằng") cs2 = bs.stock;'
    )
    content = content.replace(
        'if (bs.branch === "379b Tôn Đức Thắng") cs2 = bs.stock;',
        'if (bs.branch === "379b Tôn Đức Thắng") cs1 = bs.stock;'
    )

    # Fix in InventoryPage: value="285..." -> CS1 to CS2
    content = content.replace(
        '>CS1: 285 Nguyễn Lương Bằng<',
        '>CS2: 285 Nguyễn Lương Bằng<'
    )
    content = content.replace(
        '>CS2: 379b Tôn Đức Thắng<',
        '>CS1: 379b Tôn Đức Thắng<'
    )

    # Fix PayrollPage logic: b.includes("285") ? "CS1" -> "CS2"
    content = content.replace(
        'b.includes("285") ? "CS1" : "CS2"',
        'b.includes("285") ? "CS2" : "CS1"'
    )
    content = content.replace(
        'sheet.branch.includes("285") ? "CS1" : "CS2"',
        'sheet.branch.includes("285") ? "CS2" : "CS1"'
    )

    # Fix PurchaseImportPage: order.branch.includes("285") ? "CS1" : "CS2"
    content = content.replace(
        'order.branch.includes("285") ? "CS1" : "CS2"',
        'order.branch.includes("285") ? "CS2" : "CS1"'
    )

    # Fix PosPage: isCS2 ? "CS2: 379b..." : "CS1: 285..."
    content = content.replace(
        '{isCS2 ? "CS2: 379b Tôn Đức Thắng" : "CS1: 285 Nguyễn Lương Bằng"}',
        '{isCS2 ? "CS2: 285 Nguyễn Lương Bằng" : "CS1: 379b Tôn Đức Thắng"}'
    )

    # Fix InventoryPage: "285..." ? "CS2: 379b" swapped text
    content = content.replace(
        'transferFromBranch === "285 Nguyễn Lương Bằng" ? "CS2: 379b',
        'transferFromBranch === "285 Nguyễn Lương Bằng" ? "CS1: 379b'
    )

    if content != original:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {rel_path}")
    else:
        print(f"No change: {rel_path}")

# Also fix useCurrentBranch hook
hook_path = os.path.join(base_path, 'hooks', 'useCurrentBranch.tsx')
if not os.path.exists(hook_path):
    hook_path = os.path.join(base_path, 'hooks', 'useCurrentBranch.ts')
if os.path.exists(hook_path):
    with open(hook_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    # isCS2 should be true when branch is "285..."
    content = content.replace(
        'isCS2: currentBranch === "379b Tôn Đức Thắng"',
        'isCS2: currentBranch === "285 Nguyễn Lương Bằng"'
    )
    content = content.replace(
        "isCS2: currentBranch === \"379b Tôn Đức Thắng\"",
        "isCS2: currentBranch === \"285 Nguyễn Lương Bằng\""
    )
    if content != original:
        with open(hook_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: hooks/useCurrentBranch")
    else:
        print(f"No change: hooks/useCurrentBranch")

print("Done!")
