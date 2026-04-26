import { Router, Request, Response } from 'express';
import { mockAssistant } from '../utils';

export const assistantRouter = Router();

assistantRouter.post('/', (req: Request, res: Response) => {
  const { assetType, description, imageName } = req.body;

  if (!assetType || !description) {
    return res.status(400).json({ error: 'assetType and description are required' });
  }

  const suggestions = mockAssistant(assetType, description, imageName);
  return res.json({
    ...suggestions,
    disclaimer: 'AI suggestions support the engineer. Final risk assessment is manual and supervisor-reviewed.',
  });
});
