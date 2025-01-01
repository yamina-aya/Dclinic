require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend and backend communication
app.use(express.json()); // Parse JSON requests

// MySQL Database connection - Note the port is 3306 (default MySQL port)
const db = mysql.createConnection({
    host: 'localhost',
    user: '', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: '', // Replace with your database name
    port: 3306  
});


db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Handling connection errors
db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        handleDisconnect();
    } else {
        throw err;
    }
});

// Function to handle disconnects
function handleDisconnect() {
    db = mysql.createConnection({
        host: 'localhost',
        user: 'root', // Replace with your MySQL username
        password: 'yamina123', // Replace with your MySQL password
        database: 'clinic_db', // Replace with your database name
        port: 3000
    });

    db.connect((err) => {
        if (err) {
            console.error('Error reconnecting to database:', err);
            setTimeout(handleDisconnect, 2000);
            return;
        }
        console.log('Successfully reconnected to MySQL database');
    });

    db.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

//  query to create or modif Products table
const createTableQuery = `
CREATE TABLE IF NOT EXISTS Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE,  /* Add UNIQUE constraint */
    category VARCHAR(255),
    price DECIMAL(10,2),
    quantity INT
)`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.error('Error creating/modifying table:', err);
        return;
    }
    console.log('Table created/modified successfully');
});

// Add a new product
app.post('/add-product', (req, res) => {
    const { name, category, price, quantity } = req.body;
    
    const insertQuery = 'INSERT INTO Products (name, category, price, quantity) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [name, category, price, quantity], (err, result) => {
        if (err) {
            // Check for duplicate entry error
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    error: 'The product already exists' 
                });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error adding product' });
        }
        
        res.status(201).json({
            message: 'Product added successfully',
            productId: result.insertId
        });
    });
});

// Get all products
app.get('/products', (req, res) => {
    db.query('SELECT * FROM Products', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Get a single product by ID
app.get('/products/:id', (req, res) => {
    db.query('SELECT * FROM Products WHERE id = ?', [req.params.id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

// Update product
app.put('/products/:id', (req, res) => {
    const { name, category, price, quantity } = req.body;
    db.query('UPDATE Products SET name = ?, category = ?, price = ?, quantity = ? WHERE id = ?',
        [name, category, price, quantity, req.params.id],
        (err) => {
            if (err) throw err;
            res.json({ message: 'Updated successfully' });
        });
});

// Delete a product
app.delete('/products/:id', (req, res) => {
    db.query('DELETE FROM Products WHERE id = ?', [req.params.id], (err) => {
        if (err) throw err;
        res.json({ message: 'Deleted successfully' });
    });
});


app.get('/test-db', (req, res) => {
    db.query('SELECT * FROM Products', (err, results) => {
        if (err) {
            console.error('Test query error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Test query results:', results);
        res.json({ 
            message: 'Database test',
            connected: db.state === 'authenticated',
            results: results
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
