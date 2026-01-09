import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = new User({ email, password, role: role || 'user' });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, env.AUTH_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                roles: [user.role],
                user_metadata: user.user_metadata
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await (user as any).comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, env.AUTH_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                roles: [user.role],
                user_metadata: user.user_metadata
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const me = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            id: user._id,
            email: user.email,
            roles: [user.role],
            user_metadata: user.user_metadata
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
