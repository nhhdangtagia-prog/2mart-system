import { useState, useEffect, useCallback } from "react";
import { hashPassword } from "../utils/passwordHash";

export interface AdminAccount {
  username: string;
  passwordHash: string;
  name: string;
}

const STORAGE_KEY = "kiot_admin_account";
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";
const DEFAULT_NAME = "Admin";

export async function getAdminAccount(): Promise<AdminAccount> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.passwordHash) {
        return { username: DEFAULT_USERNAME, name: DEFAULT_NAME, ...parsed };
      }
      // Bản ghi cũ còn lưu mật khẩu dạng chữ thường (field `password`) — băm lại
      const migrated: AdminAccount = {
        username: parsed.username || DEFAULT_USERNAME,
        name: parsed.name || DEFAULT_NAME,
        passwordHash: await hashPassword(parsed.password || DEFAULT_PASSWORD)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      // fall through to default
    }
  }
  const defaultAccount: AdminAccount = {
    username: DEFAULT_USERNAME,
    name: DEFAULT_NAME,
    passwordHash: await hashPassword(DEFAULT_PASSWORD)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccount));
  return defaultAccount;
}

export function useAdminAccount() {
  const [account, setAccount] = useState<AdminAccount | null>(null);

  useEffect(() => {
    getAdminAccount().then(setAccount);
  }, []);

  const updateAccount = useCallback(async (data: { username?: string; name?: string; password?: string }) => {
    const current = await getAdminAccount();
    const updated: AdminAccount = {
      username: data.username || current.username,
      name: data.name || current.name,
      passwordHash: data.password ? await hashPassword(data.password) : current.passwordHash
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAccount(updated);
    window.dispatchEvent(new Event("kiot_admin_account_change"));
    return updated;
  }, []);

  return { account, updateAccount };
}
