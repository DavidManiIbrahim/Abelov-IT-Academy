import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new hub record
export const createRecord = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        const recordId = await ctx.db.insert("hubRecords", args);
        return recordId;
    },
});

// Get all records for a user
export const getRecordsByUser = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const records = await ctx.db
            .query("hubRecords")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .collect();

        return records.map((record) => ({
            ...record,
            id: record._id,
            created_at: new Date(record._creationTime).toISOString(),
            updated_at: new Date(record._creationTime).toISOString(),
        }));
    },
});

// Get a single record by ID
export const getRecordById = query({
    args: {
        recordId: v.id("hubRecords"),
    },
    handler: async (ctx, args) => {
        const record = await ctx.db.get(args.recordId);

        if (!record) {
            return null;
        }

        return {
            ...record,
            id: record._id,
            created_at: new Date(record._creationTime).toISOString(),
            updated_at: new Date(record._creationTime).toISOString(),
        };
    },
});

// Update a record
export const updateRecord = mutation({
    args: {
        recordId: v.id("hubRecords"),
        hub_location: v.optional(v.string()),
        recorder_name: v.optional(v.string()),
        entry_date: v.optional(v.string()),
        entity_name: v.optional(v.string()),
        entity_phone: v.optional(v.string()),
        entity_email: v.optional(v.string()),
        entity_address: v.optional(v.string()),
        product_name: v.optional(v.string()),
        product_category: v.optional(
            v.union(
                v.literal("Electronics"),
                v.literal("Consumer Goods"),
                v.literal("Industrial"),
                v.literal("Other"),
                v.literal("Student"),
                v.literal("Internet")
            )
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
        status: v.optional(
            v.union(
                v.literal("Pending"),
                v.literal("In-Transit"),
                v.literal("Received"),
                v.literal("Verified"),
                v.literal("Sold"),
                v.literal("Damaged"),
                v.literal("Active"),
                v.literal("Completed")
            )
        ),
        processing_fee: v.optional(v.number()),
        additional_cost: v.optional(v.number()),
        total_value: v.optional(v.number()),
        amount_paid: v.optional(v.number()),
        balance: v.optional(v.number()),
        transaction_completed: v.optional(v.boolean()),
        is_dispatched: v.optional(v.boolean()),
        log_timeline: v.optional(
            v.array(
                v.object({
                    step: v.string(),
                    date: v.string(),
                    note: v.string(),
                    status: v.string(),
                })
            )
        ),
        verification_confirmation: v.optional(
            v.object({
                verified: v.boolean(),
                verifier_name: v.optional(v.string()),
            })
        ),
        product_photo: v.optional(v.union(v.string(), v.null())),
    },
    handler: async (ctx, args) => {
        const { recordId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(recordId, cleanUpdates);
        return recordId;
    },
});

// Delete a record
export const deleteRecord = mutation({
    args: {
        recordId: v.id("hubRecords"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.recordId);
        return { success: true };
    },
});

// Search records
export const searchRecords = query({
    args: {
        userId: v.id("users"),
        searchQuery: v.string(),
    },
    handler: async (ctx, args) => {
        const allRecords = await ctx.db
            .query("hubRecords")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .collect();

        const query = args.searchQuery.toLowerCase();

        const filtered = allRecords.filter((record) => {
            return (
                record.entity_name?.toLowerCase().includes(query) ||
                record.entity_phone?.toLowerCase().includes(query) ||
                record.product_name?.toLowerCase().includes(query) ||
                record.serial_number?.toLowerCase().includes(query) ||
                record.batch_sku?.toLowerCase().includes(query) ||
                record.status?.toLowerCase().includes(query) ||
                record._id.toLowerCase().includes(query)
            );
        });

        return filtered.map((record) => ({
            ...record,
            id: record._id,
            created_at: new Date(record._creationTime).toISOString(),
            updated_at: new Date(record._creationTime).toISOString(),
        }));
    },
});

// Get records by status
export const getRecordsByStatus = query({
    args: {
        userId: v.id("users"),
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
    },
    handler: async (ctx, args) => {
        const records = await ctx.db
            .query("hubRecords")
            .withIndex("by_user_and_status", (q) =>
                q.eq("user_id", args.userId).eq("status", args.status)
            )
            .collect();

        return records.map((record) => ({
            ...record,
            id: record._id,
            created_at: new Date(record._creationTime).toISOString(),
            updated_at: new Date(record._creationTime).toISOString(),
        }));
    },
});

// Get statistics
export const getStats = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const records = await ctx.db
            .query("hubRecords")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .collect();

        const totalRecords = records.length;
        const completedRecords = records.filter(
            (r) => r.status === "Verified" || r.status === "Sold" || r.status === "Completed"
        ).length;
        const pendingRecords = records.filter((r) => r.status === "Pending").length;
        const inTransitRecords = records.filter(
            (r) => r.status === "In-Transit" || r.status === "Active"
        ).length;
        const totalRevenue = records.reduce((sum, r) => sum + r.amount_paid, 0);
        const outstandingBalance = records.reduce((sum, r) => sum + r.balance, 0);

        return {
            totalRecords,
            completedRecords,
            pendingRecords,
            inTransitRecords,
            totalRevenue,
            outstandingBalance,
        };
    },
});
