import type { DateRange as ReactDayPickerDateRange } from "react-day-picker";

export type TransactionType = "income" | "expense";

export const CATEGORIES = [
  { key: "Salary", isSystem: false },
  { key: "Groceries", isSystem: false },
  { key: "Transport", isSystem: false },
  { key: "Taxes", isSystem: true },
  { key: "Entertainment", isSystem: false },
  { key: "Health", isSystem: false },
  { key: "Education", isSystem: false },
  { key: "Gifts", isSystem: false },
  { key: "Transfers", isSystem: false },
  { key: "Savings", isSystem: true },
  { key: "Other", isSystem: false },
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
  isSystem?: boolean;
}

export type CategoryFormValues = Omit<Category, "id" | "userId" | "isSystem">;


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
  savingsFundId?: string;
}

export type TransactionFormValues = Omit<Transaction, "id" | "userId" | "savingsFundId">;


// Tax types
export interface Tax {
  id: string;
  userId: string;
  name: string;
  month: number; // 0 for January, 11 for December
  year: number;
  amount: number;
  date: Date; // The date the record was created, for sorting
  isPaid: boolean;
  transactionId?: string; // ID of the transaction that paid this tax
}

export interface TaxFormValues {
  name: string;
  month: number;
  year: number;
  amount: number;
}

// Savings Fund types
export interface SavingsFund {
  id: string;
  userId: string;
  name: string;
  description: string;
  targetAmount: number;
  targetDate?: Date;
  currentAmount: number; // This will be calculated on the fly
}

export type SavingsFundFormValues = Omit<SavingsFund, "id" | "userId" | "currentAmount">;

export type Language = "en" | "es" | "pt";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
] as const;
export type Month = (typeof MONTHS)[number];


export interface Translations {
  [key: string]: string; // Add index signature
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
  noTransactionsForFilters: string;
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
  Transfers: string;
  Savings: string;
  Other: string;
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
  systemCategoryTooltip: string;
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
  addNewTax: string;
  taxName: string;
  month: string;
  year: string;
  monthRegistered: string;
  amountOfMonth: string;
  noTaxes: string;
  taxNameRequired: string;
  monthRequired: string;
  yearRequired: string;
  taxExistsError: string;
  selectTax: string;
  searchTax: string;
  noTaxFound: string;
  history: string;
  noHistory: string;
  pay: string;
  payTax: string;
  paid: string;
  taxPayment: string;
  editTax: string;
  taxUpdatedSuccess: string;
  paidTaxEditError: string;
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
  noPendingInstallments: string;
  totalDebt: string;
  totalThisMonth: string;
  pendingAmount: string;
  total: string;
  endsIn: string;
  completedInstallments: string;
  totalAmount: string;
  purchaseDate: string;
  completionDate: string;
  // Support Dialog
  supportProject: string;
  supportMessage1: string;
  supportMessage2: string;
  supportMessage3: string;
  supportCafecito: string;
  supportGithub: string;
  supportCopyLink: string;
  copied: string;
  supportVisitPortfolio: string;
  supportPaypal: string;
  // Account Deletion
  account: string;
  accountSettings: string;
  dangerZone: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  deleteAccountConfirmation: string;
  deleteAccountInputPrompt: string;
  deleteAccountConfirmationWord: string;
  // Goodbye Page
  goodbyeTitle: string;
  goodbyeMessage1: string;
  goodbyeMessage2: string;
  goodbyeMessage3: string;
  goodbyeShare: string;
  goodbyeBackHome: string;
  // Savings Funds
  savingsFunds: string;
  newSavingsFund: string;
  editSavingsFund: string;
  deleteSavingsFund: string;
  areYouSureDeleteSavingsFund: string;
  areYouSureDeleteFundWithBalance: string;
  noSavingsFunds: string;
  savingsFundName: string;
  savingsFundDescription: string;
  savingsFundTargetAmount: string;
  savingsFundTargetDate: string;
  savingsFundNameRequired: string;
  savingsFundDescriptionRequired: string;
  savingsFundTargetAmountRequired: string;
  savingsFundTargetAmountPositive: string;
  currentAmount: string;
  target: string;
  progress: string;
  ofGoal: string;
  noTargetDate: string;
  savingsFundAddedSuccess: string;
  savingsFundUpdatedSuccess: string;
  savingsFundDeletedSuccess: string;
  deposit: string;
  withdraw: string;
  transferTo: string;
  withdrawFrom: string;
  transfer: string;
  transferSuccess: string;
  transferError: string;
  withdrawAmountError: string;
  depositAmountError: string;
  maxToReachGoal: string;
  closeFund: string;
  confirmCloseFundTitle: string;
  confirmCloseFundDescription: string;
  availableToWithdraw: string;
  deleteFundErrorTransferCategory: string;
  deleteFundErrorPaymentMethod: string;
  deleteFundDescription: string;
  selectPaymentMethodReceive: string;
  processing: string;
  savingsFundsProgress: string;
  noSavingsFundsProgressTitle: string;
  noSavingsFundsProgressDesc1: string;
  noSavingsFundsProgressDesc2: string;
  noSavingsFundsProgressDesc3: string;
  completed: string;
  // Empty states
  noInstallmentsTitle: string;
  noInstallmentsDesc: string;
  // Terms & Conditions
  termsAndConditions: string;
  termsLastUpdated: string;
  termsAcceptance: string;
  termsAcceptanceText: string;
  termsServiceDescription: string;
  termsServiceDescriptionText: string;
  termsPrivacyAndData: string;
  termsPrivacyAndDataText1: string;
  termsPrivacyAndDataText2: string;
  termsPrivacyAndDataText3: string;
  termsLimitationOfLiability: string;
  termsLimitationOfLiabilityText: string;
  termsIntellectualProperty: string;
  termsIntellectualPropertyText: string;
  termsChangesAndTermination: string;
  termsChangesAndTerminationText: string;
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
  purchaseDate: Date;
  lastInstallmentDate: Date;
}

export interface CompletedInstallmentDetail {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paymentMethodName: string;
  purchaseDate: Date;
  lastInstallmentDate: Date;
}

export interface InstallmentProjection {
  month: string; // YYYY-MM
  total: number;
}
