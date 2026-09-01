import express from 'express';

export function verifyApiKey( req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY ){
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}