import { useState, useEffect, useCallback } from "react";
import { useEmployees, type AccessLevel } from "./useEmployees";
import { getAdminAccount } from "./useAdminAccount";
import { hashPassword } from "../utils/passwordHash";

export interface Session {
  employeeId: string;
  code: string;
  name: string;
  username: string;
  branch: string;
  accessLevel: AccessLevel;
}

const STORAGE_KEY = "kiot_session_v1";

function readSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function useSession() {
  const { employees } = useEmployees();
  const [session, setSession] = useState<Session | null>(() => readSession());

  useEffect(() => {
    const handleUpdate = () => setSession(readSession());
    window.addEventListener("kiot_session_change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("kiot_session_change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    const inputHash = await hashPassword(password);

    // Tài khoản Admin riêng biệt, không nằm trong danh sách Nhân viên
    const adminAccount = await getAdminAccount();
    if (cleanUsername === adminAccount.username.toLowerCase()) {
      if (adminAccount.passwordHash !== inputHash) {
        return { ok: false, error: "Sai mật khẩu." };
      }
      const newSession: Session = {
        employeeId: "admin",
        code: "ADMIN",
        name: adminAccount.name,
        username: adminAccount.username,
        branch: "Tất cả chi nhánh",
        accessLevel: "admin"
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      window.dispatchEvent(new Event("kiot_session_change"));
      return { ok: true };
    }

    const emp = employees.find(e => e.username.toLowerCase() === cleanUsername);
    if (!emp) {
      return { ok: false, error: "Tài khoản không tồn tại." };
    }
    if (emp.status !== "Đang làm việc") {
      return { ok: false, error: "Tài khoản này đã ngừng làm việc, vui lòng liên hệ quản trị." };
    }
    if (emp.passwordHash !== inputHash) {
      return { ok: false, error: "Sai mật khẩu." };
    }
    const newSession: Session = {
      employeeId: emp.id,
      code: emp.code,
      name: emp.name,
      username: emp.username,
      branch: emp.branch,
      accessLevel: emp.accessLevel
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    window.dispatchEvent(new Event("kiot_session_change"));
    return { ok: true };
  }, [employees]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("kiot_session_change"));
  }, []);

  return { session, login, logout };
}
