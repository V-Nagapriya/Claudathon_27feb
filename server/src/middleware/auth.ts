import { Request, Response, NextFunction } from 'express';

export interface SessionUser {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.user) {
    res.status(401).json({ error: 'Unauthorised — please log in' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.user) {
    res.status(401).json({ error: 'Unauthorised — please log in' });
    return;
  }
  if (req.session.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden — admin access required' });
    return;
  }
  next();
}
