import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  telegram: {
    botToken: { type: String, default: '' },
    chatId: { type: String, default: '' },
  },
  email: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    recipientEmail: { type: String, default: '' },
  },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);