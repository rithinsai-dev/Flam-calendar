"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  formatDate,
  DateSelectArg,
  EventClickArg,
  EventApi,
  EventInput,
  EventHoveringArg,
  DateInput, // Explicitly import DateInput for clarity
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Ensure this path is correct
const recurrenceOptions = ["none", "daily", "weekly", "monthly"];
const DEFAULT_EVENT_COLOR = "#3b82f6";

// Define EventData interface to match the db.ts EventData
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

const findConflictingEvents = (
  checkStart: Date,
  checkEnd: Date,
  allEvents: EventInput[],
  ignoreEventId: string | null = null
): EventInput[] => {
  const conflicting: EventInput[] = [];
  for (const existingEvent of allEvents) {
    if (existingEvent.id === ignoreEventId) {
      continue;
    }
    if (!existingEvent.start || !existingEvent.end) {
      continue;
    }

    let existingStart: Date;
    let existingEnd: Date;

    // Convert existingEvent.start to a Date object
    const startInput = existingEvent.start; // Type is DateInput
    if (Array.isArray(startInput)) {
      // If startInput is [year, monthIndex, day?, hours?, minutes?, seconds?, ms?]
      // The Date constructor handles undefined for optional parameters correctly.
      existingStart = new Date(
        startInput[0],       // year
        startInput[1],       // monthIndex (0-11)
        startInput[2],       // day (optional)
        startInput[3],       // hours (optional)
        startInput[4],       // minutes (optional)
        startInput[5],       // seconds (optional)
        startInput[6]        // milliseconds (optional)
      );
    } else {
      // If it's Date, string, or number, new Date() handles it.
      existingStart = new Date(startInput as string | number | Date);
    }

    // Convert existingEvent.end to a Date object
    const endInput = existingEvent.end; // Type is DateInput
    if (Array.isArray(endInput)) {
      existingEnd = new Date(
        endInput[0],
        endInput[1],
        endInput[2],
        endInput[3],
        endInput[4],
        endInput[5],
        endInput[6]
      );
    } else {
      existingEnd = new Date(endInput as string | number | Date);
    }

    if (checkStart < existingEnd && checkEnd > existingStart) {
      conflicting.push(existingEvent);
    }
  }
  return conflicting;
};


