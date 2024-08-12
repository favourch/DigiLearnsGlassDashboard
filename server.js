import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cache with a 5-minute TTL (Time-To-Live)
const cache = new NodeCache({ stdTTL: 300 });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Middleware to authenticate user and attach to req.user
app.use((req, res, next) => {
    // Mock user for demonstration purposes
    req.user = { id: 1 }; // Replace with actual logic

    next();
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            const user = rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (isPasswordValid) {
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
      const [rows] = await pool.query('SELECT * FROM settings');
      const settings = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });
      res.json(settings);
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
            const [earliestDateResult] = await pool.query(`SELECT MIN(created_at) as earliestDate FROM users_students`);
            startDate = earliestDateResult[0].earliestDate;
        }

        // Use the provided endDate or default to now
        endDate = endDate || new Date().toISOString();

        // Check if cached data is available
        const cachedData = cache.get(`dashboardData_${userId}_${startDate}_${endDate}`);
        if (cachedData) {
            return res.json(cachedData);
        }

        // Build query condition for date range filtering
        const dateCondition = `BETWEEN '${startDate}' AND '${endDate}'`;

        // Execute queries in parallel
        const [
            [studentCountResult],
            [openTicketsResult],
            totalMessagesResult,
            totalRevenueResult,
            usersByClassResult,
            usersByGenderResult,
            usersByStateResult,
            usersByAgeResult,
            activityLogResult
        ] = await Promise.all([
            pool.query(`SELECT COUNT(*) as studentCount FROM users_students WHERE created_at ${dateCondition}`),
            pool.query(`SELECT COUNT(*) as openTickets FROM tickets WHERE status = 'open' AND created_at ${dateCondition}`),
            pool.query(`SELECT COUNT(*) as totalMessages FROM user_actions WHERE action_date ${dateCondition}`),
            pool.query(`SELECT 1000000 as totalRevenue FROM DUAL`), // Assuming total revenue is static
            pool.query(`SELECT class, COUNT(*) as count FROM users_students WHERE created_at ${dateCondition} GROUP BY class`),
            pool.query(`SELECT gender, COUNT(*) as count FROM users_students WHERE created_at ${dateCondition} GROUP BY gender`),
            pool.query(`SELECT state, COUNT(*) as count FROM users_students WHERE created_at ${dateCondition} GROUP BY state`),
            pool.query(`SELECT YEAR(CURDATE()) - birth_year as age, COUNT(*) as count FROM users_students WHERE created_at ${dateCondition} GROUP BY age`),
            pool.query(
                `SELECT DAYNAME(action_date) as day, HOUR(action_date) as hour, COUNT(*) as count
                FROM user_actions 
                WHERE action_date ${dateCondition}
                GROUP BY day, hour`
            )
        ]);

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const activityHeatMap = {};

        daysOfWeek.forEach(day => {
            const dayData = activityLogResult.filter(log => log.day === day);
            const hours = Array.from({ length: 24 }, (_, i) => {
                const log = dayData.find(l => l.hour === i);
                return log ? log.count : 0;
            });
            activityHeatMap[day] = hours;
        });

        const data = {
            apiCalls: studentCountResult[0].studentCount * 1.5,
            totalSubjects: 16,
            totalStates: 36,
            totalClasses: 6,
            activeUsers: studentCountResult[0].studentCount,
            totalRevenue: totalRevenueResult[0].totalRevenue,
            openTickets: openTicketsResult[0].openTickets,
            totalMessages: totalMessagesResult[0].totalMessages,
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




app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
