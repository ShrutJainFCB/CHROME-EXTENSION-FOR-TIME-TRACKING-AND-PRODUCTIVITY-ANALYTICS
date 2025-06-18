const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Log = require('./models/Log');
const classifyDomain = require('./utils/domainClassifier');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/timeTracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB connection error:'));
db.once('open', () => {
  console.log('🟢 Connected to MongoDB');
});

// Root Route
app.get('/', (req, res) => {
  res.send('✅ Backend server is running. This is the root route.');
});

// Log tracking data
app.post('/api/log', async (req, res) => {
  const { url, duration } = req.body;

  try {
    const category = classifyDomain(url);

    const newLog = new Log({
      url,
      duration,
      timestamp: new Date(),
      category
    });

    await newLog.save();
    res.status(200).json({ message: 'Log saved with category', category });
  } catch (err) {
    console.error('❌ Failed to save log:', err);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// Fetch all logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find({});
    res.status(200).json(logs);
  } catch (err) {
    console.error('❌ Failed to fetch logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Aggregate logs by day (sum duration per day)
app.get('/api/reports/daily', async (req, res) => {
  try {
    const dailyReport = await Log.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          totalDuration: { $sum: "$duration" },
          productiveDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "productive"] }, "$duration", 0] } 
          },
          unproductiveDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "unproductive"] }, "$duration", 0] } 
          },
          neutralDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "neutral"] }, "$duration", 0] } 
          },
          unknownDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "unknown"] }, "$duration", 0] } 
          }
        }
      },
      { $sort: { _id: 1 } }  // sort by date ascending
    ]);
    res.status(200).json(dailyReport);
  } catch (err) {
    console.error('❌ Failed to fetch daily report:', err);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

// Aggregate logs by week (sum duration per week)
app.get('/api/reports/weekly', async (req, res) => {
  try {
    const weeklyReport = await Log.aggregate([
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$timestamp" },
            week: { $isoWeek: "$timestamp" }
          },
          totalDuration: { $sum: "$duration" },
          productiveDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "productive"] }, "$duration", 0] } 
          },
          unproductiveDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "unproductive"] }, "$duration", 0] } 
          },
          neutralDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "neutral"] }, "$duration", 0] } 
          },
          unknownDuration: { 
            $sum: { $cond: [{ $eq: ["$category", "unknown"] }, "$duration", 0] } 
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }  // sort by year/week ascending
    ]);
    res.status(200).json(weeklyReport);
  } catch (err) {
    console.error('❌ Failed to fetch weekly report:', err);
    res.status(500).json({ error: 'Failed to fetch weekly report' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

