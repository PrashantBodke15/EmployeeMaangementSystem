import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { createToken, isAdmin, normalizeRole, verifyToken } from './auth.js';
import Employee from './models/Employee.js';
import User from './models/User.js';

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const authRequired = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (allowedRoles) => (req, res, next) => {
  const role = normalizeRole(req.user?.role);
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ message: 'This action requires admin access.' });
  }
  next();
};

const fields = ['firstName', 'lastName', 'email', 'phone', 'department', 'role', 'location', 'startDate', 'salary'];
const validateEmployee = (body) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) return `Required fields: ${missing.join(', ')}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return 'Enter a valid email address.';
  if (!Number.isFinite(Number(body.salary)) || Number(body.salary) < 0) return 'Salary must be a non-negative number.';
  if (Number.isNaN(Date.parse(body.startDate))) return 'Enter a valid start date.';
  return null;
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { fullName, email, password, role = 'user' } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedRole = normalizeRole(role);
    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      fullName,
      email: String(email).toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: normalizedRole
    });

    const token = createToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);
    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ id: user._id, fullName: user.fullName, email: user.email, role: user.role });
  } catch (error) {
    next(error);
  }
});

app.get('/api/employees', authRequired, async (req, res, next) => {
  try {
    const { q = '', department = '', status = '' } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (q) {
      const safeQuery = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['firstName', 'lastName', 'email', 'role'].map((field) => ({ [field]: new RegExp(safeQuery, 'i') }));
    }
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

app.get('/api/employees/:id', authRequired, async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

app.post('/api/employees', authRequired, requireRole(['admin']), async (req, res, next) => {
  const validationError = validateEmployee(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
});

app.put('/api/employees/:id', authRequired, requireRole(['admin']), async (req, res, next) => {
  const validationError = validateEmployee(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/employees/:id', authRequired, requireRole(['admin']), async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'An employee with this email already exists.' });
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_hub');
  app.listen(port, () => console.log(`Employee API listening on http://localhost:${port}`));
} catch (error) {
  console.error('Could not connect to MongoDB. Check MONGODB_URI and make sure MongoDB is running.', error.message);
  process.exit(1);
}
