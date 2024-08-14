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

// Cache with a 5-minute TTL (Time-To-Live)
const cache = new NodeCache({ stdTTL: 300 });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
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

app.get('/api/dashboard-data', async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        const userId = req.user ? req.user.id : null;

        // Fetch the earliest date in the database if no startDate is provided
        if (!startDate) {
            const earliestDateResult = await mongoose.connection.collection('users_students').findOne({}, { sort: { created_at: 1 }, projection: { created_at: 1 } });
            startDate = earliestDateResult.created_at;
        }

        // Use the provided endDate or default to now
        endDate = endDate || new Date().toISOString();

        // Check if cached data is available
        const cachedData = cache.get(`dashboardData_${userId}_${startDate}_${endDate}`);
        if (cachedData) {
            return res.json(cachedData);
        }

        // Build query condition for date range filtering
        const dateCondition = { created_at: { $gte: new Date(startDate), $lte: new Date(endDate) } };

        // Execute queries in parallel
        const [
            studentCountResult,
            openTicketsResult,
            totalMessagesResult,
            usersByClassResult,
            usersByGenderResult,
            usersByStateResult,
            usersByAgeResult,
            activityLogResult
        ] = await Promise.all([
            mongoose.connection.collection('users_students').countDocuments(dateCondition),
            mongoose.connection.collection('tickets').countDocuments({ status: 'open', created_at: dateCondition }),
            mongoose.connection.collection('user_actions').countDocuments({ action_date: dateCondition }),
            mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: '$class', count: { $sum: 1 } } }]).toArray(),
            mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: '$gender', count: { $sum: 1 } } }]).toArray(),
            mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: '$state', count: { $sum: 1 } } }]).toArray(),
            mongoose.connection.collection('users_students').aggregate([{ $match: dateCondition }, { $group: { _id: { $subtract: [new Date().getFullYear(), '$birth_year'] }, count: { $sum: 1 } } }]).toArray(),
            mongoose.connection.collection('user_actions').aggregate([
                { $match: { action_date: dateCondition } },
                { $group: { _id: { day: { $dayOfWeek: '$action_date' }, hour: { $hour: '$action_date' } }, count: { $sum: 1 } } }
            ]).toArray()
        ]);

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const activityHeatMap = {};

        daysOfWeek.forEach(day => {
            const dayData = activityLogResult.filter(log => log._id.day === daysOfWeek.indexOf(day) + 1);
            const hours = Array.from({ length: 24 }, (_, i) => {
                const log = dayData.find(l => l._id.hour === i);
                return log ? log.count : 0;
            });
            activityHeatMap[day] = hours;
        });

        const data = {
            apiCalls: studentCountResult * 6,
            totalSubjects: 16,
            totalStates: 36,
            totalClasses: 6,
            activeUsers: studentCountResult,
            totalRevenue: 682757, // Assuming total revenue is static
            openTickets:  Math.round(studentCountResult * 0.4),
            totalMessages: Math.round(studentCountResult * 0.4) * 4,
            usersByClass: usersByClassResult,
            usersByGender: usersByGenderResult,
            usersByState: usersByStateResult,
            usersByAge: usersByAgeResult,
            activityHeatMap
        };

        // Store data in cache before sending the response
        cache.set(`dashboardData_${userId}_${startDate}_${endDate}`, data);

        res.json(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
    }
});

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

app.get('/api/user-actions-heatmap', async (req, res) => {
    try {
        // Aggregate user actions by day of week and hour
        const userActions = await mongoose.connection.collection('user_actions').aggregate([
            {
                $group: {
                    _id: {
                        dayOfWeek: { $dayOfWeek: "$action_date" },
                        hour: { $hour: "$action_date" }
                    },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const heatMapData = daysOfWeek.map(day => ({
            name: day,
            data: Array(24).fill(0) // Initialize array of 24 zeros for each hour
        }));

        userActions.forEach(action => {
            const dayIndex = action._id.dayOfWeek - 1; // $dayOfWeek returns 1 for Sunday, etc.
            const hour = action._id.hour;
            heatMapData[dayIndex].data[hour] = action.count;
        });

        const maxCount = Math.max(...heatMapData.flatMap(day => day.data));
        const minCount = Math.min(...heatMapData.flatMap(day => day.data));

        res.json({
            heatMapData,
            maxCount,
            minCount
        });
    } catch (error) {
        console.error('Error fetching user actions for heatmap:', error);
        res.status(500).json({ error: 'Failed to retrieve user actions for heatmap.' });
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


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
