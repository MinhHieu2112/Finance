import express from 'express';
import register from '../modules/Users/register/Controller';
import login from '../modules/Users/login/Controller';
import changePassword from '../modules/Users/changePassword/Controller';
import auth from '../middleware/Auth';

const userRouter = express.Router();

userRouter
	.route('/register')
	.post(register);

userRouter
	.route('/login')
	.post(login);

userRouter
	.route('/change-password')
	.put(auth, changePassword);

userRouter.post('/forgot-password/request', (req, res, next) => {
    import('../modules/Users/forgotPassword/Controller').then(m => m.default.requestReset(req, res, next));
});

userRouter.post('/forgot-password/reset', (req, res, next) => {
    import('../modules/Users/forgotPassword/Controller').then(m => m.default.resetPassword(req, res, next));
});

export default userRouter;
