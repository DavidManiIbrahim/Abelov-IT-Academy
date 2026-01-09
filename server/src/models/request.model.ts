import mongoose from 'mongoose';

const hubRecordSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    hub_location: String,
    recorder_name: String,
    entry_date: String,
    entity_name: { type: String, required: true, index: true },
    entity_phone: { type: String, required: true, index: true },
    entity_email: String,
    entity_address: String,
    product_name: String,
    product_category: {
        type: String,
        enum: ["Electronics", "Consumer Goods", "Industrial", "Other"],
        default: "Other"
    },
    batch_sku: String,
    serial_number: { type: String, index: true },
    specifications: String,
    accessories_notes: String,
    record_description: String,
    verification_date: String,
    verification_staff: String,
    quality_check: String,
    materials_notes: String,
    action_taken: String,
    status: {
        type: String,
        enum: ["Pending", "In-Transit", "Received", "Verified", "Sold", "Damaged"],
        default: "Pending",
        index: true
    },
    processing_fee: { type: Number, default: 0 },
    additional_cost: { type: Number, default: 0 },
    total_value: { type: Number, default: 0 },
    amount_paid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    transaction_completed: { type: Boolean, default: false },
    is_dispatched: { type: Boolean, default: false },
    log_timeline: [{
        step: String,
        date: String,
        note: String,
        status: String
    }],
    verification_confirmation: {
        verified: { type: Boolean, default: false },
        verifier_name: String
    },
    product_photo: String
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite index for common dashboard queries
hubRecordSchema.index({ status: 1, created_at: -1 });

const HubRecord = mongoose.model('HubRecord', hubRecordSchema);
export default HubRecord;
