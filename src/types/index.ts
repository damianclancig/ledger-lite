
import type { DateRange as ReactDayPickerDateRange } from "react-day-picker";

export type TransactionType = "income" | "expense";

export const CATEGORIES = [
  "Salary",
  "Groceries",
  "Transport",
  "Taxes",
  "Entertainment",
  "Health",
  "Education",
  "Gifts",
  "Other",
] as const;

export const PAYMENT_METHOD_TYPES = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Virtual Wallet",
  "Other",
] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
  bank?: string;
  isEnabled: boolean;
}
export type PaymentMethodFormValues = Omit<PaymentMethod, "id" | "userId">;


export interface Category {
  id: string;
  userId: string;
  name: string;
  isEnabled: boolean;
}

export type CategoryFormValues = Omit<Category, "id" | "userId">;


export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  type: TransactionType;
  paymentMethodId: string;
  installments?: number;
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
  isPaid: boolean;
  transactionId?: string; // ID of the transaction that paid this tax
}

export type TaxFormValues = Omit<Tax, "id" | "userId" | "date" | "isPaid" | "transactionId">;

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
  saveAndAddAnother: string;
  cancel: string;
  delete: string;
  edit: string;
  confirmDelete: string;
  areYouSureDelete: string;
  totalIncome: string;
  totalExpenses: string;
  transactions: string;
  noTransactions: string;
  filterByType: string;
  filterByCategory: string;
  filterByDateRange: string;
  clearFilters: string;
  startDate: string;
  endDate: string;
  allCategories: string;
  allMonths: string;
  currentMonth: string;
  previousMonth: string;
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
  Taxes: string;
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
  VirtualWallet: string;
  OtherPaymentType: string;
  // Auth translations
  signOut: string;
  signInToContinue: string;
  signInWithGoogle: string;
  unauthorizedDomainError: string;
  // New translations
  home: string;
  back: string;
  options: string;
  manageCategories: string;
  new: string;
  newCategory: string;
  editCategory: string;
  categoryName: string;
  categoryNameRequired: string;
  categoryStatus: string;
  enabled: string;
  disabled: string;
  categoryAddedSuccess: string;
  categoryUpdatedSuccess: string;
  categoryInUseError: string;
  // Validation messages
  descriptionRequired: string;
  descriptionMaxLength: string;
  amountRequired: string;
  amountPositive: string;
  dateRequired: string;
  categoryRequired: string;
  typeRequired: string;
  paymentMethodRequired: string;
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
  history: string;
  noHistory: string;
  pay: string;
  payTax: string;
  paid: string;
  taxPayment: string;
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
  // Footer
  footerRights: string;
  footerAuthor: string;
  // Toast Messages
  transactionAddedTitle: string;
  transactionAddedDesc: string;
  transactionUpdatedTitle: string;
  transactionUpdatedDesc: string;
  transactionDeletedTitle: string;
  transactionDeletedDesc: string;
  deleteTransaction: string;
  taxAddedTitle: string;
  taxAddedDesc: string;
  errorTitle: string;
  // Charts
  expensesByCategory: string;
  incomeVsExpense: string;
  installmentProjection: string;
  // Payment Methods
  managePaymentMethods: string;
  newPaymentMethod: string;
  editPaymentMethod: string;
  paymentMethodName: string;
  paymentMethodType: string;
  paymentMethodBank: string;
  paymentMethodBankPlaceholder: string;
  paymentMethodNameRequired: string;
  paymentMethodTypeRequired: string;
  paymentMethodStatus: string;
  paymentMethodAddedSuccess: string;
  paymentMethodUpdatedSuccess: string;
  paymentMethodInUseError: string;
  // Installments
  installments: string;
  pendingInstallments: string;
  noInstallments: string;
  totalDebt: string;
  totalThisMonth: string;
  pendingAmount: string;
  total: string;
}

export type DateRange = ReactDayPickerDateRange;

export interface InstallmentDetail {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  pendingAmount: number;
  paymentMethodName: string;
}

export interface InstallmentProjection {
  month: string; // YYYY-MM
  total: number;
}
    

    