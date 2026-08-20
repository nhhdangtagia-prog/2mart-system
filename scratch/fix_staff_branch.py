import os

# 1. Update SchedulePage.tsx
path_schedule = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\SchedulePage.tsx'
with open(path_schedule, 'r', encoding='utf-8') as f:
    c_sched = f.read()

# Remove the branch filter for staff
c_sched = c_sched.replace(
    'const myAssignments = assignments.filter(a => a.employeeCode === session?.code && matchesSelectedBranch(a.employeeDept, currentBranch));',
    'const myAssignments = assignments.filter(a => a.employeeCode === session?.code);'
)

# Update the badge text to show which branch the shift is for
c_sched = c_sched.replace(
    '<span className="truncate">Có ca làm việc</span>',
    '<span className="truncate">{assign.employeeDept === "379b Tôn Đức Thắng" ? "CS2" : "CS1"}</span>'
)

# Update the registration message
c_sched = c_sched.replace(
    'Chỉ hiển thị ca làm việc của <strong>{session?.name}</strong> tại chi nhánh đang chọn ở trên — đổi chi nhánh ở góc trên để xem/đăng ký ca ở cơ sở khác.',
    'Hiển thị toàn bộ ca làm việc của <strong>{session?.name}</strong> tại cả 2 cơ sở. Khi bạn đăng ký ca trống, ca đó sẽ được ghi nhận cho cơ sở đang chọn ở góc trên.'
)

with open(path_schedule, 'w', encoding='utf-8') as f:
    f.write(c_sched)


# 2. Update TimesheetPage.tsx
path_timesheet = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\TimesheetPage.tsx'
with open(path_timesheet, 'r', encoding='utf-8') as f:
    c_time = f.read()

# Change the filter to bypass branch check in self mode
old_filter = """      // Ca này có thực sự thuộc chi nhánh đang xem không (theo employeeDept thực tế của ca) —
      // áp dụng cho cả chế độ tự chấm công: chọn CS1 chỉ thấy ca CS1, chọn CS2 chỉ thấy ca CS2.
      if (!matchesCurrentBranch(a.employeeDept)) return false;
      // If in self mode, only show current user's shifts!
      if (viewMode === "self" && a.employeeCode !== selectedSelfEmpCode) return false;"""

new_filter = """      // If in self mode, show current user's shifts across ALL branches
      if (viewMode === "self") {
        if (a.employeeCode !== selectedSelfEmpCode) return false;
        // Do not filter by branch in self mode!
      } else {
        // Manager mode: filter by selected branch
        if (!matchesCurrentBranch(a.employeeDept)) return false;
      }"""

c_time = c_time.replace(old_filter, new_filter)

# Update the badge text in TimesheetPage to show branch
old_badge_time = """                                  <span className="truncate">{shiftName}</span>"""
new_badge_time = """                                  <span className="truncate">{shiftName} {viewMode === "self" ? (assign.employeeDept === "379b Tôn Đức Thắng" ? "(CS2)" : "(CS1)") : ""}</span>"""
c_time = c_time.replace(old_badge_time, new_badge_time)

with open(path_timesheet, 'w', encoding='utf-8') as f:
    f.write(c_time)

print("Updated SchedulePage.tsx and TimesheetPage.tsx")
