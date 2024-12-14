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
const mongoUri = process.env.MONGO_URI;
// Updated connection options removing unsupported options
const mongoOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    authSource: 'admin',
    authMechanism: 'SCRAM-SHA-1',
    directConnection: true,
    family: 4
};

// At the top of your file, add:
let useStaticData = false;

// Modify the connectDB function
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, mongoOptions);
        console.log('Connected to MongoDB successfully');
        useStaticData = false;
        return true;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        if (err.name === 'MongoServerSelectionError') {
            console.error('Connection details:', {
                uri: process.env.MONGO_URI.replace(/:[^:@]*@/, ':****@'),
                options: mongoOptions,
                error: err.message,
                reason: err.reason
            });
        }
        useStaticData = true;
        return false;
    }
};

// Modified connection event handlers with exponential backoff
let retryAttempt = 0;
const maxRetryAttempts = 5;
const baseRetryDelay = 5000;

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
    const retryDelay = Math.min(baseRetryDelay * Math.pow(2, retryAttempt), 30000);
    retryAttempt++;
    
    if (retryAttempt <= maxRetryAttempts) {
        console.log(`Retrying connection in ${retryDelay/1000} seconds... (Attempt ${retryAttempt}/${maxRetryAttempts})`);
        setTimeout(async () => {
            console.log('Attempting to reconnect to MongoDB...');
            await connectDB();
        }, retryDelay);
    } else {
        console.error('Max retry attempts reached. Please check your MongoDB configuration.');
    }
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    if (retryAttempt <= maxRetryAttempts) {
        const retryDelay = Math.min(baseRetryDelay * Math.pow(2, retryAttempt), 30000);
        console.log(`Attempting to reconnect in ${retryDelay/1000} seconds...`);
        setTimeout(async () => {
            await connectDB();
        }, retryDelay);
    }
});

mongoose.connection.on('connected', async () => {
    console.log('MongoDB connected');
    retryAttempt = 0;
    await seedInitialData();
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
    retryAttempt = 0; // Reset retry counter on successful reconnection
});

// Modify handleDbOperation to use static data as fallback
const handleDbOperation = async (operation, staticData) => {
    if (useStaticData && staticData) {
        return {
            success: true,
            data: staticData,
            isStatic: true
        };
    }

    if (mongoose.connection.readyState !== 1) {
        return {
            success: false,
            error: 'Database connection is not available',
            isStatic: false
        };
    }

    try {
        const result = await operation();
        return {
            success: true,
            data: result,
            isStatic: false
        };
    } catch (error) {
        console.error('Database operation error:', error);
        if (staticData) {
            return {
                success: true,
                data: staticData,
                isStatic: true
            };
        }
        return {
            success: false,
            error: 'Database operation failed',
            isStatic: false
        };
    }
};

// Example of using static data fallback in a route
app.get('/api/users', async (req, res) => {
    const staticUsers = [
        { first_name: 'Demo', last_name: 'User', email: 'demo@example.com' }
    ];

    const result = await handleDbOperation(
        async () => await User.find().select('-password'),
        staticUsers
    );

    if (!result.success) {
        return res.status(503).json({
            error: result.error,
            message: 'Service temporarily unavailable'
        });
    }

    if (result.isStatic) {
        res.set('X-Data-Source', 'static');
    }

    res.json(result.data);
});

// Initial connection attempt
(async () => {
    let connected = await connectDB();
    if (!connected) {
        console.log('Initial MongoDB connection failed. Server will continue running and retry connection...');
    }
})();

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
    // Add timeout handling for database operations
    const timeoutDuration = 5000; // 5 seconds timeout

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Database operation timed out'));
        }, timeoutDuration);
    });

    try {
        const userId = req.session.userId;
        if (!userId) {
            req.user = null;
            return next();
        }

        const userPromise = User.findById(userId).select('first_name last_name email avatar');
        const result = await Promise.race([userPromise, timeoutPromise]);
        
        req.user = result;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        req.user = null;
        next();
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!mongoose.connection.readyState === 1) {
            return res.status(503).json({ 
                message: 'Database connection unavailable',
                useStaticData: true 
            });
        }

        const user = await User.findOne({ email }).maxTimeMS(5000); // Add timeout

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        req.session.userId = user._id;
        
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
    } catch (error) {
        console.error('Login error:', error);
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({ 
                message: 'Service temporarily unavailable',
                useStaticData: true
            });
        }
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
    const staticUsers = [
        { first_name: 'Demo', last_name: 'User', email: 'demo@example.com' }
    ];

    const result = await handleDbOperation(
        async () => await User.find().select('-password'),
        staticUsers
    );

    if (!result.success) {
        return res.status(503).json({
            error: result.error,
            message: 'Service temporarily unavailable'
        });
    }

    if (result.isStatic) {
        res.set('X-Data-Source', 'static');
    }

    res.json(result.data);
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

