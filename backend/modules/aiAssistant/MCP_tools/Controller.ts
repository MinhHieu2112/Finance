import { type NextFunction, type Request, type Response } from 'express';
import MCP_toolsServiec from './Service';

const mcp_tools = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const prompt   = req.body.prompt;
		const file     = req.file?.buffer;

		const result   = await MCP_toolsServiec.handlePrompt(authUser.id, prompt, file);
		console.log('Output:', JSON.stringify(result, null, 2));
		res.status(200).json({
			success: true,
			message: 'Prompt processed successfully',
			result,
		});
	} catch (error) {
		next(error);
	}
};

export { mcp_tools };
