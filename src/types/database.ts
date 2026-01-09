export type RecordCategory = "Electronics" | "Consumer Goods" | "Industrial" | "Other" | "Student" | "Internet";
export type RecordStatus = "Pending" | "In-Transit" | "Received" | "Verified" | "Sold" | "Damaged" | "Active" | "Completed";

export interface LogTimelineStep {
  step: string;
  date: string;
  note: string;
  status: string;
}

export interface VerificationConfirmation {
  verified: boolean;
  verifier_name: string;
}

export interface HubRecord {
  id: string;
  user_id: string;
  hub_location: string;
  recorder_name: string;
  entry_date: string;
  entity_name: string; // Supplier or Customer
  entity_phone: string;
  entity_email?: string;
  entity_address: string;
  product_name: string;
  product_category: RecordCategory;
  batch_sku: string;
  serial_number: string;
  specifications: string;
  accessories_notes: string;
  record_description: string;
  verification_date: string;
  verification_staff: string;
  quality_check: string;
  materials_notes: string;
  action_taken: string;
  status: RecordStatus;
  processing_fee: number;
  additional_cost: number;
  total_value: number;
  amount_paid: number;
  balance: number;
  transaction_completed: boolean;
  is_dispatched?: boolean;
  log_timeline: LogTimelineStep[];
  verification_confirmation: VerificationConfirmation;
  product_photo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, string | number | boolean>;
}
