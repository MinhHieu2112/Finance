import { type NextFunction, type Request, type Response } from 'express';
import AppError from '../../../utils/appError';
import MCP_toolsServiec from './Serviec';

const mcp_tools = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const prompt   = req.body.prompt;
		const file 	   = req.file?.path;

		const result   = await MCP_toolsServiec.handlePrompt(authUser.id, prompt, file);

		res.status(200).json({
			success: true,
			result,
		});
	} catch (error) {
		next(error);
	}
};

export { mcp_tools };
