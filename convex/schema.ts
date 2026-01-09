import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        passwordHash: v.string(),
        name: v.optional(v.string()),
        role: v.optional(v.string()),
    }).index("by_email", ["email"]),

    hubRecords: defineTable({
        user_id: v.id("users"),
        hub_location: v.optional(v.string()),
        recorder_name: v.optional(v.string()),
        entry_date: v.optional(v.string()),
        entity_name: v.string(),
        entity_phone: v.string(),
        entity_email: v.optional(v.string()),
        entity_address: v.optional(v.string()),
        product_name: v.optional(v.string()),
        product_category: v.union(
            v.literal("Electronics"),
            v.literal("Consumer Goods"),
            v.literal("Industrial"),
            v.literal("Other"),
            v.literal("Student"),
            v.literal("Internet")
        ),
        batch_sku: v.optional(v.string()),
        serial_number: v.optional(v.string()),
        specifications: v.optional(v.string()),
        accessories_notes: v.optional(v.string()),
        record_description: v.optional(v.string()),
        verification_date: v.optional(v.string()),
        verification_staff: v.optional(v.string()),
        quality_check: v.optional(v.string()),
        materials_notes: v.optional(v.string()),
        action_taken: v.optional(v.string()),
        status: v.union(
            v.literal("Pending"),
            v.literal("In-Transit"),
            v.literal("Received"),
            v.literal("Verified"),
            v.literal("Sold"),
            v.literal("Damaged"),
            v.literal("Active"),
            v.literal("Completed")
        ),
        processing_fee: v.number(),
        additional_cost: v.number(),
        total_value: v.number(),
        amount_paid: v.number(),
        balance: v.number(),
        transaction_completed: v.boolean(),
        is_dispatched: v.optional(v.boolean()),
        log_timeline: v.array(
            v.object({
                step: v.string(),
                date: v.string(),
                note: v.string(),
                status: v.string(),
            })
        ),
        verification_confirmation: v.object({
            verified: v.boolean(),
            verifier_name: v.optional(v.string()),
        }),
        product_photo: v.optional(v.union(v.string(), v.null())),
    })
        .index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_user_and_status", ["user_id", "status"])
        .index("by_entity_name", ["entity_name"])
        .index("by_entity_phone", ["entity_phone"])
        .index("by_serial_number", ["serial_number"]),
});
