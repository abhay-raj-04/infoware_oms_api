import type { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';

const userService = new UserService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password || !role) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const validRoles = ['BUYER', 'SUPPLIER', 'ADMIN'];
      if (!validRoles.includes(role.toUpperCase())) {
        res.status(400).json({ message: 'Invalid role specified.' });
        return;
      }

      const authResponse = await userService.register({ username, email, password, role: role.toUpperCase() as any });
      res.status(201).json(authResponse);
    } catch (error: any) {
      const msg = error?.message ?? '';
      if (msg.includes('already exists') || msg.includes('Unique constraint failed')) {
        res.status(409).json({ message: msg });
      } else {
        next(error);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Missing email or password.' });
        return;
      }

      const authResponse = await userService.login({ email, password });
      res.status(200).json(authResponse);
    } catch (error: any) {
      if (error.message.includes('Invalid credentials')) {
        res.status(401).json({ message: error.message });
      } else {
        next(error);
      }
    }
  }
}
