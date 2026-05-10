import { type Request, type Response, type NextFunction } from 'express';
import summaryService from './Service';

const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const authUser = res.locals.authUser;
        const months = Number(_req.query.months) || 6;
        
        const summary = await summaryService.getSummary(authUser.id, months);

        res.status(200).json({
            success: true,
            message: 'Tải báo cáo tóm tắt tài chính thành công',
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

export default { getSummary };
