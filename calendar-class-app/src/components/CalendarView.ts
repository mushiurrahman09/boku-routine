import React, { useEffect, useState } from 'react';
import Calendar from '../calendar/Calendar';
import Classes from '../classes/Classes';
import { ClassEvent } from '../types';

const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<ClassEvent[]>([]);

  useEffect(() => {
    const classes = new Classes();
    const allClasses = classes.fetchAllClasses();
    const classEvents = allClasses.map(cls => ({
      title: cls.name,
      date: cls.date,
      description: cls.description,
    }));
    setEvents(classEvents);
  }, []);

  return (
    <div>
      <h2>Class Calendar</h2>
      <Calendar events={events} />
    </div>
  );
};

export default CalendarView;