require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());




const uri = process.env.MONGO_URI || "mongodb+srv://pratapruhela1922:qwerty1922roundsround@demotour.6duqb.mongodb.net/DemoTour?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Mongoose connection for user authentication
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB for authentication');
}).catch(err => {
    console.error('Error connecting to MongoDB for authentication:', err);
});

// MongoDB client connection
const client = new MongoClient(uri);

// Middleware to verify JWT and retrieve username
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.username = user.username;
        next();
    });
};



// Mongoose schema and model for Appointments
const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    projectname: { type: String, required: true },
    project: { type: String, required: true },
    function: { type: String, required: true },
    description: { type: String, required: true },
    skills: { type: String, required: true }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// Mongoose schema and model for Career
const careerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    jobTitle: { type: String, required: true },
    resumeLink: { type: String, required: true },
    experience: { type: String, required: true },
    coverLetter: { type: String, required: true }
});

const Career = mongoose.model('Career', careerSchema);
// Mongoose schema and model for Career
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    jobTitle: { type: String, required: true },
    resumeLink: { type: String, required: true },
    experience: { type: String, required: true },
    coverLetter: { type: String, required: true }
});

const Contact = mongoose.model('Contact', contactSchema);

// API endpoint to handle appointment submissions
app.post('/api/appointments', async (req, res) => {
    try {
        const appointment = new Appointment(req.body);
        await appointment.save();
        res.status(201).json({ message: 'Appointment created successfully', appointment });
    } catch (error) {
        console.error('Error saving appointment:', error);
        res.status(500).json({ message: 'Error creating appointment', error });
    }
});

app.get('/api/appointments', async (req, res) => {
    try {
      // Fetch data from the database
      const appointments = await Appointment.find();
  
     
      res.json(appointments);
    } catch (error) {
      console.log('Error fetching appointments:', error);
      res.status(500).send('Error fetching appointments');
    }
  });

// API endpoint to handle career form submissions
app.post('/api/career', async (req, res) => {
    try {
        // Create a new Career document using the data from the request body
        const { name, email, jobTitle, resumeLink, experience, coverLetter } = req.body;

        // Create a new Career instance
        const careerApplication = new Career({
            name,
            email,
            jobTitle,
            resumeLink,
            experience,
            coverLetter
        });

        // Save the career application to the database
        await careerApplication.save();

        // Respond back with a success message
        res.status(201).json({ message: 'Application submitted successfully!', careerApplication });
    } catch (error) {
        console.error('Error saving career application:', error);
        res.status(500).json({ message: 'Error submitting application', error });
    }
});
// API endpoint to handle career form submissions
app.post('/api/contact', async (req, res) => {
    try {
        // Create a new Career document using the data from the request body
        const { name, email, jobTitle, resumeLink, experience, coverLetter } = req.body;

        // Create a new Career instance
        const contactApplication = new Contact({
            name,
            email,
            jobTitle,
            resumeLink,
            experience,
            coverLetter
        });

        // Save the career application to the database
        await contactApplication.save();

        // Respond back with a success message
        res.status(201).json({ message: 'Application submitted successfully!', contactApplication });
    } catch (error) {
        console.error('Error saving career application:', error);
        res.status(500).json({ message: 'Error submitting application', error });
    }
});

// API for user signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Log incoming request data to debug
    console.log("Received signup data:", req.body);

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const usersDb = client.db('users');
        const usersCollection = usersDb.collection('users');
        const existingUser = await usersCollection.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = { username, password: hashedPassword };
        await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API for user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const usersDb = client.db('users');
        const usersCollection = usersDb.collection('users');
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
