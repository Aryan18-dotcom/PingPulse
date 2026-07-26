import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Expires automatically in 10 minutes (600s)
});

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);