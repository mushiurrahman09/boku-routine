class Calendar {
  private events: { [date: string]: string[] } = {};

  addEvent(date: string, event: string): void {
    if (!this.events[date]) {
      this.events[date] = [];
    }
    this.events[date].push(event);
  }

  removeEvent(date: string, event: string): void {
    if (this.events[date]) {
      this.events[date] = this.events[date].filter(e => e !== event);
      if (this.events[date].length === 0) {
        delete this.events[date];
      }
    }
  }

  getEvents(date: string): string[] {
    return this.events[date] || [];
  }

  getAllEvents(): { [date: string]: string[] } {
    return this.events;
  }
}

export default Calendar;