"use client";

import { useEffect, useMemo, useState } from "react";
import { branchesForBank } from "./bank-branches";
import { type BankKey } from "./bank-themes";

type Props = {
  bankKey: BankKey;
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export default function BranchSelect({
  bankKey,
  value,
  onChange,
  label = "Branch (optional)",
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const options = useMemo(() => branchesForBank(bankKey), [bankKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((b) => b.toLowerCase().includes(q));
  }, [options, query]);

  const selectBranch = (branch: string) => {
    onChange(branch);
    setQuery(branch);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder="Search or select branch"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        autoComplete="off"
        name="bank-branch-ref"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map((branch) => (
            <li key={branch}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-green-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectBranch(branch)}
              >
                {branch}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
