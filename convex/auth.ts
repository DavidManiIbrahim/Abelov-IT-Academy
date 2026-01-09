import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to hash passwords (simple version - in production use bcrypt)
function hashPassword(password: string): string {
    // In production, use bcryptjs or similar
    // For now, this is a placeholder
    return password; // TODO: Implement proper hashing
}

function verifyPassword(password: string, hash: string): boolean {
    // In production, use bcryptjs.compare
    return password === hash; // TODO: Implement proper verification
}

// Register a new user
export const register = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("User already exists");
        }

        // Hash password
        const passwordHash = hashPassword(args.password);

        // Create user
        const userId = await ctx.db.insert("users", {
            email: args.email,
            passwordHash,
            name: args.name,
            role: "user",
        });

        return {
            userId,
            email: args.email,
            name: args.name,
        };
    },
});

// Login
export const login = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            throw new Error("Invalid credentials");
        }

        if (!verifyPassword(args.password, user.passwordHash)) {
            throw new Error("Invalid credentials");
        }

        return {
            userId: user._id,
            email: user.email,
            name: user.name,
        };
    },
});

// Get current user
export const getCurrentUser = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);

        if (!user) {
            return null;
        }

        return {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    },
});
