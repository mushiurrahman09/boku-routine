export interface ClassEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

export interface CalendarProps {
  events: ClassEvent[];
  onEventClick?: (event: ClassEvent) => void;
  onEventAdd?: (event: ClassEvent) => void;
  onEventRemove?: (eventId: string) => void;
}