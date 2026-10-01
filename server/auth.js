import jwt from 'jsonwebtoken';

const defaultSecret = process.env.JWT_SECRET || 'employee-hub-secret';

export const normalizeRole = (role = 'user') => {
  const normalized = String(role || 'user').trim().toLowerCase();
  return normalized === 'admin' ? 'admin' : 'user';
};

export const isAdmin = (role) => normalizeRole(role) === 'admin';

export const createToken = (user, secret = defaultSecret) => jwt.sign({
  id: user._id ? String(user._id) : String(user.id),
  email: user.email,
  role: normalizeRole(user.role)
}, secret, { expiresIn: '7d' });

export const verifyToken = (token, secret = defaultSecret) => jwt.verify(token, secret);
