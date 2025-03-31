// User types
export enum UserRole {
  SUPER_MANAGER = "SUPER_MANAGER",
  MANAGER = "MANAGER",
  COLLECTION_OFFICER = "COLLECTION_OFFICER",
  CALLING_AGENT = "CALLING_AGENT",
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

export interface Hierarchy {
  id: string;
  manager: string;
  manager_name: string;
  collection_officer: string;
  collection_officer_name: string;
  created_at: string;
  updated_at: string;
}

// Customer types
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  gender_display: string;
  date_of_birth?: string;
  national_id?: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  branch?: string;
  employer?: string;
  job_title?: string;
  monthly_income?: number;
  assigned_officer?: string;
  assigned_officer_name?: string;
  is_active: boolean;
  paid_status: boolean;
  notes?: string;
  risk_score?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Loan types
export enum LoanStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  PAID = "PAID",
  DEFAULTED = "DEFAULTED",
  RESTRUCTURED = "RESTRUCTURED",
  WRITTEN_OFF = "WRITTEN_OFF",
}

export enum PaymentFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
}

export interface Loan {
  id: string;
  customer: string;
  customer_name: string;
  loan_reference: string;
  status: LoanStatus;
  status_display: string;
  principal_amount: number;
  interest_rate: number;
  application_date: string;
  approval_date?: string;
  disbursement_date?: string;
  first_payment_date?: string;
  maturity_date?: string;
  term_months: number;
  payment_frequency: PaymentFrequency;
  payment_frequency_display: string;
  amount_paid: number;
  last_payment_date?: string;
  days_past_due: number;
  assigned_officer?: string;
  assigned_officer_name?: string;
  notes?: string;
  total_amount_due: number;
  remaining_balance: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Payment types
export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  CHEQUE = "CHEQUE",
  OTHER = "OTHER",
}

export interface Payment {
  id: string;
  loan: string;
  loan_reference: string;
  customer_name: string;
  payment_reference: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  payment_method_display: string;
  received_by?: string;
  received_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Interaction types
export enum InteractionType {
  CALL = "CALL",
  MEETING = "MEETING",
  EMAIL = "EMAIL",
  SMS = "SMS",
  VISIT = "VISIT",
  OTHER = "OTHER",
}

export enum InteractionOutcome {
  PAYMENT_PROMISED = "PAYMENT_PROMISED",
  PAYMENT_MADE = "PAYMENT_MADE",
  NO_ANSWER = "NO_ANSWER",
  WRONG_NUMBER = "WRONG_NUMBER",
  NUMBER_DISCONNECTED = "NUMBER_DISCONNECTED",
  CUSTOMER_UNAVAILABLE = "CUSTOMER_UNAVAILABLE",
  DISPUTED = "DISPUTED",
  REFUSED_TO_PAY = "REFUSED_TO_PAY",
  OTHER = "OTHER",
}

export interface Interaction {
  id: string;
  customer: string;
  customer_name: string;
  loan?: string;
  loan_reference?: string;
  interaction_type: InteractionType;
  interaction_type_display: string;
  initiated_by: string;
  initiated_by_name: string;
  contact_number?: string;
  contact_person?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  outcome?: InteractionOutcome;
  outcome_display?: string;
  notes: string;
  payment_promise_amount?: number;
  payment_promise_date?: string;
  created_at: string;
  updated_at: string;
}

// Follow-up types
export enum FollowUpType {
  CALL = "CALL",
  VISIT = "VISIT",
  SMS = "SMS",
  EMAIL = "EMAIL",
  OTHER = "OTHER",
}

export enum FollowUpStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  RESCHEDULED = "RESCHEDULED",
  CANCELED = "CANCELED",
}

export enum FollowUpPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface FollowUp {
  id: string;
  interaction: string;
  customer: string;
  customer_name: string;
  follow_up_type: FollowUpType;
  follow_up_type_display: string;
  scheduled_date: string;
  scheduled_time?: string;
  assigned_to: string;
  assigned_to_name: string;
  notes?: string;
  priority: FollowUpPriority;
  priority_display: string;
  status: FollowUpStatus;
  status_display: string;
  result?: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
}
