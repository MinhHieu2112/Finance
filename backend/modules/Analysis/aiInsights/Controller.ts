import { type NextFunction, type Request, type Response } from 'express';
import insightsService from './Service';
import { Types } from 'mongoose';

// Lớp giao diện gọi đến AI hoặc phân tích tài chính dựa trên thuật toán.
const getInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authUser = res.locals.authUser;
        const result = await insightsService.generateInsights(new Types.ObjectId(authUser.id));

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export { getInsights };
