
import type { DateRange as ReactDayPickerDateRange } from "react-day-picker";

export type TransactionType = "income" | "expense";

export const CATEGORIES = [
  { key: "Salary", isSystem: false },
  { key: "Groceries", isSystem: false },
  { key: "Food", isSystem: false },
  { key: "Clothing", isSystem: false },
  { key: "Other", isSystem: false },
  { key: "Taxes", isSystem: true },
  { key: "Savings", isSystem: true },
] as const;


export const PAYMENT_METHOD_TYPES = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "VirtualWallet",
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
  isSystem: boolean;
}

export type CategoryFormValues = Omit<Category, "id" | "userId" | "isSystem">;


export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string; // Always an ISO string from the backend
  categoryId: string;
  type: TransactionType;
  paymentMethodId: string;
  installments?: number;
  groupId?: string;
  savingsFundId?: string;
  billingCycleId?: string;
  isCardPayment?: boolean;
  cardId?: string;
  isPaid?: boolean;
}

export type TransactionFormValues = Omit<Transaction, "id" | "userId" | "savingsFundId" | "groupId" | "billingCycleId" | "date" | "isCardPayment" | "cardId" | "isPaid"> & {
  date: Date; // Form uses Date object, but it's converted to string for backend
};


// Tax types
export interface Tax {
  id: string;
  userId: string;
  name: string;
  month: number; // 0 for January, 11 for December
  year: number;
  amount: number;
  date?: string; // ISO string for payment date
  isPaid: boolean;
  transactionId?: string; // ID of the transaction that paid this tax
}

export type TaxFormValues = {
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
  targetDate?: string; // ISO string
  currentAmount: number; // This will be calculated on the fly
}

export type SavingsFundFormValues = Omit<SavingsFund, "id" | "userId" | "currentAmount"> & {
    targetDate?: Date; // Form uses Date object
};


// Billing Cycle types
export interface BillingCycle {
  id: string;
  userId: string;
  startDate: string; // ISO string
  endDate?: string;   // ISO string
}

// Card Summary types
export interface CardSummary {
    cardId: string;
    cardName: string;
    cardBank?: string;
    totalAmount: number;
    transactions: Transaction[];
}

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
  areYouSureDeleteInstallment: string;
  totalIncome: string;
  totalExpenses: string;
  transactions: string;
  noTransactions: string;
  noTransactionsForFilters: string;
  filterByType: string;
  filterByDateRange: string;
  clearFilters: string;
  startDate: string;
  endDate: string;
  allCategories: string;
  allCycles: string;
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
  Taxes: string;
  Savings: string;
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
  categoryExistsError: string;
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
  taxesIntroTitle: string;
  taxesIntroText1: string;
  taxesIntroText2: string;
  taxesIntroText3: string;
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
  // Days
  Sunday: string;
  Monday: string;
  Tuesday: string;
  Wednesday: string;
  Thursday: string;
  Friday: string;
  Saturday: string;
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
  dailyExpenses: string;
  today: string;
  yesterday: string;
  installmentProjection: string;
  seeDetails: string;
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
  manualInstallments: string;
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
  installmentsIntroTitle: string;
  installmentsIntroText1: string;
  installmentsIntroText2: string;
  installmentsIntroText3: string;
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
  accountInformation: string;
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
  noSavingsFundsProgressDesc: string;
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
  // Intro Accordions
  savingsFundsIntroTitle: string;
  savingsFundsIntroText1: string;
  savingsFundsIntroText2: string;
  savingsFundsIntroText3: string;
  // Billing Cycles
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeDesc: string;
  welcomeTermsText1: string;
  selectStartDate: string;
  startFirstCycle: string;
  starting: string;
  startNewCycle: string;
  confirmNewCycleTitle: string;
  confirmNewCycleDesc: string;
  currentCycleStartedOn: string;
  confirmAndStart: string;
  newCycleStartedTitle: string;
  newCycleStartedDesc: string;
  deleteCategory: string;
  areYouSureDeleteCategory: string;
  deleteCategoryWarning: string;
  cannotDeleteCategoryTitle: string;
  categoryInUseError: string;
  categoryDeletedSuccess: string;
  resultsPerPage: string;
  current: string;
  // Budget Insights
  budgetInsights: string;
  budgetInsightsDescription: string;
  dailyView: string;
  weeklyView: string;
  avgDailyExpense: string;
  dailyBudget: string;
  weeklyExpenses: string;
  weeklyBudget: string;
  avgWeeklyExpense28d: string;
  historicCycleInfo: string;
  historicCycleData: string;
  avgDailyExpenseCycle: string;
  avgWeeklyExpenseCycle: string;
  // Card Summaries
  cardSummaries: string;
  cardSummariesIntroTitle: string;
  cardSummariesIntroText1: string;
  cardSummariesIntroText2: string;
  cardSummariesIntroText3: string;
  noCardSummaries: string;
  unpaidExpenses: string;
  paySummary: string;
  payCardSummary: string;
  payCardSummaryDesc: string;
  paymentFrom: string;
  partialAmount: string;
  paymentDate: string;
  amountToPay: string;
  summaryPaymentSuccess: string;
  summaryPaymentError: string;
  paymentForCardSummary: string;
}

export type DateRange = ReactDayPickerDateRange;

export interface DailyExpenses {
  today: number;
  yesterday: number;
}

export interface InstallmentDetail {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  pendingAmount: number;
  paymentMethodName: string;
  purchaseDate: string; // ISO string
  lastInstallmentDate: string; // ISO string
}

export interface CompletedInstallmentDetail {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paymentMethodName: string;
  purchaseDate: string; // ISO string
  lastInstallmentDate: string; // ISO string
}

export interface InstallmentProjection {
  month: string; // YYYY-MM
  total: number;
}

export interface BudgetInsights {
  dailyAverage7Days: number;
  weeklyExpensesTotal: number;
  weeklyAverage28Days: number;
  dailyExpenses: { date: string; total: number }[];
  weeklyBudget: number;
  dailyBudget: number;
  isHistoric: boolean;
  cycleDailyAverage: number;
  cycleWeeklyAverage: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  previousCycleIncome: number;
  previousCycleExpenses: number;
}

    