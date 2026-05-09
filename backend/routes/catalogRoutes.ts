import express from 'express';
import auth from '../middleware/Auth';
import listCatalog from '../modules/Catalogs/listCatalog/Controller';

const catalogRouter = express.Router();

catalogRouter.use(auth);

catalogRouter
	.route('/list')
	.get(listCatalog);

export default catalogRouter;
