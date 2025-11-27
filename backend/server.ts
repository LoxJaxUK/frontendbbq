import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Task, Log, Rule, Video } from './models';
import { seedDatabase } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

app.use(cors());
// Increase payload limit for Base64 images
app.use(express.json({ limit: '10mb' }) as any);

// --- Database Connection ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@phobbq.0wptjws.mongodb.net/?appName=phobbq';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await seedDatabase();
    }
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
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

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: "Admin access required" });
  next();
};

// --- Routes ---

// AUTH
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database connecting...' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email không tồn tại' });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ message: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, jobPosition: user.jobPosition } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/seed', async (req, res) => {
    await seedDatabase();
    res.json({ message: "Reset Database Complete" });
});

// TASKS
app.get('/api/tasks', authenticateToken, async (req: any, res) => {
  try {
    let filter: any = {};
    // Kitchen/Service only see their own tasks. Admin/Manager see all (or filtered by query)
    if (req.user.role === 'kitchen') filter.role = 'kitchen';
    else if (req.user.role === 'service') filter.role = 'service';
    else if (req.query.role) filter.role = req.query.role;

    const tasks = await Task.find(filter).populate('completedBy', 'name');
    
    // Logic to determine status if not completed but deadline passed
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMinute;

    const formatted = tasks.map(t => {
      let computedStatus = t.status;
      
      // Auto-calculate LATE if pending and deadline passed
      if (!t.isCompleted && t.deadline) {
         const [h, m] = t.deadline.split(':').map(Number);
         const deadlineVal = h * 60 + m;
         if (currentTimeVal > deadlineVal) {
             computedStatus = 'late';
         }
      } else if (t.isCompleted) {
        computedStatus = 'done';
      }

      return {
        id: t._id,
        title: t.title,
        description: t.description,
        role: t.role,
        deadline: t.deadline,
        status: computedStatus,
        isCompleted: t.isCompleted,
        completedBy: t.completedBy ? (t.completedBy as any)._id : null,
        completedByName: t.completedBy ? (t.completedBy as any).name : null,
        completedAt: t.completedAt,
        image: t.image
      };
    });
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/toggle', authenticateToken, async (req: any, res) => {
  try {
    const { isCompleted, image } = req.body;
    const update: any = {
      isCompleted,
      completedBy: isCompleted ? req.user.id : null,
      completedAt: isCompleted ? new Date() : null,
      status: isCompleted ? 'done' : 'pending' // Simplified status logic on toggle
    };
    if (image) update.image = image; // Update image if provided
    
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true });
    
    if (task) {
      await Log.create({
        taskId: task._id,
        userId: req.user.id,
        action: image ? 'upload_image' : (isCompleted ? 'complete' : 'undo'),
        timestamp: new Date()
      });
    }
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Create Task (Manual)
app.post('/api/tasks', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
        const task = await Task.create(req.body);
        res.json(task);
    } catch (err: any) { res.status(500).json({error: err.message}); }
});

// ADMIN: Import JSON (Simulated Excel Import)
app.post('/api/tasks/import', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
        // Expecting body: { tasks: [{ title, role, deadline... }] }
        await Task.insertMany(req.body.tasks);
        res.json({ message: "Imported successfully" });
    } catch (err: any) { res.status(500).json({error: err.message}); }
});

// STATS
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ isCompleted: true });
    // Note: Late tasks calculation is tricky in DB without a cron, 
    // for now we approximate pending tasks with passed deadlines could be queried
    // but simpler to just count completed.
    const lateTasks = 0; // Placeholder, calculated on frontend for now

    const userStats = await Task.aggregate([
      { $match: { isCompleted: true } },
      { $group: { _id: "$completedBy", count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { name: "$user.name", count: 1 } }
    ]);

    const hourStats = await Task.aggregate([
        { $match: { isCompleted: true, completedAt: { $exists: true } } },
        { $project: { hour: { $hour: { date: "$completedAt", timezone: "+07" } } } },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]).then(res => res.map(r => ({ hour: `${r._id}h`, count: r.count })));

    res.json({
      totalTasks,
      completedTasks,
      lateTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      byUser: userStats,
      byHour: hourStats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LOGS
app.get('/api/logs', authenticateToken, async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).limit(100)
    .populate('userId', 'name').populate('taskId', 'title');
  res.json(logs.map(l => ({
    id: l._id,
    taskTitle: (l.taskId as any)?.title || 'Unknown',
    userName: (l.userId as any)?.name || 'Unknown',
    action: l.action,
    timestamp: l.timestamp
  })));
});

// RULES
app.get('/api/rules', authenticateToken, async (req, res) => {
    const rules = await Rule.find();
    res.json(rules);
});

app.put('/api/rules', authenticateToken, requireAdmin, async (req: any, res) => {
    // Single Rule Doc for simplicity in this demo, or update by ID
    // We will assume "General Rule" is id-less or we wipe and recreate
    await Rule.deleteMany({});
    const rule = await Rule.create({ ...req.body, updatedBy: req.user.name });
    res.json(rule);
});

// VIDEOS
app.get('/api/videos', authenticateToken, async (req, res) => {
    const videos = await Video.find().sort({ order: 1 });
    res.json(videos);
});

app.post('/api/videos', authenticateToken, requireAdmin, async (req, res) => {
    const video = await Video.create(req.body);
    res.json(video);
});

app.delete('/api/videos/:id', authenticateToken, requireAdmin, async (req, res) => {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});