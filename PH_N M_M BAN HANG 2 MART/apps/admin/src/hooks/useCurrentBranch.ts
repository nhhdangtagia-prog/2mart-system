import { useState, useEffect } from "react";

export const BRANCHES = [
  "285 Nguyễn Lương Bằng",
  "379b Tôn Đức Thắng"
] as const;

export type BranchName = typeof BRANCHES[number] | "Tất cả chi nhánh";

const STORAGE_KEY = "kiot_current_branch";

export function useCurrentBranch() {
  const [currentBranch, setCurrentBranchState] = useState<BranchName>(() => {
    return (localStorage.getItem(STORAGE_KEY) as BranchName) || BRANCHES[0];
  });

  useEffect(() => {
    const handleUpdate = () => {
      const b = (localStorage.getItem(STORAGE_KEY) as BranchName) || BRANCHES[0];
      setCurrentBranchState(b);
    };
    window.addEventListener("kiot_branch_change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("kiot_branch_change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const setCurrentBranch = (branch: BranchName) => {
    localStorage.setItem(STORAGE_KEY, branch);
    setCurrentBranchState(branch);
    window.dispatchEvent(new Event("kiot_branch_change"));
  };

  return {
    currentBranch,
    setCurrentBranch,
    branches: BRANCHES,
    isCS1: currentBranch === "285 Nguyễn Lương Bằng",
    isCS2: currentBranch === "379b Tôn Đức Thắng",
    isAll: currentBranch === "Tất cả chi nhánh"
  };
}
