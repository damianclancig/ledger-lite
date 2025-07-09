
export type TransactionType = "income" | "expense";

export const CATEGORIES = [
  "Salary",
  "Groceries",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Gifts",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_TYPES = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Other",
] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: Date;
  category: Category;
  type: TransactionType;
  paymentType: PaymentType;
}

export type TransactionFormValues = Omit<Transaction, "id" | "userId">;
export type Language = "en" | "es" | "pt";

export interface Translations {
  appName: string;
  addTransaction: string;
  editTransaction: string;
  description: string;
  amount: string;
  date: string;
  category: string;
  type: string;
  paymentType: string;
  income: string;
  expense: string;
  save: string;
  cancel: string;
  delete: string;
  confirmDelete: string;
  areYouSureDelete: string;
  totalIncome: string;
  totalExpenses: string;
  transactions: string;
  noTransactions: string;
  filterByType: string;
  filterByCategory: string;
  filterByDateRange: string;
  startDate: string;
  endDate: string;
  allTypes: string;
  allCategories: string;
  searchDescription: string;
  actions: string;
  page: string;
  of: string;
  next: string;
  previous: string;
  selectLanguage: string;
  english: string;
  spanish: string;
  portuguese: string;
  toggleTheme: string;
  light: string;
  dark: string;
  system: string;
  // Category translations
  Salary: string;
  Groceries: string;
  Transport: string;
  Utilities: string;
  Entertainment: string;
  Health: string;
  Education: string;
  Gifts: string;
  OtherCategory: string; // "Other" for category is a reserved keyword
  // Payment Type translations
  Cash: string;
  CreditCard: string;
  DebitCard: string;
  BankTransfer: string;
  OtherPaymentType: string;
  // Auth translations
  signOut: string;
  signInToContinue: string;
  signInWithGoogle: string;
  unauthorizedDomainError: string;
  // New translations
  home: string;
  back: string;
}
