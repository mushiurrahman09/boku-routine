import express from 'express';
import bodyParser from 'body-parser';
import { Calendar } from './calendar/Calendar';
import { Classes } from './classes/Classes';
import CalendarView from './components/CalendarView';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Initialize Calendar and Classes
const calendar = new Calendar();
const classes = new Classes();

// Middleware to handle class events
app.post('/api/classes', (req, res) => {
    const { name, date } = req.body;
    const classEvent = classes.createClass(name, date);
    calendar.addEvent(classEvent);
    res.status(201).json(classEvent);
});

app.get('/api/classes', (req, res) => {
    const allClasses = classes.getAllClasses();
    res.json(allClasses);
});

// Serve the CalendarView component
app.get('/', (req, res) => {
    res.send(CalendarView(calendar.getEvents()));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});