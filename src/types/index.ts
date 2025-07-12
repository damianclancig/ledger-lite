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

// Tax types
export interface Tax {
  id: string;
  userId: string;
  name: string;
  month: number; // 0 for January, 11 for December
  amount: number;
  date: Date; // The date the record was created, for sorting
}

export type TaxFormValues = Omit<Tax, "id" | "userId" | "date">;

export type Language = "en" | "es" | "pt";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
] as const;
export type Month = (typeof MONTHS)[number];


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
  // Validation messages
  descriptionRequired: string;
  descriptionMaxLength: string;
  amountRequired: string;
  amountPositive: string;
  dateRequired: string;
  categoryRequired: string;
  typeRequired: string;
  paymentTypeRequired: string;
  // Tax-related translations
  taxes: string;
  newTax: string;
  taxName: string;
  month: string;
  monthRegistered: string;
  amountOfMonth: string;
  noTaxes: string;
  taxNameRequired: string;
  monthRequired: string;
  selectTax: string;
  searchTax: string;
  noTaxFound: string;
  // Months
  January: string;
  February: string;
  March: string;
  April: string;
  May: string;
  June: string;
  July: string;
  August: string;
  September: string;
  October: string;
  November: string;
  December: string;
}
