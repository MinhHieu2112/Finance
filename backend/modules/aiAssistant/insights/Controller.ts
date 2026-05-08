import { type NextFunction, type Request, type Response } from 'express';
import insightsService from './Service';
import { Types } from 'mongoose';

// Tổng hợp và phân tích dữ liệu để cung cấp các lời khuyên tài chính chuyên sâu (Insights).
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
