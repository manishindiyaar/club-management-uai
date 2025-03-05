const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define paths
const publicPath = path.join(__dirname, 'public');
const viewsPath = path.join(publicPath, 'views');

// Serve static files
app.use(express.static(publicPath));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superadmin');

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/platform', superAdminRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(viewsPath, 'admin.html'));
});

app.get('/admin-login', (req, res) => {
    console.log('Serving admin-login.html');
    res.sendFile(path.join(viewsPath, 'admin-login.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(viewsPath, 'student.html'));
});

app.get('/super-admin-login', (req, res) => {
    console.log('Serving super-admin-login.html');
    res.sendFile(path.join(viewsPath, 'super-admin-login.html'));
});

app.get('/platform', (req, res) => {
    res.sendFile(path.join(viewsPath, 'platform.html'));
});

app.get('/platform/dashboard', (req, res) => {
    res.sendFile(path.join(viewsPath, 'platform-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    if (req.xhr || req.path.startsWith('/api/')) {
        res.status(500).json({ message: 'Something went wrong!' });
    } else {
        res.status(500).sendFile(path.join(viewsPath, '500.html'));
    }
});

// Handle 404 errors
app.use((req, res) => {
    console.log('404 for path:', req.path);
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.status(404).sendFile(path.join(viewsPath, '404.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 