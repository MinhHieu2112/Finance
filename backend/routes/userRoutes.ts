import express from 'express';
import register from '../modules/Users/register/Controller';
import login from '../modules/Users/login/Controller';

const userRouter = express.Router();

userRouter
	.route('/register')
	.post(register);

userRouter
	.route('/login')
	.post(login);

export default userRouter;
