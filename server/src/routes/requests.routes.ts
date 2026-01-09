import { Router } from 'express';
import * as requestsController from '../controllers/requests.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', requestsController.createRequest);
router.get('/', requestsController.getRequests);
router.get('/search', requestsController.searchRequests);
router.get('/stats/:userId', requestsController.getStats);
router.get('/:id', requestsController.getRequestById);
router.put('/:id', requestsController.updateRequest);
router.delete('/:id', requestsController.deleteRequest);

export default router;
