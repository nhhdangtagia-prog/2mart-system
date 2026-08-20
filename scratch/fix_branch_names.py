import os
import glob

# Search in apps/admin/src
search_dir = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src'
files_to_check = glob.glob(os.path.join(search_dir, '**', '*.ts'), recursive=True) + \
                 glob.glob(os.path.join(search_dir, '**', '*.tsx'), recursive=True)

for file_path in files_to_check:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # Header.tsx & PosPage.tsx & PurchaseImportPage.tsx
    new_content = new_content.replace('CS1: 285 Nguyễn Lương Bằng', 'CS2: 285 Nguyễn Lương Bằng')
    new_content = new_content.replace('CS2: 379b Tôn Đức Thắng', 'CS1: 379b Tôn Đức Thắng')
    
    # useCurrentBranch.ts
    new_content = new_content.replace('isCS1: currentBranch === "285 Nguyễn Lương Bằng"', 'isCS1: currentBranch === "379b Tôn Đức Thắng"')
    new_content = new_content.replace('isCS2: currentBranch === "379b Tôn Đức Thắng"', 'isCS2: currentBranch === "285 Nguyễn Lương Bằng"')
    
    # branchStock.ts
    new_content = new_content.replace('const isCS2 = branchName === "379b Tôn Đức Thắng";', 'const isCS2 = branchName === "285 Nguyễn Lương Bằng";')
    new_content = new_content.replace('const isCS2 = branch === "379b Tôn Đức Thắng";', 'const isCS2 = branch === "285 Nguyễn Lương Bằng";')
    new_content = new_content.replace('const isCS2 = order.branch === "379b Tôn Đức Thắng";', 'const isCS2 = order.branch === "285 Nguyễn Lương Bằng";')
    new_content = new_content.replace('const isOldCS2 = oldOrder.branch === "379b Tôn Đức Thắng";', 'const isOldCS2 = oldOrder.branch === "285 Nguyễn Lương Bằng";')
    new_content = new_content.replace('const isFromCS2 = fromBranch === "379b Tôn Đức Thắng";', 'const isFromCS2 = fromBranch === "285 Nguyễn Lương Bằng";')
    
    # PosPage.tsx specific manual fix
    new_content = new_content.replace('{isCS2 ? "CS2: 379b Tôn Đức Thắng" : "CS1: 285 Nguyễn Lương Bằng"}', '{isCS2 ? "CS2: 285 Nguyễn Lương Bằng" : "CS1: 379b Tôn Đức Thắng"}')
    new_content = new_content.replace('{isCS2 ? "CS2" : "CS1"}', 'XXX_TEMP_XXX')
    new_content = new_content.replace('XXX_TEMP_XXX', '{isCS2 ? "CS2" : "CS1"}') # Actually no need to change this logic because isCS2 is now updated via hook

    # PurchaseImportPage.tsx specific manual fix
    new_content = new_content.replace('order.branch.includes("285") ? "CS1" : "CS2"', 'order.branch.includes("285") ? "CS2" : "CS1"')

    # Fix initial BRANCHES array order if needed (optional, but good for UI consistency)
    if 'export const BRANCHES = [' in new_content and '285 Nguyễn Lương Bằng' in new_content:
        # Let's just make sure "379b Tôn Đức Thắng" is first.
        new_content = new_content.replace(
'''export const BRANCHES = [
  "285 Nguyễn Lương Bằng",
  "379b Tôn Đức Thắng"
] as const;''',
'''export const BRANCHES = [
  "379b Tôn Đức Thắng",
  "285 Nguyễn Lương Bằng"
] as const;'''
        )
        
    new_content = new_content.replace(
'''const POS_BRANCH_OPTIONS: { value: BranchName; label: string }[] = [
  { value: "285 Nguyễn Lương Bằng", label: "CS2: 285 Nguyễn Lương Bằng" },
  { value: "379b Tôn Đức Thắng", label: "CS1: 379b Tôn Đức Thắng" }
];''',
'''const POS_BRANCH_OPTIONS: { value: BranchName; label: string }[] = [
  { value: "379b Tôn Đức Thắng", label: "CS1: 379b Tôn Đức Thắng" },
  { value: "285 Nguyễn Lương Bằng", label: "CS2: 285 Nguyễn Lương Bằng" }
];'''
    )

    new_content = new_content.replace(
'''const BRANCH_OPTIONS: { value: BranchName; shortLabel: string }[] = [
  { value: "285 Nguyễn Lương Bằng", shortLabel: "CS2: 285 Nguyễn Lương Bằng" },
  { value: "379b Tôn Đức Thắng", shortLabel: "CS1: 379b Tôn Đức Thắng" }
];''',
'''const BRANCH_OPTIONS: { value: BranchName; shortLabel: string }[] = [
  { value: "379b Tôn Đức Thắng", shortLabel: "CS1: 379b Tôn Đức Thắng" },
  { value: "285 Nguyễn Lương Bằng", shortLabel: "CS2: 285 Nguyễn Lương Bằng" }
];'''
    )

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

print("Done fixing branch names.")
