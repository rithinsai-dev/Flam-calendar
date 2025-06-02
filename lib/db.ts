import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

interface EventData {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    description?: string;
    groupId?: string;
  };
}

interface Data {
  events: EventData[];
}

const defaultData: Data = { events: [] };
const file = path.join(process.cwd(), 'data', 'events.json');
const adapter = new JSONFile<Data>(file);
const db = new Low<Data>(adapter, defaultData);

export async function initializeDb() {
  await db.read();
  db.data = db.data || defaultData;
  await db.write();
}

export async function getEvents(): Promise<EventData[]> {
  await db.read();
  return db.data?.events || [];
}

export async function addEvents(newEvents: EventData[]): Promise<void> {
  await db.read();
  db.data = db.data || defaultData;
  db.data.events.push(...newEvents);
  await db.write();
}

export async function updateEvent(updatedEvent: EventData): Promise<void> {
  await db.read();
  db.data = db.data || defaultData;
  const index = db.data.events.findIndex(event => event.id === updatedEvent.id);
  if (index !== -1) {
    db.data.events[index] = updatedEvent;
  }
  await db.write();
}

export async function updateEventsInSeries(groupId: string, newTitle: string, newColor: string, newDescription: string): Promise<void> {
  await db.read();
  db.data = db.data || defaultData;
  db.data.events = db.data.events.map(event => {
    if (event.extendedProps?.groupId === groupId) {
      return {
        ...event,
        title: newTitle,
        backgroundColor: newColor,
        borderColor: newColor,
        extendedProps: {
          ...event.extendedProps,
          description: newDescription,
        },
      };
    }
    return event;
  });
  await db.write();
}

export async function deleteEvent(eventId: string): Promise<void> {
  await db.read();
  db.data = db.data || defaultData;
  db.data.events = db.data.events.filter(event => event.id !== eventId);
  await db.write();
}

export async function deleteEventsInSeries(groupId: string): Promise<void> {
  await db.read();
  db.data = db.data || defaultData;
  db.data.events = db.data.events.filter(event => event.extendedProps?.groupId !== groupId);
  await db.write();
}
