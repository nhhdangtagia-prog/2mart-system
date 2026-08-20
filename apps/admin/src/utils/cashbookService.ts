export interface CashbookEntry {
  id: string;
  type: "receipt" | "payment";
  date: string;
  amount: number;
  description: string;
  category: string;
  actorName?: string;
  approvedBy?: string; // for legacy
  employeeCode?: string;
  sessionId?: string; // Gắn với ca làm việc
  referenceId?: string;
  timestampMs?: number;
  isManual?: boolean;
}

export const CASHBOOK_STORAGE_KEY = "kiot_cashbook_payments_v1";

export async function getCashbookEntries(from: string, to: string): Promise<CashbookEntry[]> {
  try {
    const res = await fetch(`/api/cashbook?from=${from}&to=${to}`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return [];
  }
}

export async function addCashbookEntry(entry: Omit<CashbookEntry, "id" | "date">) {
  const res = await fetch(`/api/cashbook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error('API failed');
  return await res.json();
}

export async function updateCashbookEntry(id: string, updates: Partial<Omit<CashbookEntry, "id" | "date" | "timestampMs">>) {
  const res = await fetch(`/api/cashbook/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('API failed');
}

export async function deleteCashbookEntry(id: string) {
  const res = await fetch(`/api/cashbook/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('API failed');
}

export async function syncCashbookFromLocal() {
  const localStr = localStorage.getItem(CASHBOOK_STORAGE_KEY);
  if (!localStr) return;
  try {
    const entries = JSON.parse(localStr);
    if (!entries || entries.length === 0) return;
    const res = await fetch(`/api/cashbook/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries })
    });
    if (res.ok) {
      localStorage.removeItem(CASHBOOK_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to sync cashbook", e);
  }
}
