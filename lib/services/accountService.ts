export type UnderGroup = 'Sundry Creditors' | 'Sundry Debtors' | 'Secured Loans' | 'Unsecured Loans' | 'Bank Accounts' | 'Cash-in-hand' | 'Direct Expenses' | 'Indirect Expenses' | 'Cash Receipt' | 'UPI Receipt' | 'Finance Receipt' | 'Cheque Receipt' | 'NEFT Receipt' | 'Trade Advance' | 'Opening Stock' | 'Closing Stock';
export type BalanceType = 'Dr' | 'Cr';
export type DealerType = 'Regular' | 'Composition' | 'Unregistered' | 'Consumer';

export interface BankAccount {
  bank_name: string;
  account_number: string;
  ifsc: string;
}

export interface EmiInstallment {
  installment_no: number;
  amount: number;
  due_date: string; // ISO date string
}

export interface LedgerRecord {
  id: string;
  ledger_name: string;
  under_group: UnderGroup;
  maintain_balances_bill_by_bill: boolean;
  credit_period_days?: number;
  credit_limit_amount?: number;

  // Mailing Details
  address?: string;
  state?: string;
  pincode?: string;

  // Statutory Details
  pan_no?: string;
  registration_type: DealerType;
  gstin?: string;

  // Opening Balance
  opening_balance: number;
  balance_type: BalanceType;

  // New fields
  customer_phone?: string;
  bank_accounts: BankAccount[]; // multiple banks per ledger
  upi_ids: string[]; // multiple UPI IDs
  dp_amount?: number; // Down payment amount (if finance partner)
  emi_schedule?: EmiInstallment[]; // optional EMI schedule
  finance_partner?: string; // e.g., "Bajaj Finance"
  cheque_end_date?: string; // e.g. "2026-05-30"
  ta_start_date?: string;
  ta_end_date?: string;
  is_cashed?: boolean; // Track if a Cheque Receipt has been cashed into the bank

  created_at: string;
}

const globalForLedgers = globalThis as unknown as {
  LOCAL_LEDGERS: LedgerRecord[];
};

let LOCAL_LEDGERS: LedgerRecord[] = globalForLedgers.LOCAL_LEDGERS || [];

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('inwise_mock_ledgers');
  if (saved) {
    try {
      LOCAL_LEDGERS = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to restore ledgers from localStorage', e);
    }
  }

  if (LOCAL_LEDGERS.length === 0) {
    LOCAL_LEDGERS = [
      {
        id: 'ldg-1',
        ledger_name: 'Samsung India Electronics Pvt Ltd',
        under_group: 'Sundry Creditors',
        maintain_balances_bill_by_bill: true,
        credit_period_days: 30,
        credit_limit_amount: 1500000,
        address: 'Sector 81, Noida',
        state: 'Uttar Pradesh',
        pincode: '201305',
        pan_no: 'AAECS8892M',
        registration_type: 'Regular',
        gstin: '09AAECS8892M1Z8',
        opening_balance: 500000,
        balance_type: 'Cr',
        bank_accounts: [],
        upi_ids: [],
        created_at: new Date().toISOString(),
      },
      {
        id: 'ldg-2',
        ledger_name: 'HDB Financial Services Ltd',
        under_group: 'Unsecured Loans',
        maintain_balances_bill_by_bill: false,
        credit_period_days: 0,
        credit_limit_amount: 5000000,
        address: 'Ground Floor, Zenith House, Keshavrao Khadye Marg',
        state: 'Maharashtra',
        pincode: '400034',
        pan_no: 'AAACH8891J',
        registration_type: 'Regular',
        gstin: '27AAACH8891J1ZP',
        opening_balance: 150000,
        balance_type: 'Cr',
        bank_accounts: [],
        upi_ids: [],
        created_at: new Date().toISOString(),
      },
      {
        id: 'ldg-3',
        ledger_name: 'Ramesh Wholesale Electronics',
        under_group: 'Sundry Debtors',
        maintain_balances_bill_by_bill: true,
        credit_period_days: 15,
        credit_limit_amount: 200000,
        address: 'MG Road, Asansol',
        state: 'West Bengal',
        pincode: '713301',
        pan_no: 'BRPPR4451K',
        registration_type: 'Regular',
        gstin: '19BRPPR4451K1Z3',
        opening_balance: 25000,
        balance_type: 'Dr',
        bank_accounts: [],
        upi_ids: [],
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem('inwise_mock_ledgers', JSON.stringify(LOCAL_LEDGERS));
  }
}

export async function getLedgers(): Promise<LedgerRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...LOCAL_LEDGERS];
}

export async function addLedger(ledger: Omit<LedgerRecord, 'id' | 'created_at'>): Promise<LedgerRecord> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const newLedger: LedgerRecord = {
    ...ledger,
    id: `ldg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };

  LOCAL_LEDGERS.push(newLedger);

  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_ledgers', JSON.stringify(LOCAL_LEDGERS));
  }

  return newLedger;
}

export async function updateLedger(id: string, updates: Partial<LedgerRecord>): Promise<LedgerRecord | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const idx = LOCAL_LEDGERS.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  LOCAL_LEDGERS[idx] = { ...LOCAL_LEDGERS[idx], ...updates };

  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_ledgers', JSON.stringify(LOCAL_LEDGERS));
  }

  return LOCAL_LEDGERS[idx];
}

export async function deleteLedger(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const initialLength = LOCAL_LEDGERS.length;
  LOCAL_LEDGERS = LOCAL_LEDGERS.filter((a) => a.id !== id);

  if (LOCAL_LEDGERS.length !== initialLength && typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_ledgers', JSON.stringify(LOCAL_LEDGERS));
    return true;
  }
  return false;
}
