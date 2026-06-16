import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import fetch from 'node-fetch';
import https from 'https';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'rescue-mission-secret-key'; // In production, use env variable

// Anti-spam rate limiter for anonymous reports
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many reports submitted from this IP, please try again after 15 minutes' }
});

// Agent to bypass localtunnel SSL issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// For GitHub Codespaces, allow all origins in dev
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
  next();
});

// Auth Middleware
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

// --- AUTH ROUTES ---

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const info = stmt.run(email, hashedPassword);
    
    const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, email } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.role === 'admin' || user.role === 'rescuer') {
    return res.status(403).json({ error: 'Staff members must use the Staff Portal to log in.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/api/staff/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.role !== 'admin' && user.role !== 'rescuer') {
    return res.status(403).json({ error: 'Citizens are not authorized to access the Staff Portal.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// --- REPORT ROUTES ---

app.get('/api/reports/public-active', (req, res) => {
  try {
    const activeReports = db.prepare("SELECT id, title, description, location, latitude, longitude, status, animal_type, priority, created_at FROM reports WHERE status IN ('pending', 'verified', 'assigned', 'in-progress') ORDER BY created_at DESC").all();
    res.json(activeReports);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch active reports' });
  }
});

app.get('/api/reports', authenticateToken, (req: any, res) => {
  let reports;
  if (req.user.role === 'admin') {
    reports = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
  } else if (req.user.role === 'rescuer') {
    reports = db.prepare('SELECT * FROM reports WHERE assigned_to = ? OR status = "verified" ORDER BY created_at DESC').all(req.user.id);
  } else {
    reports = db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json(reports);
});

app.get('/api/logs', authenticateToken, (req: any, res) => {
  const logs = db.prepare('SELECT * FROM reports WHERE status = "resolved" ORDER BY created_at DESC').all();
  res.json(logs);
});

app.patch('/api/reports/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { status, priority, rejection_reason, assigned_to, title, description, location, animal_type } = req.body;
  
  if (status === 'resolved') {
    const rescuerId = req.user.id;
    const resCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE status = "resolved" AND assigned_to = ?').get(rescuerId) as any;
    if (resCount.count === 0) {
      db.prepare('INSERT INTO achievements (user_id, badge_name, icon) VALUES (?, ?, ?)').run(rescuerId, 'Elite Rescuer', 'shield');
    }
  }

  const updates: string[] = [];
  const params: any[] = [];

  const fields = { status, priority, rejection_reason, assigned_to, title, description, location, animal_type };
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE reports SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  
  res.json({ success: true });
});

app.post('/api/reports/anonymous', reportLimiter, (req: any, res) => {
  const { title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression } = req.body;
  
  if (!image_url || !latitude || !longitude) {
    return res.status(400).json({ error: 'Photo and location are required.' });
  }

  const stmt = db.prepare('INSERT INTO reports (user_id, title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression);

  res.json({ id: info.lastInsertRowid, success: true });
});

app.post('/api/reports', authenticateToken, (req: any, res) => {
  const { title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression } = req.body;
  const stmt = db.prepare('INSERT INTO reports (user_id, title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression);

  const userId = req.user.id;
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE user_id = ?').get(userId) as any;
  
  // Badge: First Responder
  if (reportCount.count === 1) {
    db.prepare('INSERT INTO achievements (user_id, badge_name, icon) VALUES (?, ?, ?)').run(userId, 'First Responder', 'medal');
  }
  
  // Badge: Vigilant Guardian
  if (reportCount.count === 5) {
    db.prepare('INSERT INTO achievements (user_id, badge_name, icon) VALUES (?, ?, ?)').run(userId, 'Vigilant Guardian', 'eye');
  }

  res.json({ id: info.lastInsertRowid });
});

// --- USER INFO ---
app.get('/api/me', authenticateToken, (req: any, res) => {
  const user: any = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.get('/api/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const users = db.prepare('SELECT id, email, role, created_at FROM users').all();
  res.json(users);
});

app.patch('/api/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { role } = req.body;
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ success: true });
});

app.delete('/api/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/reports/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- GAMIFICATION ROUTES ---
app.get('/api/achievements', authenticateToken, (req: any, res) => {
  const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(req.user.id);
  res.json(achievements);
});

// --- AI PROXY ROUTE ---
app.post('/api/ai/predict', reportLimiter, async (req: any, res) => {
  const { image, colabUrl } = req.body;
  
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`[Backend AI Proxy] Using Gemini API...`);
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "Analyze this animal image in detail. Output ONLY a JSON object with these exact keys: 'animal_type' (string, e.g. 'Dog', 'Cat', 'Bird', etc.), 'expression' (string, analyze their apparent mood/condition: Happy, Stressed, Scared, Aggressive, Neutral, Injured, Malnourished), 'confidence' (float 0.0-1.0), and 'description' (string, a detailed 2-3 sentence analysis of the animal's physical condition, environment, and apparent needs).";
      
      const imageParts = [
        {
          inlineData: {
            data: image.split(',')[1],
            mimeType: image.split(';')[0].split(':')[1]
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      } else {
        return res.json({ animal_type: 'Unknown', expression: 'Neutral', confidence: 0.5, description: 'AI was unable to process the image correctly.' });
      }
    } catch (e: any) {
      console.error("[Backend AI Proxy] Gemini Error:", e);
      return res.status(500).json({ error: 'Failed to analyze image with AI.' });
    }
  }

  // Fallback to colab or local mock
  if (colabUrl) {
    console.log(`[Backend AI Proxy] Received request for URL: ${colabUrl}`);
    try {
      const cleanUrl = colabUrl.replace(/\/$/, '');
      const payload = {
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this animal image in detail. Output ONLY a JSON object with these exact keys: 'animal_type' (string, e.g. 'Dog', 'Cat', 'Bird', etc.), 'expression' (string, analyze their apparent mood/condition: Happy, Stressed, Scared, Aggressive, Neutral, Injured, Malnourished), 'confidence' (float 0.0-1.0), and 'description' (string, a detailed 2-3 sentence analysis of the animal's physical condition, environment, and apparent needs)." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ]
      };

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 60000);

      const response = await fetch(`${cleanUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
          'User-Agent': 'SmartStrayRescue-Backend/1.0'
        },
        body: JSON.stringify(payload),
        agent: httpsAgent,
        signal: abortController.signal
      } as any);
      
      clearTimeout(timeoutId);
      const textResponse = await response.text();
      
      try {
        const data = JSON.parse(textResponse);
        if (data.choices && data.choices.length > 0) {
          const assistantMessage = data.choices[0].message.content;
          const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return res.json(JSON.parse(jsonMatch[0]));
          }
        }
      } catch (e) {}
    } catch (error: any) {
      console.error("[Backend AI Proxy] Connection Error:", error);
    }
  }

  // Local fallback mock
  const species = ['Dog', 'Cat'];
  const expressions = ['Happy', 'Stressed', 'Scared', 'Aggressive', 'Neutral'];
  return res.json({
    animal_type: species[Math.floor(Math.random() * species.length)],
    expression: expressions[Math.floor(Math.random() * expressions.length)],
    confidence: Number((0.85 + Math.random() * 0.14).toFixed(2)),
    description: "This is a fallback mock description. The AI service is currently running in local template mode and has detected an animal in the provided image."
  });
});

// Seed Default Admin User if none exists
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
if (userCount.count === 0) {
  console.log("Seeding default admin user...");
  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('admin@rescue.org', hashedAdminPassword, 'admin');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
