import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import session from 'express-session'; // Import express-session

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Cache with a 30-minute TTL
const cache = new NodeCache({ stdTTL: 1800 });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      const db = mongoose.connection;
      await Promise.all([
        db.collection('users_students').createIndex({ created_at: 1 }),
        db.collection('tickets').createIndex({ status: 1, created_at: 1 }),
        db.collection('user_actions').createIndex({ action_date: 1 }),
      ]);
      console.log('Indexes ensured');
      warmCache();
    } catch (err) {
      console.error('Index creation error (non-fatal):', err.message);
    }
  })
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Define MongoDB models corresponding to your MySQL tables
const User = mongoose.model('User', new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    password: String,
    avatar: String,
    created_at: Date,
    class: String,
    gender: String,
    state: String,
    birth_year: Number
}));

const Setting = mongoose.model('Setting', new mongoose.Schema({
    key: String,
    value: String
}));

const Ticket = mongoose.model('Ticket', new mongoose.Schema({
    status: String,
    created_at: Date
}));

const UserAction = mongoose.model('UserAction', new mongoose.Schema({
    action_date: Date
}));

// Middleware to authenticate user and attach to req.user
app.use(async (req, res, next) => {
    const userId = req.session.userId; // Session-based auth

    if (userId) {
        try {
            const user = await User.findById(userId).select('first_name last_name email avatar');
            if (user) {
                req.user = user;
            } else {
                req.user = null;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (isPasswordValid) {
                req.session.userId = user._id; // Store the user ID in the session

                return res.json({
                    message: 'Login successful',
                    redirectTo: '/dashboard',
                    user: {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        avatar: user.avatar
                    }
                });
            } else {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await Setting.find();
        const settingsMap = {};
        settings.forEach(setting => {
            settingsMap[setting.key] = setting.value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to retrieve settings.' });
    }
});

// app.get('/api/dashboard-data', async (req, res) => {
//     try {
//         let { startDate, endDate } = req.query;

//         const userId = req.user ? req.user.id : null;

//         // Fetch the earliest date in the database if no startDate is provided
//         if (!startDate) {
//             const earliestDateResult = await mongoose.connection.collection('users_students').findOne({}, { sort: { created_at: 1 }, projection: { created_at: 1 } });
//             startDate = earliestDateResult.created_at;
//         }

//         // Use the provided endDate or default to now
//         endDate = endDate || new Date().toISOString();

//         // Check if cached data is available
//         const cachedData = cache.get(`dashboardData_${userId}_${startDate}_${endDate}`);
//         if (cachedData) {
//             return res.json(cachedData);
//         }

//         // Build query condition for date range filtering
//         const dateCondition = { created_at: { $gte: new Date(startDate), $lte: new Date(endDate) } };

//         // Execute queries in parallel
//         const [
//             studentCountResult,
//             openTicketsResult,
//             totalMessagesResult,
//             usersByClassResult,
//             usersByGenderResult,
//             usersByStateResult,
//             usersByAgeResult,
//             activityLogResult
//         ] = await Promise.all([
//             mongoose.connection.collection('users_students').countDocuments(dateCondition),
//             mongoose.connection.collection('tickets').countDocuments({ status: 'open', created_at: dateCondition }),
//             mongoose.connection.collection('user_actions').countDocuments({ action_date: dateCondition }),
//             mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: '$class', count: { $sum: 1 } } }]).toArray(),
//             mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: '$gender', count: { $sum: 1 } } }]).toArray(),
//             mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: '$state', count: { $sum: 1 } } }]).toArray(),
//             mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: { $subtract: [new Date().getFullYear(), '$birth_year'] }, count: { $sum: 1 } } }]).toArray(),
//             mongoose.connection.collection('user_actions').aggregate([
//                 { $match: { action_date: dateCondition } },
//                 { $group: { _id: { day: { $dayOfWeek: '$action_date' }, hour: { $hour: '$action_date' } }, count: { $sum: 1 } } }
//             ]).toArray()
//         ]);

//         const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//         const activityHeatMap = {};

//         daysOfWeek.forEach(day => {
//             const dayData = activityLogResult.filter(log => log._id.day === daysOfWeek.indexOf(day) + 1);
//             const hours = Array.from({ length: 24 }, (_, i) => {
//                 const log = dayData.find(l => l._id.hour === i);
//                 return log ? log.count : 0;
//             });
//             activityHeatMap[day] = hours;
//         });

//         const data = {
//             apiCalls: studentCountResult * 6,
//             totalSubjects: 16,
//             totalStates: 36,
//             totalClasses: 6,
//             activeUsers: studentCountResult,
//             totalRevenue: 682757, // Assuming total revenue is static
//             openTickets:  Math.round(studentCountResult * 0.4),
//             totalMessages: Math.round(studentCountResult * 0.4) * 4,
//             usersByClass: usersByClassResult,
//             usersByGender: usersByGenderResult,
//             usersByState: usersByStateResult,
//             usersByAge: usersByAgeResult,
//             activityHeatMap
//         };

//         // Store data in cache before sending the response
//         cache.set(`dashboardData_${userId}_${startDate}_${endDate}`, data);

//         res.json(data);
//     } catch (error) {
//         console.error('Error fetching dashboard data:', error);
//         res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
//     }
// });

app.get('/api/dashboard-data-static', (req, res) => {
    try {
        const totalActiveUsers = 924;

        const data = {
            totalStates: 7,
            totalClasses: 6,
            totalSubjects: 7,
            totalRevenue: Math.round(totalActiveUsers * 0.4), // Assuming openTickets is 40% of active users
            avgRetUsers: 600,
            subscribers: 749,
            activeUsers: totalActiveUsers,
            apiCalls: 5520,
            openTickets:  600, // Assuming openTickets is 40% of active users
            totalMessages: Math.round(totalActiveUsers * 0.4) * 5, // Assuming totalMessages is 4 times openTickets
            usersByClass: [
                { _id: 'JSS1', count: Math.round(totalActiveUsers * 0.10) },
                { _id: 'JSS2', count: Math.round(totalActiveUsers * 0.05) },
                { _id: 'JSS3', count: Math.round(totalActiveUsers * 0.20) },
                { _id: 'SS1', count: Math.round(totalActiveUsers * 0.15) },
                { _id: 'SS2', count: Math.round(totalActiveUsers * 0.15) },
                { _id: 'SS3', count: Math.round(totalActiveUsers * 0.35) }
            ],
            usersByState: [
                { _id: 'State 1', count: 120 },
                { _id: 'State 2', count: 150 },
                { _id: 'State 3', count: 200 },
                { _id: 'State 4', count: 100 },
                { _id: 'State 5', count: 80 },
                { _id: 'State 6', count: 70 },
                { _id: 'State 7', count: 200 }
            ],
            usersByAge: [
                { _id: 18, count: 200 },
                { _id: 19, count: 150 },
                { _id: 20, count: 180 },
                { _id: 21, count: 120 },
                { _id: 22, count: 270 }
            ],
            usersByGender: [
                { _id: 'Male', count: 420 },
                { _id: 'Female', count: 503 }
            ],
            activityHeatMap: {
                'Sunday': Array(24).fill(10),
                'Monday': Array(24).fill(20),
                'Tuesday': Array(24).fill(15),
                'Wednesday': Array(24).fill(25),
                'Thursday': Array(24).fill(30),
                'Friday': Array(24).fill(35),
                'Saturday': Array(24).fill(40)
            }
        };

        res.json(data);
    } catch (error) {
        console.error('Error fetching static dashboard data:', error);
        res.status(500).json({ error: 'Failed to retrieve static dashboard data.' });
    }
});



app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude the password field from the response
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
});

app.get('/api/users-students', async (req, res) => {
    try {
        const usersStudents = await mongoose.connection.collection('users_students').find().toArray();
        res.json(usersStudents);
    } catch (error) {
        console.error('Error fetching users_students:', error);
        res.status(500).json({ error: 'Failed to retrieve users_students.' });
    }
});

app.get('/api/users/me', (req, res) => {
    if (req.user) {
        return res.json(req.user);
    } else {
        return res.status(401).json({ message: 'Not authenticated' });
    }
});



app.get('/api/user-actions', async (req, res) => {
    try {
        // Fetch the first 2000 documents from the user_actions collection
        const userActions = await mongoose.connection.collection('user_actions')
            .find()
            .limit(20)
            .toArray();

        res.json(userActions);
    } catch (error) {
        console.error('Error fetching user actions:', error);
        res.status(500).json({ error: 'Failed to retrieve user actions.' });
    }
});

async function getEarliestDate() {
    let earliestDate = cache.get('earliestDate');
    if (!earliestDate) {
        const result = await mongoose.connection.collection('users_students')
            .findOne({}, { sort: { created_at: 1 }, projection: { created_at: 1 } });
        earliestDate = result ? result.created_at.toISOString() : new Date().toISOString();
        cache.set('earliestDate', earliestDate, 86400);
    }
    return earliestDate;
}

function normalizedEndDate() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString();
}

async function buildDashboardData(startDate, endDate) {
    const startDt = new Date(startDate);
    const endDt = new Date(endDate);
    const studentDateFilter = { created_at: { $gte: startDt, $lte: endDt } };
    const actionDateFilter = { action_date: { $gte: startDt, $lte: endDt } };

    const db = mongoose.connection;

    // Batch 1: counts + user_actions heatmap (lighter queries)
    const [studentCount, openTicketsCount, activityLogResult] = await Promise.all([
        db.collection('users_students').countDocuments(studentDateFilter),
        db.collection('tickets').countDocuments({ status: 'open', created_at: { $gte: startDt, $lte: endDt } }),
        db.collection('user_actions').aggregate([
            { $match: actionDateFilter },
            { $group: { _id: { dayOfWeek: { $dayOfWeek: '$action_date' }, hour: { $hour: '$action_date' } }, count: { $sum: 1 } } }
        ]).toArray()
    ]);

    // Batch 2: breakdowns (heavier aggregations, run after batch 1 finishes)
    const [usersByClassResult, usersByGenderResult, usersByStateResult, usersByAgeResult] = await Promise.all([
        db.collection('users_students').aggregate([{ $match: studentDateFilter }, { $group: { _id: '$class', count: { $sum: 1 } } }]).toArray(),
        db.collection('users_students').aggregate([{ $match: studentDateFilter }, { $group: { _id: '$gender', count: { $sum: 1 } } }]).toArray(),
        db.collection('users_students').aggregate([{ $match: studentDateFilter }, { $group: { _id: '$state', count: { $sum: 1 } } }]).toArray(),
        db.collection('users_students').aggregate([{ $match: studentDateFilter }, { $group: { _id: { $subtract: [new Date().getFullYear(), '$birth_year'] }, count: { $sum: 1 } } }]).toArray()
    ]);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatMapData = daysOfWeek.map((day, dayIdx) => {
        const dayActions = activityLogResult.filter(log => log._id.dayOfWeek === dayIdx + 1);
        const hours = Array.from({ length: 24 }, (_, hour) => {
            const match = dayActions.find(l => l._id.hour === hour);
            return match ? match.count : 0;
        });
        return { name: day, data: hours };
    });

    const allCounts = heatMapData.flatMap(day => day.data);

    return {
        earliestDate: await getEarliestDate(),
        apiCalls: studentCount * 6,
        totalSubjects: 16,
        totalStates: 36,
        totalClasses: 6,
        activeUsers: studentCount,
        totalRevenue: Math.round(studentCount / 1.5),
        openTickets: Math.round(studentCount * 0.4),
        totalMessages: Math.round(studentCount * 0.4) * 4,
        usersByClass: usersByClassResult,
        usersByGender: usersByGenderResult,
        usersByState: usersByStateResult,
        usersByAge: usersByAgeResult,
        heatMapData,
        maxCount: allCounts.length ? Math.max(...allCounts) : 0,
        minCount: allCounts.length ? Math.min(...allCounts) : 0
    };
}

async function warmCache() {
    try {
        console.log('Warming dashboard cache...');
        const start = Date.now();
        const earliestDate = await getEarliestDate();
        const endDate = normalizedEndDate();
        const cacheKey = `dashboard_${earliestDate}_${endDate}`;

        const data = await buildDashboardData(earliestDate, endDate);
        cache.set(cacheKey, data);
        console.log(`Dashboard cache warmed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    } catch (error) {
        console.error('Cache warm-up failed (non-fatal):', error.message);
    }
}

app.get('/api/dashboard-data', async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        const earliestDate = await getEarliestDate();

        if (!startDate) startDate = earliestDate;
        if (!endDate) endDate = normalizedEndDate();

        const cacheKey = `dashboard_${startDate}_${endDate}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const data = await buildDashboardData(startDate, endDate);
        cache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
    }
});

app.get('/api/earliest-start-date', async (req, res) => {
    try {
        const earliestDateResult = await mongoose.connection.collection('users_students')
            .findOne({}, { sort: { created_at: 1 }, projection: { created_at: 1 } });

        if (!earliestDateResult) {
            return res.status(404).json({ error: 'No data found.' });
        }

        res.json({ startDate: earliestDateResult.created_at.toISOString() });
    } catch (error) {
        console.error('Error fetching the earliest start date:', error);
        res.status(500).json({ error: 'Failed to retrieve the earliest start date.' });
    }
});

app.get('/api/list-students', async (req, res) => {
    try {
        const { search, limit = 100, page = 1 } = req.query;

        // Calculate the number of documents to skip
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build the query object
        let query = {};

        // If there's a search query, add it to the filter
        if (search) {
            query = {
                $or: [
                    { first_name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                    { last_name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { class: { $regex: search, $options: 'i' } },
                    { state: { $regex: search, $options: 'i' } },
                    { gender: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Fetch the total count of documents
        const totalItems = await mongoose.connection.collection('users_students').countDocuments(query);

        // Fetch the students with pagination
        const students = await mongoose.connection.collection('users_students')
            .find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            data: students,
            pagination: {
                total: totalItems,
                per_page: parseInt(limit),
                current_page: parseInt(page),
                last_page: totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to retrieve students.' });
    }
});


app.post('/api/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Failed to logout' });
        }

        // Optionally clear the client-side cookie (if you want)
        res.clearCookie('connect.sid'); // Default session cookie name

        // Send a successful response
        res.json({ message: 'Logout successful' });
    });
});



app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
