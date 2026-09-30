import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  salary: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Active', 'On leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
