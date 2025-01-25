const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yamina123',
    database: 'clinic_db',
    port: 3306
});

// Connect to database
db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Get all prostheses
app.get('/prostheses', (req, res) => {
    const query = `
        SELECT 
            ID as id,
            first_name,
            last_name,
            type,
            total_amount,
            paid_amount,
            payment_status,
            status
        FROM prostheses 
        ORDER BY ID DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error fetching prostheses' });
        }
        res.json(results);
    });
});

// Add new prosthesis
app.post('/add-prosthesis', (req, res) => {
    const { 
        first_name, 
        last_name, 
        type, 
        total_amount, 
        paid_amount, 
        payment_status, 
        status 
    } = req.body;

    const insertQuery = `
        INSERT INTO prostheses 
        (first_name, last_name, type, total_amount, paid_amount, payment_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(insertQuery, 
        [first_name, last_name, type, total_amount, paid_amount, payment_status, status], 
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Error adding prosthesis' });
            }
            res.status(201).json({
                message: 'Prosthesis added successfully',
                prosthesisId: result.insertId
            });
        });
});

// Update prosthesis
app.put('/prostheses/:id', (req, res) => {
    const { 
        first_name, 
        last_name, 
        type, 
        total_amount, 
        paid_amount, 
        payment_status, 
        status 
    } = req.body;

    const updateQuery = `
        UPDATE prostheses 
        SET first_name = ?, last_name = ?, type = ?, 
            total_amount = ?, paid_amount = ?, payment_status = ?, status = ?
        WHERE ID = ?
    `;
    
    db.query(updateQuery,
        [first_name, last_name, type, total_amount, paid_amount, payment_status, status, req.params.id],
        (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Error updating prosthesis' });
            }
            res.json({ message: 'Updated successfully' });
        });
});

// Delete prosthesis
app.delete('/prostheses/:id', (req, res) => {
    db.query('DELETE FROM prostheses WHERE ID = ?', [req.params.id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error deleting prosthesis' });
        }
        res.json({ message: 'Deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
