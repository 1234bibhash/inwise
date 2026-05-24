export type BalanceSheetEntryType = 'Income' | 'Expense' | 'Asset' | 'Liability' | 'Equity';

export interface BalanceSheetEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: BalanceSheetEntryType;
  category: string;
  created_at: string;
}

let LOCAL_ENTRIES: BalanceSheetEntry[] = [];

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('inwise_mock_balancesheet');
  if (stored) {
    LOCAL_ENTRIES = JSON.parse(stored);
  } else {
    LOCAL_ENTRIES = [
      {
        id: 'bse-1',
        date: new Date().toISOString().split('T')[0],
        description: 'Initial Capital',
        amount: 500000,
        type: 'Equity',
        category: 'Owner Capital',
        created_at: new Date().toISOString(),
      }
    ];
    localStorage.setItem('inwise_mock_balancesheet', JSON.stringify(LOCAL_ENTRIES));
  }
}

export async function getBalanceSheetEntries(): Promise<BalanceSheetEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...LOCAL_ENTRIES];
}

export async function addBalanceSheetEntry(entry: Omit<BalanceSheetEntry, 'id' | 'created_at'>): Promise<BalanceSheetEntry> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const newEntry: BalanceSheetEntry = {
    ...entry,
    id: `bse-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };

  LOCAL_ENTRIES.push(newEntry);

  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_balancesheet', JSON.stringify(LOCAL_ENTRIES));
  }

  return newEntry;
}

export async function updateBalanceSheetEntry(id: string, updates: Partial<BalanceSheetEntry>): Promise<BalanceSheetEntry | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const idx = LOCAL_ENTRIES.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  LOCAL_ENTRIES[idx] = { ...LOCAL_ENTRIES[idx], ...updates };

  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_balancesheet', JSON.stringify(LOCAL_ENTRIES));
  }

  return LOCAL_ENTRIES[idx];
}

export async function deleteBalanceSheetEntry(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const idx = LOCAL_ENTRIES.findIndex((e) => e.id === id);
  if (idx === -1) return false;

  LOCAL_ENTRIES.splice(idx, 1);

  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_balancesheet', JSON.stringify(LOCAL_ENTRIES));
  }

  return true;
}
