import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { validateBody } from '../middleware/validate';
import { LoginSchema } from '../schemas';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', validateBody(LoginSchema), (req: Request, res: Response) => {
  const db = getDb();
  const { username, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as
    | { id: number; username: string; password_hash: string; role: 'admin' | 'viewer' }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  res.json({
    message: 'Login successful',
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me — current session
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.session.user });
});

export default router;
