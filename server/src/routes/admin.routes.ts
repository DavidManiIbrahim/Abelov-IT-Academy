import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/requests', adminController.getAllRequests);
router.get('/stats', adminController.getGlobalStats);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.post('/users/:userId/roles', adminController.updateUserRole); // Frontend uses POST for role assignment

export default router;
