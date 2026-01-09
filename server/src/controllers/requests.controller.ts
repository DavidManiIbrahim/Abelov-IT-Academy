import { Response } from 'express';
import HubRecord from '../models/request.model.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const createRequest = async (req: AuthRequest, res: Response) => {
    try {
        const record = new HubRecord({
            ...req.body,
            user_id: req.user?.id
        });
        await record.save();
        res.status(201).json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { user_id, status } = req.query;
        const filter: any = {};

        if (user_id) filter.user_id = user_id;
        else if (req.user?.role !== 'admin') filter.user_id = req.user?.id;

        if (status) filter.status = status;

        const records = await HubRecord.find(filter).sort({ created_at: -1 });
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRequestById = async (req: AuthRequest, res: Response) => {
    try {
        const record = await HubRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });

        // Authorization check
        if (req.user?.role !== 'admin' && record.user_id.toString() !== req.user?.id) {
            return res.status(403).json({ error: 'Not authorized to view this record' });
        }

        res.json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateRequest = async (req: AuthRequest, res: Response) => {
    try {
        const record = await HubRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });

        // Authorization check
        if (req.user?.role !== 'admin' && record.user_id.toString() !== req.user?.id) {
            return res.status(403).json({ error: 'Not authorized to update this record' });
        }

        Object.assign(record, req.body);
        await record.save();
        res.json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteRequest = async (req: AuthRequest, res: Response) => {
    try {
        const record = await HubRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });

        // Authorization check
        if (req.user?.role !== 'admin' && record.user_id.toString() !== req.user?.id) {
            return res.status(403).json({ error: 'Not authorized to delete this record' });
        }

        await record.deleteOne();
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const searchRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { user_id, q } = req.query;
        const filter: any = {};

        if (user_id) filter.user_id = user_id;
        else if (req.user?.role !== 'admin') filter.user_id = req.user?.id;

        if (q) {
            filter.$or = [
                { entity_name: { $regex: q, $options: 'i' } },
                { entity_phone: { $regex: q, $options: 'i' } },
                { product_name: { $regex: q, $options: 'i' } },
                { serial_number: { $regex: q, $options: 'i' } }
            ];
        }

        const records = await HubRecord.find(filter).sort({ created_at: -1 });
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        // Authorization check
        if (req.user?.role !== 'admin' && userId !== req.user?.id) {
            return res.status(403).json({ error: 'Not authorized to view these stats' });
        }

        const records = await HubRecord.find({ user_id: userId });

        const stats = {
            total: records.length,
            completed: records.filter(r => r.status === 'Sold' || r.status === 'Verified').length,
            pending: records.filter(r => r.status === 'Pending').length,
            inProgress: records.filter(r => r.status === 'In-Transit' || r.status === 'Received').length,
            totalRevenue: records.reduce((acc, r) => acc + (r.amount_paid || 0), 0)
        };

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