app.get('/api/dashboard-data', async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        // Default to entire available date range if not provided
        if (!startDate) {
            const earliestDateResult = await mongoose.connection.collection('users_students').findOne({}, { sort: { created_at: 1 }, projection: { created_at: 1 } });
            startDate = earliestDateResult.created_at.toISOString();
        }
        endDate = endDate || new Date().toISOString();

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
            totalRevenue: Math.round(studentCountResult / 1.5), // Assuming total revenue is static
            openTickets: Math.round(studentCountResult * 0.4),
            totalMessages: Math.round(studentCountResult * 0.4) * 4,
            usersByClass: usersByClassResult,
            usersByGender: usersByGenderResult,
            usersByState: usersByStateResult,
            usersByAge: usersByAgeResult,
            activityHeatMap
        };

        // Store data in cache before sending the response
        const userId = req.user ? req.user.id : null;
        cache.set(`dashboardData_${userId}_${startDate}_${endDate}`, data);

        res.json(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
    }
});


app.get('/api/user-actions-heatmap', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Received startDate:', startDate);
        console.log('Received endDate:', endDate);

        // Ensure startDate and endDate are valid Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ error: 'Invalid date range' });
        }

        // Aggregate user actions by day of week and hour within the date range
        const userActions = await mongoose.connection.collection('user_actions').aggregate([
            {
                $match: {
                    action_date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
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


app.get('/api/earliest-start-date', async (req, res) => {
    try {
        // Find the earliest created_at date in the users_students collection
        const earliestDateResult = await mongoose.connection.collection('users_students').findOne({}, { sort: { created_at: 1 }, projection: { created_at: 1 } });

        if (!earliestDateResult) {
            return res.status(404).json({ error: 'No data found.' });
        }

        // Return the earliest date in ISO 8601 format
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

// Health check endpoint
app.get('/', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
            status: dbStatusMap[dbStatus] || 'unknown',
            connected: dbStatus === 1,
            usingStaticData: useStaticData
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// Add this after your models are defined
const seedInitialData = async () => {
    try {
        // Check if we already have users
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            // Create a demo user
            await User.create({
                first_name: 'Demo',
                last_name: 'User',
                email: 'demo@example.com',
                password: await bcrypt.hash('password123', 10),
                created_at: new Date(),
                class: 'JSS3',
                gender: 'Male',
                state: 'Lagos',
                birth_year: 2000
            });
            console.log('Demo user created');
        }
    } catch (error) {
        console.error('Error seeding initial data:', error);
    }
};

// Modify the connection success handler
mongoose.connection.on('connected', async () => {
    console.log('MongoDB connected');
    retryAttempt = 0;
    await seedInitialData();
});

// Add connection monitoring
mongoose.connection.on('connecting', () => {
    console.log('Connecting to MongoDB...');
});

mongoose.connection.on('connected', async () => {
    console.log('MongoDB connected');
    retryAttempt = 0;
    try {
        await seedInitialData();
    } catch (error) {
        console.error('Error seeding initial data:', error);
    }
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    if (retryAttempt <= maxRetryAttempts) {
        const retryDelay = Math.min(baseRetryDelay * Math.pow(2, retryAttempt), 30000);
        console.log(`Attempting to reconnect in ${retryDelay/1000} seconds... (Attempt ${retryAttempt + 1}/${maxRetryAttempts})`);
        setTimeout(async () => {
            await connectDB();
        }, retryDelay);
    }
});
