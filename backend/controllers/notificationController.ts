import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import AppError from '../utils/appError';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authUser = res.locals.authUser;
        const notifications = await Notification.find({ userId: authUser.id })
            .sort({ createdAt: -1 })
            .limit(50); // Get latest 50 notifications

        res.status(200).json({
            status: 'success',
            data: notifications
        });
    } catch (err) {
        next(err);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authUser = res.locals.authUser;
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: authUser.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return next(new AppError('Notification not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: notification
        });
    } catch (err) {
        next(err);
    }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authUser = res.locals.authUser;
        await Notification.updateMany(
            { userId: authUser.id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (err) {
        next(err);
    }
};
