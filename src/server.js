const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api/students', require('./routes/student'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/superadmin', require('./routes/superadmin'));

// Serve HTML pages
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/student', (req, res) => {
    res.render('student');
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/pre-admin', (req, res) => {
    res.render('pre_admin');
});

app.get('/super-admin', (req, res) => {
    res.render('pre_super_admin');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 