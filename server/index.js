import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import Employee from './models/Employee.js';

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

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

app.get('/api/employees', async (req, res, next) => {
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

app.get('/api/employees/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

app.post('/api/employees', async (req, res, next) => {
  const validationError = validateEmployee(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
});

app.put('/api/employees/:id', async (req, res, next) => {
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

app.delete('/api/employees/:id', async (req, res, next) => {
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
