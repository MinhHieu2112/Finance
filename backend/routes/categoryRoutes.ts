import express from 'express';
import auth from '../middleware/Auth';
import addCategory from '../modules/Categories/addCategory/Controller';
import listCategory from '../modules/Categories/listCategory/Controller';
import editCategory from '../modules/Categories/editCategory/Controller';
import deleteCategory from '../modules/Categories/deleteCategory/Controller';

const categoryRouter = express.Router();

categoryRouter.use(auth);

categoryRouter
	.route('/list')
	.get(listCategory);

categoryRouter
	.route('/add')
	.post(addCategory);

categoryRouter
	.route('/edit/:id')
	.put(editCategory);

categoryRouter
	.route('/delete/:id')
	.delete(deleteCategory);

export default categoryRouter;
