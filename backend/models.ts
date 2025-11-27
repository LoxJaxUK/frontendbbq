import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'kitchen', 'service'], 
    default: 'service' 
  },
  jobPosition: { type: String }, // e.g. "Bếp chính", "Chạy bàn"
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  role: { type: String, enum: ['kitchen', 'service'], required: true }, // Nhóm việc
  deadline: { type: String }, // Format "HH:mm" (24h)
  status: { 
    type: String, 
    enum: ['pending', 'done', 'late'], 
    default: 'pending' 
  },
  isCompleted: { type: Boolean, default: false },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
  image: { type: String }, // Base64 image
}, { timestamps: true });

const logSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ruleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  updatedBy: { type: String }
}, { timestamps: true });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Task = mongoose.model('Task', taskSchema);
export const Log = mongoose.model('Log', logSchema);
export const Rule = mongoose.model('Rule', ruleSchema);
export const Video = mongoose.model('Video', videoSchema);