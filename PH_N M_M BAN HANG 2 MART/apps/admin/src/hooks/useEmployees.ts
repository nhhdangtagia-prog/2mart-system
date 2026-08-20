import { useState, useEffect, useCallback } from "react";
import employeesData from "../data/employees.json";
import { hashPassword } from "../utils/passwordHash";

export type AccessLevel = "admin" | "staff";

export interface Employee {
  id: string;
  code: string;
  name: string;
  username: string;
  passwordHash?: string;
  role: string;
  accessLevel: AccessLevel;
  department: string;
  branch: string;
  status: string;
  email: string;
  phone: string;
  joinDate: string;
  /** Tài khoản ngân hàng để chuyển lương — chỉ Admin được sửa, nhân viên chỉ xem */
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

/** Dữ liệu form: cho phép nhập mật khẩu dạng chữ thường, sẽ được băm trước khi lưu. */
export type EmployeeFormInput = Omit<Employee, "passwordHash"> & { password?: string };

// Admin cao nhất giờ là tài khoản riêng (xem useAdminAccount.ts), tách biệt khỏi
// danh sách Nhân viên — nên mọi nhân viên trong danh sách này đều ở cấp "staff".
function defaultAccessLevel(_role: string): AccessLevel {
  return "staff";
}

const STORAGE_KEY = "kiot_rm_employees";

/**
 * Loại bỏ dấu tiếng Việt, viết thường và xóa khoảng trắng/ký tự đặc biệt
 * VD: "Diễm Quỳnh" -> "diemquynh", "Thanh Tâm" -> "thanhtam"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Remove spaces and non-alphanumeric characters
  str = str.replace(/[^a-zA-Z0-9]/g, "");
  return str.toLowerCase();
}

export function useEmployees() {
  const [employees, setEmployeesState] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    const raw = localStorage.getItem(STORAGE_KEY);
    let listToLoad: Employee[] = [];

    if (!raw || JSON.parse(raw).length === 0) {
      // Khởi tạo từ dữ liệu employees.json — mật khẩu mặc định (user + 123) được băm trước khi lưu
      listToLoad = await Promise.all((employeesData as any[]).map(async (e, idx) => {
        const cleanUser = removeVietnameseTones(e.username || e.name || `user${idx}`);
        return {
          id: e.id || `NV${String(idx + 1).padStart(5, '0')}`,
          code: e.code || `NV${String(idx + 1).padStart(5, '0')}`,
          name: e.name || "Nhân viên chưa đặt tên",
          username: cleanUser,
          passwordHash: await hashPassword(e.password || `${cleanUser}123`),
          role: e.role || "Nhân viên bán hàng",
          accessLevel: e.accessLevel || defaultAccessLevel(e.role || "Nhân viên bán hàng"),
          department: e.department || "CS1",
          branch: e.branch || "285 Nguyễn Lương Bằng",
          status: e.status || "Đang làm việc",
          email: e.email ? e.email.replace(/[^a-zA-Z0-9@._-]/g, "") : `${cleanUser}@2mart.vn`,
          phone: e.phone || "0900000000",
          joinDate: e.joinDate || "2026-01-01"
        };
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listToLoad));
    } else {
      try {
        const parsed: any[] = JSON.parse(raw);
        // Đảm bảo username chuẩn hóa không dấu, có mật khẩu đã băm & có accessLevel hợp lệ
        let needsMigration = false;
        listToLoad = await Promise.all(parsed.map(async (e) => {
          const cleanUser = removeVietnameseTones(e.username || e.name || e.code);
          // Admin cao nhất giờ là tài khoản riêng (xem useAdminAccount.ts) — nhân viên
          // trong danh sách này không còn được gán cấp "admin" nữa, luôn quy về "staff".
          const accessLevel: AccessLevel = e.accessLevel === "admin" ? "staff" : (e.accessLevel || defaultAccessLevel(e.role));

          let passwordHash = e.passwordHash;
          if (!passwordHash) {
            // Bản ghi cũ còn lưu mật khẩu dạng chữ thường (field `password`) — băm lại và bỏ field cũ
            passwordHash = await hashPassword(e.password || `${cleanUser}123`);
          }

          if (e.username !== cleanUser || !e.passwordHash || e.password || !e.accessLevel || e.accessLevel === "admin") {
            needsMigration = true;
          }

          const { password: _drop, ...rest } = e;
          return {
            ...rest,
            username: cleanUser,
            passwordHash,
            accessLevel,
            email: e.email ? e.email.replace(/[^a-zA-Z0-9@._-]/g, "") : `${cleanUser}@2mart.vn`
          } as Employee;
        }));

        if (needsMigration) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(listToLoad));
        }
      } catch {
        listToLoad = [];
      }
    }

    setEmployeesState(listToLoad);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees();
    const handleUpdate = () => loadEmployees();
    window.addEventListener("kiot_employees_change", handleUpdate);
    return () => window.removeEventListener("kiot_employees_change", handleUpdate);
  }, [loadEmployees]);

  const saveToStorage = (newList: Employee[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    window.dispatchEvent(new Event("kiot_employees_change"));
  };

  const addEmployee = async (data: Omit<EmployeeFormInput, "id" | "code">) => {
    const current = [...employees];
    const nextNum = current.length + 1;
    const code = `NV${String(nextNum).padStart(5, '0')}`;
    const cleanUser = removeVietnameseTones(data.username || data.name || code);
    const { password, ...rest } = data;

    const newEmp: Employee = {
      ...rest,
      id: code,
      code,
      username: cleanUser,
      passwordHash: await hashPassword(password || `${cleanUser}123`),
      accessLevel: data.accessLevel || defaultAccessLevel(data.role)
    };
    const updated = [newEmp, ...current];
    saveToStorage(updated);
    return newEmp;
  };

  const updateEmployee = async (codeOrId: string, data: Partial<EmployeeFormInput>) => {
    const current = [...employees];
    const idx = current.findIndex(e => e.id === codeOrId || e.code === codeOrId);
    if (idx !== -1) {
      const targetName = data.name !== undefined ? data.name : current[idx].name;
      const rawUser = data.username !== undefined ? data.username : (current[idx].username || targetName);
      const cleanUser = removeVietnameseTones(rawUser);
      const { password, ...rest } = data;

      current[idx] = {
        ...current[idx],
        ...rest,
        username: cleanUser,
        passwordHash: password ? await hashPassword(password) : current[idx].passwordHash
      };
      saveToStorage(current);
      return current[idx];
    }
    return null;
  };

  const deleteEmployee = (codeOrId: string) => {
    const current = employees.filter(e => e.id !== codeOrId && e.code !== codeOrId);
    saveToStorage(current);
  };

  const deleteEmployees = (codesOrIds: string[]) => {
    const setIds = new Set(codesOrIds);
    const current = employees.filter(e => !setIds.has(e.id) && !setIds.has(e.code));
    saveToStorage(current);
  };

  return {
    employees,
    isLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    deleteEmployees,
    reload: loadEmployees
  };
}
