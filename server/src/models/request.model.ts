import mongoose, { Schema, model } from "mongoose";
import { encrypt, decrypt } from "../utils/crypto";

const RequestSchema = new Schema(
  {
    hub_location: { type: String },
    recorder_name: { type: String },
    entry_date: { type: String },
    entity_name: { type: String, index: true },
    entity_phone: { type: String, index: true },
    entity_email: { type: String, index: true },
    entity_address: { type: String },
    product_name: { type: String },
    product_category: { type: String },
    batch_sku: { type: String },
    serial_number: { type: String, index: true },
    specifications: { type: String },
    accessories_notes: { type: String },
    record_description: { type: String },
    verification_date: { type: String },
    verification_staff: { type: String },
    quality_check: { type: String },
    materials_notes: { type: String },
    action_taken: { type: String },
    status: { type: String, index: true },
    processing_fee: { type: Number },
    additional_cost: { type: Number },
    total_value: { type: Number },
    amount_paid: { type: Number },
    balance: { type: Number },
    transaction_completed: { type: Boolean },
    user_id: { type: String, index: true },
    is_dispatched: { type: Boolean, default: false },
    log_timeline: [{
      step: String,
      date: String,
      note: String,
      status: String
    }],
    verification_confirmation: {
      verified: { type: Boolean, default: false },
      verifier_name: { type: String }
    },
    product_photo: { type: String }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

RequestSchema.index({ status: 1, created_at: -1 });

RequestSchema.pre("save", function (next) {
  if (this.isModified("entity_email") && this.get("entity_email")) {
    const v = this.get("entity_email") as string;
    // Only encrypt if value is not empty
    if (v.trim()) {
      this.set("entity_email", encrypt(v));
    }
  }
  if (this.isModified("entity_phone") && this.get("entity_phone")) {
    const v = this.get("entity_phone") as string;
    // Only encrypt if value is not empty
    if (v.trim()) {
      this.set("entity_phone", encrypt(v));
    }
  }
  next();
});

RequestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  try {
    // Safely decrypt - only if value exists and looks encrypted
    if (obj.entity_email && typeof obj.entity_email === 'string') {
      // Check if it looks like encrypted data (base64 format)
      if (obj.entity_email.includes('+') || obj.entity_email.includes('/') || obj.entity_email.length > 100) {
        obj.entity_email = decrypt(obj.entity_email);
      }
    }
    if (obj.entity_phone && typeof obj.entity_phone === 'string') {
      // Check if it looks like encrypted data (base64 format)
      if (obj.entity_phone.includes('+') || obj.entity_phone.includes('/') || obj.entity_phone.length > 100) {
        obj.entity_phone = decrypt(obj.entity_phone);
      }
    }
  } catch (e) {
    // If decryption fails, leave the value as-is
    console.warn('Decryption failed:', e);
  }
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export type RequestDoc = mongoose.Document & {
  hub_location: string;
};

export const RequestModel = mongoose.models.requests || model("requests", RequestSchema);
