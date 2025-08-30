import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';

export function requireRoles(...roles: string[]) {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		if (!roles.includes(req.user.role)) {
			res.status(403).json({ message: 'Forbidden' });
			return;
		}
		next();
	};
}
