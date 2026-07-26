import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  pingInterval: { type: Number, default: 10, min: 5 },
  lastStatus: { type: Number, default: 0 },
  lastChecked: { type: Date },
  lastResponseTimeMs: { type: Number, default: 0 },
  isDown: { type: Boolean, default: false },
  notifyTelegram: { type: Boolean, default: false },
  notifyEmail: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);