const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Log startup
const fs = require('fs');
fs.writeFileSync('server_start.log', `Server starting at ${new Date().toISOString()}\nURI: ${process.env.MONGO_URI}\n`);


// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB Connected');
    const fs = require('fs');
    fs.appendFileSync('server_start.log', `[${new Date().toISOString()}] MongoDB Connected Successfully\n`);
})
.catch(err => {
    console.log(err);
    const fs = require('fs');
    fs.appendFileSync('server_start.log', `[${new Date().toISOString()}] MongoDB Connection Failed: ${err.message}\n`);
});

// Routes
const userDataRoutes = require('./routes/userData');
app.use('/api/user-data', userDataRoutes);

app.use((err, req, res, next) => {
    const fs = require('fs');
    fs.appendFileSync('server_error.log', `[GLOBAL] ${new Date().toISOString()} - ${err.message}\n${err.stack}\n`);
    res.status(500).json({ message: err.message });
});


app.get('/', (req, res) => {
    res.send('Loa For Me API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
