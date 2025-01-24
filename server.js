const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yamina123',
    database: process.env.DB_NAME || 'your_database'
}).promise();

// Simple auth middleware (you might want to implement proper authentication)
const checkAuth = (req, res, next) => {
    // For now, allowing all requests
    next();
};

// Routes
// Get all feedback with replies
app.get('/api/feedback', checkAuth, async (req, res) => {
    try {
        const [feedback] = await db.query(`
            SELECT 
                f.id,
                f.subject,
                f.message,
                f.status,
                f.created_at,
                p.first_name,
                p.last_name,
                fr.reply,
                fr.created_at as reply_date,
                a.username as admin_name
            FROM feedback f
            JOIN patients p ON f.patient_id = p.id
            LEFT JOIN feedback_replies fr ON f.id = fr.feedback_id
            LEFT JOIN admins a ON fr.admin_id = a.id
            ORDER BY f.created_at DESC
        `);

        const formattedFeedback = feedback.map(item => ({
            id: item.id,
            client_name: `${item.first_name} ${item.last_name}`,
            message: item.message,
            status: item.status,
            date: item.created_at,
            reply: item.reply,
            reply_date: item.reply_date,
            admin_name: item.admin_name
        }));

        res.json(formattedFeedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reply to feedback (modified to not use session)
app.post('/api/feedback/reply', checkAuth, async (req, res) => {
    const { feedbackId, reply, adminId } = req.body; // adminId now comes from request

    if (!feedbackId || !reply || !adminId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await db.query('START TRANSACTION');

        await db.query(
            'INSERT INTO feedback_replies (feedback_id, admin_id, reply) VALUES (?, ?, ?)',
            [feedbackId, adminId, reply]
        );

        await db.query(
            'UPDATE feedback SET status = ? WHERE id = ?',
            ['Replied', feedbackId]
        );

        await db.query('COMMIT');

        res.json({ message: 'Reply sent successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error sending reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get feedback statistics
app.get('/api/feedback/stats', checkAuth, async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Replied' THEN 1 ELSE 0 END) as replied
            FROM feedback
        `);

        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single feedback with details
app.get('/api/feedback/:id', checkAuth, async (req, res) => {
    try {
        const [feedback] = await db.query(`
            SELECT 
                f.*,
                p.first_name,
                p.last_name,
                p.email,
                fr.reply,
                fr.created_at as reply_date,
                a.username as admin_name
            FROM feedback f
            JOIN patients p ON f.patient_id = p.id
            LEFT JOIN feedback_replies fr ON f.id = fr.feedback_id
            LEFT JOIN admins a ON fr.admin_id = a.id
            WHERE f.id = ?
        `, [req.params.id]);

        if (feedback.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        res.json(feedback[0]);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
