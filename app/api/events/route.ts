import { NextResponse } from 'next/server';
import { initializeDb, getEvents, addEvents, updateEvent, updateEventsInSeries, deleteEvent, deleteEventsInSeries } from '@/lib/db';

// Initialize the database when the API route is accessed
initializeDb();

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Error fetching events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newEvents = await request.json();
    await addEvents(newEvents);
    return NextResponse.json({ message: 'Events added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding events:', error);
    return NextResponse.json({ message: 'Error adding events' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedEvent = await request.json();
    if (updatedEvent.groupId && (updatedEvent.updateAllInSeriesForTitle || updatedEvent.updateAllInSeriesForColor || updatedEvent.newEventDescription !== updatedEvent.oldDescription)) {
      await updateEventsInSeries(updatedEvent.groupId, updatedEvent.newEventTitle, updatedEvent.newEventColor, updatedEvent.newEventDescription);
    } else {
      await updateEvent(updatedEvent);
    }
    return NextResponse.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ message: 'Error updating event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { eventId, groupId, deleteAllInSeries } = await request.json();
    if (groupId && deleteAllInSeries) {
      await deleteEventsInSeries(groupId);
    } else {
      await deleteEvent(eventId);
    }
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ message: 'Error deleting event' }, { status: 500 });
  }
}
