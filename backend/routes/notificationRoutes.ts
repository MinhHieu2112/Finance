import express from 'express';
import auth from '../middleware/Auth';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const notificationRouter = express.Router();

notificationRouter.use(auth);

notificationRouter
    .route('/')
    .get(getNotifications);

notificationRouter
    .route('/read-all')
    .put(markAllAsRead);

notificationRouter
    .route('/:id/read')
    .put(markAsRead);

export default notificationRouter;
