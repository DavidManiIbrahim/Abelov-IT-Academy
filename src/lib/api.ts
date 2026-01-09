// Convex API Client - replaces REST API calls with Convex mutations and queries
// This file provides a compatibility layer so existing code can work with minimal changes

import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { HubRecord } from "@/types/database";

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is not set. Run 'npx convex dev' to get your URL.");
}

export const convex = new ConvexReactClient(convexUrl);

// Helper to get current user ID from localStorage
const getCurrentUserId = (): Id<"users"> | null => {
  const userId = localStorage.getItem("userId");
  return userId as Id<"users"> | null;
};

// Service Request API - Now using Convex
export const serviceRequestAPI = {
  async create(request: Omit<HubRecord, "id" | "created_at" | "updated_at">) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    const recordId = await convex.mutation(api.hubRecords.createRecord, {
      ...request,
      user_id: userId,
      product_category: request.product_category || "Other",
      status: request.status || "Pending",
      processing_fee: request.processing_fee || 0,
      additional_cost: request.additional_cost || 0,
      total_value: request.total_value || 0,
      amount_paid: request.amount_paid || 0,
      balance: request.balance || 0,
      transaction_completed: request.transaction_completed || false,
      log_timeline: request.log_timeline || [],
      verification_confirmation: request.verification_confirmation || {
        verified: false,
      },
    });

    // Fetch the created record
    const record = await convex.query(api.hubRecords.getRecordById, {
      recordId,
    });

    return record as HubRecord;
  },

  async getById(id: string) {
    const record = await convex.query(api.hubRecords.getRecordById, {
      recordId: id as Id<"hubRecords">,
    });
    return record as HubRecord | null;
  },

  async getByUserId(userId: string) {
    const records = await convex.query(api.hubRecords.getRecordsByUser, {
      userId: userId as Id<"users">,
    });
    return records as HubRecord[];
  },

  async update(id: string, updates: Partial<HubRecord>) {
    await convex.mutation(api.hubRecords.updateRecord, {
      recordId: id as Id<"hubRecords">,
      ...updates,
    });

    // Fetch the updated record
    const record = await convex.query(api.hubRecords.getRecordById, {
      recordId: id as Id<"hubRecords">,
    });

    return record as HubRecord;
  },

  async delete(id: string) {
    await convex.mutation(api.hubRecords.deleteRecord, {
      recordId: id as Id<"hubRecords">,
    });
  },

  async search(userId: string, query: string) {
    const records = await convex.query(api.hubRecords.searchRecords, {
      userId: userId as Id<"users">,
      searchQuery: query,
    });
    return records as HubRecord[];
  },

  async getByStatus(userId: string, status: string) {
    const records = await convex.query(api.hubRecords.getRecordsByStatus, {
      userId: userId as Id<"users">,
      status: status as any,
    });
    return records as HubRecord[];
  },

  async getStats(userId: string) {
    const stats = await convex.query(api.hubRecords.getStats, {
      userId: userId as Id<"users">,
    });
    return {
      total: stats.totalRecords,
      completed: stats.completedRecords,
      pending: stats.pendingRecords,
      inProgress: stats.inTransitRecords,
      totalRevenue: stats.totalRevenue,
      outstandingBalance: stats.outstandingBalance,
    };
  },
};

// Auth API - Now using Convex
export const authAPI = {
  async signup(email: string, password: string, name?: string) {
    const result = await convex.mutation(api.auth.register, {
      email,
      password,
      name,
    });

    // Store user ID in localStorage
    localStorage.setItem("userId", result.userId);
    localStorage.setItem("userEmail", result.email);
    if (result.name) {
      localStorage.setItem("userName", result.name);
    }

    return {
      id: result.userId,
      email: result.email,
      user_metadata: {
        name: result.name,
      },
    };
  },

  async login(email: string, password: string) {
    const result = await convex.mutation(api.auth.login, {
      email,
      password,
    });

    // Store user ID in localStorage
    localStorage.setItem("userId", result.userId);
    localStorage.setItem("userEmail", result.email);
    if (result.name) {
      localStorage.setItem("userName", result.name);
    }

    return {
      id: result.userId,
      email: result.email,
      user_metadata: {
        name: result.name,
      },
    };
  },

  async me() {
    const userId = getCurrentUserId();
    if (!userId) return null;

    const user = await convex.query(api.auth.getCurrentUser, {
      userId,
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      user_metadata: {
        name: user.name,
        role: user.role,
      },
    };
  },

  async logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
  },

  async updateProfile(data: { username?: string; profile_image?: string }) {
    // TODO: Implement profile update in Convex
    console.warn("Profile update not yet implemented in Convex");
    return null;
  },
};

// Admin API - Placeholder (to be implemented)
export const adminAPI = {
  async getAllUsersWithStats() {
    // TODO: Implement admin functions in Convex
    console.warn("Admin API not yet implemented in Convex");
    return [];
  },

  async getAllServiceRequests(limit = 100, offset = 0) {
    console.warn("Admin API not yet implemented in Convex");
    return { records: [], total: 0 };
  },

  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    console.warn("Admin API not yet implemented in Convex");
    return { records: [], total: 0 };
  },

  async getActivityLogs(limit = 50, offset = 0) {
    console.warn("Admin API not yet implemented in Convex");
    return { logs: [], total: 0 };
  },

  async getGlobalStats() {
    console.warn("Admin API not yet implemented in Convex");
    return {
      totalUsers: 0,
      totalTickets: 0,
      soldTickets: 0,
      pendingTickets: 0,
      completedTickets: 0,
      inProgressTickets: 0,
      onHoldTickets: 0,
      totalRevenue: 0,
    };
  },

  async searchRequests(query: string, limit = 50, offset = 0) {
    console.warn("Admin API not yet implemented in Convex");
    return { records: [], total: 0 };
  },

  async getUserRoles(userId: string) {
    console.warn("Admin API not yet implemented in Convex");
    return [];
  },

  async assignRole(userId: string, role: string) {
    console.warn("Admin API not yet implemented in Convex");
    return null;
  },

  async removeRole(userId: string, role: string) {
    console.warn("Admin API not yet implemented in Convex");
    return null;
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    console.warn("Admin API not yet implemented in Convex");
    return null;
  },
};