const Calendar: React.FC = () => {
  const [allEventsMasterList, setAllEventsMasterList] = useState<EventInput[]>([]);
  const [availableColors, setAvailableColors] = useState<Set<string>>(new Set());
  const [activeColorFilters, setActiveColorFilters] = useState<Set<string>>(new Set());
  const [eventsToDisplayInCalendar, setEventsToDisplayInCalendar] = useState<EventInput[]>([]);

  const [currentEvents, setCurrentEvents] = useState<EventApi[]>([]); // For sidebar, from eventsSet
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [newEventDescription, setNewEventDescription] = useState<string>("");
  const [newEventStartTime, setNewEventStartTime] = useState<string>("12:00");
  const [newEventEndTime, setNewEventEndTime] = useState<string>("13:00");
  const [newEventColor, setNewEventColor] = useState<string>(DEFAULT_EVENT_COLOR);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
  const [recurrence, setRecurrence] = useState<string>("none");
  const [editingEvent, setEditingEvent] = useState<EventApi | null>(null); // Still EventApi for context
  const calendarRef = useRef<FullCalendar>(null);

  const [originalEditEventStart, setOriginalEditEventStart] = useState<Date | null>(null);
  const [originalEditEventEnd, setOriginalEditEventEnd] = useState<Date | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("darkModeCalendar");
      return savedMode === "true";
    }
    return false;
  });

  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("darkModeCalendar", "true");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("darkModeCalendar", "false");
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Load events from the API on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const storedEvents: EventData[] = await response.json();
        const eventsWithDefaults = storedEvents.map(event => ({
          ...event,
          id: event.id || crypto.randomUUID(),
          backgroundColor: event.backgroundColor || DEFAULT_EVENT_COLOR,
          borderColor: event.backgroundColor || DEFAULT_EVENT_COLOR,
        }));
        setAllEventsMasterList(eventsWithDefaults);
      } catch (error) {
        console.error("Error loading events:", error);
        setAllEventsMasterList([]); // Fallback to empty array on error
      }
    };
    loadEvents();
  }, []);

  // 2. Persist allEventsMasterList to database (This useEffect is no longer needed as updates are handled directly by db functions)
  // 3. Derive availableColors from allEventsMasterList
  useEffect(() => {
    const colors = new Set<string>();
    allEventsMasterList.forEach(event => {
      if (event.backgroundColor) {
        colors.add(event.backgroundColor);
      }
    });
    setAvailableColors(colors);
  }, [allEventsMasterList]);

  // 4. Derive eventsToDisplayInCalendar from allEventsMasterList and activeColorFilters
  useEffect(() => {
    if (activeColorFilters.size === 0) {
      setEventsToDisplayInCalendar(allEventsMasterList);
    } else {
      const filtered = allEventsMasterList.filter(event =>
        event.backgroundColor && activeColorFilters.has(event.backgroundColor)
      );
      setEventsToDisplayInCalendar(filtered);
    }
  }, [allEventsMasterList, activeColorFilters]);


  const toggleColorFilter = (color: string) => {
    setActiveColorFilters(prevFilters => {
      const newFilters = new Set(prevFilters);
      if (newFilters.has(color)) {
        newFilters.delete(color);
      } else {
        newFilters.add(color);
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveColorFilters(new Set());
  };


  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateInfo(selectInfo);
    setIsEditMode(false);
    setNewEventTitle(""); setNewEventDescription("");
    setNewEventStartTime("12:00"); setNewEventEndTime("13:00");
    setNewEventColor(DEFAULT_EVENT_COLOR);
    setRecurrence("none"); setEditingEvent(null);
    setOriginalEditEventStart(null); setOriginalEditEventEnd(null);
    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setEditingEvent(event); // Store EventApi for context, like id and groupId
    setNewEventTitle(event.title);
    setNewEventDescription(event.extendedProps.description || "");
    const startTime = event.start ? new Date(event.start).toTimeString().slice(0, 5) : "12:00";
    const endTime = event.end ? new Date(event.end).toTimeString().slice(0, 5) : "13:00";
    setNewEventStartTime(startTime); setNewEventEndTime(endTime);
    setNewEventColor(event.backgroundColor || DEFAULT_EVENT_COLOR);
    setRecurrence(event.extendedProps.groupId ? "recurring-edit" : "none");
    setIsEditMode(true); setIsDialogOpen(true); setSelectedDateInfo(null);
    if (event.start) setOriginalEditEventStart(new Date(event.start));
    if (event.end) setOriginalEditEventEnd(new Date(event.end));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Reset all form states
    setNewEventTitle(""); setNewEventDescription("");
    setNewEventStartTime("12:00"); setNewEventEndTime("13:00");
    setNewEventColor(DEFAULT_EVENT_COLOR);
    setRecurrence("none"); setEditingEvent(null); setSelectedDateInfo(null);
    setOriginalEditEventStart(null); setOriginalEditEventEnd(null);
  };

  const handleAddOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) {
      alert("Please enter an event title.");
      return;
    }

    // Calendar API for unselect, not strictly needed for master list update
    calendarRef.current?.getApi().unselect();

    let eventBaseDate: Date;
    if (isEditMode && editingEvent && editingEvent.start) {
        eventBaseDate = new Date(editingEvent.start);
    } else if (selectedDateInfo) {
        eventBaseDate = new Date(selectedDateInfo.start);
    } else {
        console.error("Cannot determine base date for event."); return;
    }

    const formDatePart = new Date(eventBaseDate); formDatePart.setHours(0,0,0,0);
    const finalStartDate = new Date(formDatePart);
    const [startH, startM] = newEventStartTime.split(":").map(Number);
    finalStartDate.setHours(startH, startM);

    const finalEndDate = new Date(formDatePart);
    const [endH, endM] = newEventEndTime.split(":").map(Number);
    finalEndDate.setHours(endH, endM);

    if (finalEndDate <= finalStartDate) {
        finalEndDate.setDate(finalEndDate.getDate() + 1);
    }

    // CONFLICT DETECTION against allEventsMasterList
    let timesHaveChanged = false;
    if (isEditMode && editingEvent && originalEditEventStart && originalEditEventEnd) {
        timesHaveChanged = finalStartDate.getTime() !== originalEditEventStart.getTime() ||
                           finalEndDate.getTime() !== originalEditEventEnd.getTime();
    }

    if (!isEditMode || (isEditMode && timesHaveChanged)) {
        const conflictingEvents = findConflictingEvents(
            finalStartDate,
            finalEndDate,
            allEventsMasterList, // Check against the master list
            isEditMode && editingEvent ? editingEvent.id : null
        );
        if (conflictingEvents.length > 0) {
            const conflictTitles = conflictingEvents.map(ev => `"${ev.title}"`).join(", ");
            let conflictMessage = `This event conflicts with: ${conflictTitles}.\n\nDo you want to add it anyway?`;
            if (!isEditMode && recurrence !== "none") {
                conflictMessage += "\n(Note: This checks the first instance of a recurring event. Other instances might also conflict.)";
            }
            if (!window.confirm(conflictMessage)) return;
        }
    }

    if (isEditMode && editingEvent) { // Editing existing event
      const eventIdToUpdate = editingEvent.id;
      const groupId = editingEvent.extendedProps.groupId;
      const oldTitle = editingEvent.title;
      const oldDescription = editingEvent.extendedProps.description || "";
      const oldColor = editingEvent.backgroundColor;

      let updateAllInSeriesForTitle = false;
      let updateAllInSeriesForColor = false;
      // Description updates always apply to all in series if it's a recurring event
      // Time updates apply only to the specific instance

      if (newEventTitle !== oldTitle && groupId) {
        updateAllInSeriesForTitle = window.confirm("Update title for all recurring events in this series?");
      }
      if (newEventColor !== oldColor && groupId) {
        updateAllInSeriesForColor = window.confirm("Update color for all recurring events in this series?");
      }

      // Update via API
      if (groupId && (updateAllInSeriesForTitle || updateAllInSeriesForColor || newEventDescription !== oldDescription)) {
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            newEventTitle,
            newEventColor,
            newEventDescription,
            updateAllInSeriesForTitle,
            updateAllInSeriesForColor,
            oldDescription, // Pass oldDescription for comparison in API
          }),
        });
      } else {
        // Update single event via API
        const updatedEvent: EventData = {
          id: eventIdToUpdate,
          title: newEventTitle,
          start: finalStartDate.toISOString(),
          end: finalEndDate.toISOString(),
          allDay: false,
          backgroundColor: newEventColor,
          borderColor: newEventColor,
          extendedProps: {
            description: newEventDescription,
            groupId: groupId,
          },
        };
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEvent),
        });
      }

      // Re-fetch events to update UI
      const response = await fetch('/api/events');
      const updatedEvents: EventData[] = await response.json();
      setAllEventsMasterList(updatedEvents);

    } else if (selectedDateInfo) { // Adding new event
      const eventsToAdd: EventData[] = [];
      const uniqueGroupId = recurrence !== "none" ? crypto.randomUUID() : undefined;

      const recurrenceSeriesStartDate = new Date(selectedDateInfo.start);
      recurrenceSeriesStartDate.setHours(startH, startM, 0, 0);
      const recurrenceSeriesEndDate = new Date(selectedDateInfo.start);
      recurrenceSeriesEndDate.setHours(endH, endM, 0, 0);
      if (recurrenceSeriesEndDate <= recurrenceSeriesStartDate) {
        recurrenceSeriesEndDate.setDate(recurrenceSeriesEndDate.getDate() + 1);
      }
      const eventDurationMs = recurrenceSeriesEndDate.getTime() - recurrenceSeriesStartDate.getTime();
      const initialDayOfMonth = recurrenceSeriesStartDate.getDate();
      let maxIterations = 1;
      if (recurrence === "daily") maxIterations = 365;
      else if (recurrence === "weekly") maxIterations = 52;
      else if (recurrence === "monthly") maxIterations = 12;

      for (let i = 0; i < maxIterations; i++) {
        const loopEventStartDate = new Date(recurrenceSeriesStartDate);
        if (recurrence === "daily") loopEventStartDate.setDate(recurrenceSeriesStartDate.getDate() + i);
        else if (recurrence === "weekly") loopEventStartDate.setDate(recurrenceSeriesStartDate.getDate() + i * 7);
        else if (recurrence === "monthly") {
          const targetMonth = recurrenceSeriesStartDate.getMonth() + i;
          loopEventStartDate.setFullYear(recurrenceSeriesStartDate.getFullYear());
          loopEventStartDate.setMonth(targetMonth, initialDayOfMonth);
          if (loopEventStartDate.getMonth() !== (targetMonth % 12)) {
            loopEventStartDate.setMonth(targetMonth + 1, 1); loopEventStartDate.setDate(0);
          }
        } else if (i > 0) break;

        const loopEventEndDate = new Date(loopEventStartDate.getTime() + eventDurationMs);
        eventsToAdd.push({
          id: crypto.randomUUID(),
          title: newEventTitle,
          start: loopEventStartDate.toISOString(),
          end: loopEventEndDate.toISOString(),
          allDay: false,
          backgroundColor: newEventColor,
          borderColor: newEventColor,
          extendedProps: { description: newEventDescription, groupId: uniqueGroupId },
        });
      }
      await fetch('/api/events', { // Add events via API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventsToAdd),
      });
      const response = await fetch('/api/events'); // Re-fetch events to update UI
      const updatedEvents: EventData[] = await response.json();
      setAllEventsMasterList(updatedEvents);
    }
    handleCloseDialog();
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    const eventIdToDelete = editingEvent.id;
    const groupId = editingEvent.extendedProps.groupId;

    if (groupId) {
      const confirmDeleteAll = window.confirm(
        "Delete ALL occurrences in this series, or ONLY THIS specific one?\n\n- OK for ALL\n- Cancel for THIS ONE"
      );
      if (confirmDeleteAll) {
        await fetch('/api/events', { // Delete series via API
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, deleteAllInSeries: true }),
        });
      } else {
        await fetch('/api/events', { // Delete single event via API
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: eventIdToDelete }),
        });
      }
    } else {
      await fetch('/api/events', { // Delete single event via API
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: eventIdToDelete }),
      });
    }
    const response = await fetch('/api/events'); // Re-fetch events to update UI
    const updatedEvents: EventData[] = await response.json();
    setAllEventsMasterList(updatedEvents);
    handleCloseDialog();
  };

  const handleEventMouseEnter = (mouseEnterInfo: EventHoveringArg) => {
    const description = mouseEnterInfo.event.extendedProps.description;
    if (description) {
      setTooltipContent(description);
      setTooltipPosition({ x: mouseEnterInfo.jsEvent.pageX + 10, y: mouseEnterInfo.jsEvent.pageY + 10 });
      setIsTooltipVisible(true);
    }
  };
  const handleEventMouseLeave = () => setIsTooltipVisible(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="p-4 flex justify-end">
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row w-full px-4 sm:px-10 justify-start items-start gap-8">
        <div className="w-full md:w-3/12">
          {/* Color Filter UI */}
          <div className="p-4 mb-4 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Filter by Color:</h3>
            {availableColors.size === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">No colors to filter by.</p>}
            <div className="flex flex-wrap gap-2 mb-2">
              {Array.from(availableColors).map(color => (
                <button
                  key={color}
                  onClick={() => toggleColorFilter(color)}
                  className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800
                              ${activeColorFilters.has(color) ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 border-blue-500 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                  title={`Filter by ${color}`}
                  style={{ backgroundColor: color }}
                >
                   {activeColorFilters.has(color) && <span className="sr-only">Selected</span>}
                </button>
              ))}
            </div>
            {activeColorFilters.size > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="text-2xl font-extrabold px-2 md:px-0 py-2 text-slate-900 dark:text-slate-100">
            Calendar Events
          </div>
          <ul className="space-y-3 max-h-[60vh] md:max-h-[65vh] overflow-y-auto p-2 md:p-0">
            {currentEvents.length === 0 && ( // currentEvents is from eventsSet, so it's already filtered by what FC displays
              <div className="italic text-center text-gray-500 dark:text-gray-400 py-4">
                {activeColorFilters.size > 0 ? "No events match filter" : "No Events Present"}
              </div>
            )}
            {currentEvents.map((event) => ( // These are EventApi objects
              <li
                className="border border-gray-200 dark:border-gray-700 shadow px-4 py-2 rounded-md bg-white dark:bg-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                key={event.id + (event.start?.toISOString() || '')} // Add start to key for recurring instances
                onClick={() => handleEventClick({ event } as EventClickArg)}
              >
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: event.backgroundColor || DEFAULT_EVENT_COLOR }}
                  ></span>
                  <div className="flex-grow">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">{event.title}</span>
                    <br />
                    <label className="text-slate-800 dark:text-slate-300 text-sm">
                      {formatDate(event.start!, {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full md:w-9/12 mt-0 md:mt-8">
          <FullCalendar
            key={eventsToDisplayInCalendar.map(e => e.id).join(',') + activeColorFilters.size + (isDarkMode ? '-dark' : '-light')}
            ref={calendarRef}
            height={"85vh"}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today", center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            initialView="dayGridMonth"
            editable={true} selectable={true} selectMirror={true} dayMaxEvents={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventsSet={(events) => setCurrentEvents(events)} // events are EventApi[]
            events={eventsToDisplayInCalendar} // Pass the filtered list
            timeZone="local"
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            viewClassNames={isDarkMode ? "fc-dark-theme" : ""}
          />
        </div>
      </div>

      {isTooltipVisible && tooltipContent && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '0.875rem',
            zIndex: 1000, // Ensure tooltip is on top
            pointerEvents: 'none', // Prevent tooltip from interfering with mouse events
            whiteSpace: 'pre-wrap', // Preserve line breaks in description
          }}
        >
          {tooltipContent}
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}> {/* Dialog JSX largely unchanged, check for any missed details */}
        <DialogContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">{isEditMode ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddOrUpdateEvent}>
            <input
              type="text" placeholder="Event Title" value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)} required
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 p-3 rounded-md text-lg w-full placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
            />
            <textarea
              placeholder="Event Description (optional)" value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 p-3 rounded-md text-lg w-full h-24 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
            />
            <div className="flex gap-4">
                <div className="w-1/2">
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                    <input id="startTime" type="time" value={newEventStartTime} onChange={(e) => setNewEventStartTime(e.target.value)} required
                           className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 p-3 rounded-md text-lg w-full mt-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"/>
                </div>
                <div className="w-1/2">
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                    <input id="endTime" type="time" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} required
                           className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 p-3 rounded-md text-lg w-full mt-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"/>
                </div>
            </div>
            <div>
              <label htmlFor="eventColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Color</label>
              <input id="eventColor" type="color" value={newEventColor} onChange={(e) => setNewEventColor(e.target.value)}
                     className="mt-1 block w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-slate-700"/>
            </div>
            {!isEditMode && recurrence !== "recurring-edit" && (
              <div>
                <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recurrence</label>
                <select id="recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 p-3 rounded-md text-lg w-full mt-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100">
                  {recurrenceOptions.map((opt) => ( <option value={opt} key={opt} className="dark:bg-slate-700 dark:text-slate-100">{opt.charAt(0).toUpperCase() + opt.slice(1)}</option> ))}
                </select>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-md w-full transition-colors">
                {isEditMode ? "Update Event" : "Add Event"}
              </button>
              {isEditMode && ( <button type="button" onClick={handleDeleteEvent} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-md w-full transition-colors">Delete</button> )}
              <button type="button" onClick={handleCloseDialog} className="bg-gray-300 hover:bg-gray-400 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100 p-3 rounded-md w-full transition-colors">Cancel</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
