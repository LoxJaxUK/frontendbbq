import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Task, Log } from './models';
import { seedDatabase } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

app.use(cors());
app.use(express.json() as any);

// --- Database Connection ---
const connectDB = async () => {
  try {
    // Use the provided Atlas URI as the default fallback
    const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@phobbq.0wptjws.mongodb.net/?appName=phobbq';
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is empty (checked by user count)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database empty, seeding default data...');
      await seedDatabase();
    }

  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    // Do not exit process immediately, allow server to try running so frontend doesn't get Network Error immediately
    // (Though without DB, it won't work well, but it helps debugging)
  }
};

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database not connected yet' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email không tồn tại' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ message: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user._id, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
});

// Seed Endpoint (For demo convenience)
app.post('/api/seed', async (req, res) => {
    try {
        await seedDatabase();
        res.json({ message: "Database seeded successfully" });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// Get Tasks
app.get('/api/tasks', authenticateToken, async (req: any, res) => {
  try {
    const filter: any = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    const tasks = await Task.find(filter).populate('completedBy', 'name');
    
    // Map to frontend friendly format
    const formatted = tasks.map(t => ({
      id: t._id,
      title: t.title,
      description: t.description,
      department: t.department,
      shift: t.shift,
      isCompleted: t.isCompleted,
      completedBy: t.completedBy ? (t.completedBy as any)._id : null,
      completedByName: t.completedBy ? (t.completedBy as any).name : null,
      completedAt: t.completedAt,
      updatedAt: t.updatedAt
    }));
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Task & Log
app.post('/api/tasks/:id/toggle', authenticateToken, async (req: any, res) => {
  try {
    const { isCompleted } = req.body;
    const update = {
      isCompleted,
      completedBy: isCompleted ? req.user.id : null,
      completedAt: isCompleted ? new Date() : null
    };
    
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true });
    
    // Create Audit Log
    if (task) {
      await Log.create({
        taskId: task._id,
        userId: req.user.id,
        action: isCompleted ? 'complete' : 'undo',
        timestamp: new Date()
      });
    }

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ isCompleted: true });
    
    // Stats by User
    const userStats = await Task.aggregate([
      { $match: { isCompleted: true } },
      { $group: { _id: "$completedBy", count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { name: "$user.name", count: 1 } }
    ]);

    // Stats by Hour (Simple simulation of heatmap)
    const hourStats = await Task.aggregate([
        { $match: { isCompleted: true, completedAt: { $exists: true } } },
        { 
            $project: { 
                hour: { $hour: { date: "$completedAt", timezone: "+07" } } 
            } 
        },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]).then(res => res.map(r => ({ hour: `${r._id}h`, count: r.count })));

    res.json({
      totalTasks,
      completedTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      byUser: userStats,
      byHour: hourStats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('userId', 'name')
      .populate('taskId', 'title');
    
    const formatted = logs.map(l => ({
      id: l._id,
      taskId: (l.taskId as any)?._id,
      taskTitle: (l.taskId as any)?.title || 'Unknown Task',
      userName: (l.userId as any)?.name || 'Unknown',
      action: l.action,
      timestamp: l.timestamp
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});