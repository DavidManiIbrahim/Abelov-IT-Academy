import { Response } from 'express';
import User from '../models/user.model.js';
import HubRecord from '../models/request.model.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find().select('-password');
        // Map users to include some stats if needed
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const recordCount = await HubRecord.countDocuments({ user_id: user._id });
            return {
                ...user.toObject(),
                roles: [user.role],
                record_count: recordCount
            };
        }));
        res.json(usersWithStats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { status, limit = 100, offset = 0 } = req.query;
        const filter: any = {};
        if (status) filter.status = status;

        const requests = await HubRecord.find(filter)
            .sort({ created_at: -1 })
            .skip(Number(offset))
            .limit(Number(limit));

        const total = await HubRecord.countDocuments(filter);

        res.json({
            requests,
            total
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getGlobalStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTickets = await HubRecord.countDocuments();
        const pendingTickets = await HubRecord.countDocuments({ status: 'Pending' });
        const completedTickets = await HubRecord.countDocuments({ status: { $in: ['Sold', 'Verified'] } });
        const inProgressTickets = await HubRecord.countDocuments({ status: { $in: ['In-Transit', 'Received'] } });

        // Revenue calculation
        const revenueResult = await HubRecord.aggregate([
            { $group: { _id: null, total: { $sum: "$amount_paid" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        res.json({
            totalUsers,
            totalTickets,
            pendingTickets,
            completedTickets,
            inProgressTickets,
            onHoldTickets: 0, // Not explicitly defined in status enum but could be added
            totalRevenue
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;

        const user = await User.findByIdAndUpdate(userId, { is_active }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
