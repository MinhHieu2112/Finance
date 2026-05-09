import express from 'express';
import register from '../modules/Users/register/Controller';
import login from '../modules/Users/login/Controller';
import changePassword from '../modules/Users/changePassword/Controller';
import auth from '../middleware/Auth';
import { createRateLimiter } from '../middleware/rateLimit';

const userRouter = express.Router();

userRouter
	.route('/register')
	.post(register);

userRouter
	.route('/login')
	.post(createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), login);

userRouter
	.route('/change-password')
	.put(auth, changePassword);

userRouter.post('/forgot-password/request', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), (req, res, next) => {
    import('../modules/Users/forgotPassword/Controller').then(m => m.default.requestReset(req, res, next));
});

userRouter.post('/forgot-password/reset', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), (req, res, next) => {
    import('../modules/Users/forgotPassword/Controller').then(m => m.default.resetPassword(req, res, next));
});

export default userRouter;
