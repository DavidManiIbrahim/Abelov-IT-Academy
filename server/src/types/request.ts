import { z } from "zod";

export const RecordStatusEnum = z.enum(["Pending", "In-Transit", "Received", "Verified", "Sold", "Damaged"]);

export const RequestSchema = z.object({
  hub_location: z.string().optional().default(''),
  recorder_name: z.string().optional().default(''),
  entry_date: z.string().optional().default(''),
  entity_name: z.string().optional().default(''),
  entity_phone: z.string().optional().default(''),
  entity_email: z.string().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email').optional().default(''),
  entity_address: z.string().optional().default(''),
  product_name: z.string().optional().default(''),
  batch_sku: z.string().optional().default(''),
  serial_number: z.string().optional().default(''),
  specifications: z.string().optional().default(''),
  accessories_notes: z.string().optional().default(''),
  record_description: z.string().optional().default(''),
  verification_date: z.string().optional().default(''),
  verification_staff: z.string().optional().default(''),
  quality_check: z.string().optional().default(''),
  materials_notes: z.string().optional().default(''),
  action_taken: z.string().optional().default(''),
  status: RecordStatusEnum.optional().default('Pending'),
  processing_fee: z.coerce.number().nonnegative().optional().default(0),
  additional_cost: z.coerce.number().nonnegative().optional().default(0),
  total_value: z.coerce.number().nonnegative().optional().default(0),
  amount_paid: z.coerce.number().nonnegative().optional().default(0),
  balance: z.coerce.number().nonnegative().optional().default(0),
  transaction_completed: z.coerce.boolean().optional().default(false),
  user_id: z.string().optional(),
}).passthrough();

export const RequestUpdateSchema = RequestSchema.partial();

export type RequestCreate = z.infer<typeof RequestSchema>;
export type RequestUpdate = z.infer<typeof RequestUpdateSchema>;

export type RequestEntity = RequestCreate & {
  id: string;
  created_at: string;
  updated_at: string;
};

