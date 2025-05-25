# Interactive Calendar Project

This project implements a feature-rich interactive calendar using React, Next.js (implied by `"use client";` and `@/` imports), FullCalendar, and Tailwind CSS (implied by class names). It allows users to create, view, edit, delete, and filter events, with support for recurrence, conflict detection, dark mode, and local storage persistence. Dialogs are handled using a component likely from Shadcn/ui.

## Features

*   **Event Management:** Create, update, and delete calendar events.
*   **Recurring Events:** Add daily, weekly, or monthly recurring events (currently for a fixed number of occurrences).
*   **Conflict Detection:** Warns users if a new or modified event overlaps with existing ones.
*   **Color Coding & Filtering:** Assign colors to events and filter the calendar view by event color.
*   **Dark Mode:** Toggle between light and dark themes.
*   **Local Storage:** Events are saved to the browser's local storage for persistence.
*   **Event Tooltips:** Display event descriptions on hover.
*   **Responsive Design:** Styled with Tailwind CSS for adaptability.

## Prerequisites

*   Node.js (v18.x or later recommended)
*   npm, yarn, or pnpm

## Project Setup

1.  **Place the Code:**
    *   Save the provided code as `Calendar.tsx` (or `.jsx`) within your Next.js project's components directory (e.g., `src/components/Calendar.tsx` or `app/components/Calendar.tsx`).
    *   You'll need to integrate this `Calendar` component into a page (e.g., `app/calendar-page/page.tsx`).

2.  **Install Dependencies:**
    Open your terminal in the project root and run:

    ```bash
    # Using npm
    npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

    # Or using yarn
    yarn add @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

    # Or using pnpm
    pnpm add @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
    ```

3.  **Shadcn/ui Setup (Dialog Component):**
    The component uses a `Dialog` from `@/components/ui/dialog`. This path suggests Shadcn/ui. If you haven't already set up Shadcn/ui in your project:

    *   **Initialize Shadcn/ui (if not done already):**
        ```bash
        npx shadcn-ui@latest init
        ```
        Follow the prompts. Ensure your `components.json` points to the correct path for UI components (e.g., ` "@/components/ui"`).

    *   **Add the Dialog component:**
        ```bash
        npx shadcn-ui@latest add dialog
        ```
        This will add the necessary dialog files to your `components/ui` directory.

4.  **Tailwind CSS Setup:**
    This project relies heavily on Tailwind CSS for styling. Ensure Tailwind CSS is correctly configured in your Next.js project.
    *   Make sure your `tailwind.config.js` (or `.ts`) includes the `darkMode: 'class'` strategy to enable dark mode toggling:
        ```javascript
        // tailwind.config.js
        /** @type {import('tailwindcss').Config} */
        module.exports = {
          darkMode: "class", // Important for the dark mode toggle
          content: [
            "./app/**/*.{js,ts,jsx,tsx,mdx}",
            "./pages/**/*.{js,ts,jsx,tsx,mdx}",
            "./components/**/*.{js,ts,jsx,tsx,mdx}",
            "./src/**/*.{js,ts,jsx,tsx,mdx}", // If using src directory
          ],
          theme: {
            extend: {},
          },
          plugins: [],
        };
        ```
    *   Ensure your global CSS file (e.g., `app/globals.css`) includes Tailwind's base directives:
        ```css
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        ```

5.  **Integrate the Calendar Component:**
    Import and use the `Calendar` component in one of your Next.js pages.

    *Example (`app/my-calendar/page.tsx`):*
    ```tsx
    // app/my-calendar/page.tsx
    import Calendar from '@/components/Calendar'; // Adjust path if necessary

    export default function MyCalendarPage() {
      return (
        <div>
          <h1 className="text-3xl font-bold text-center my-6">My Interactive Calendar</h1>
          <Calendar />
        </div>
      );
    }
    ```

## Running the Project

1.  **Start the Development Server:**
    ```bash
    # Using npm
    npm run dev

    # Or using yarn
    yarn dev

    # Or using pnpm
    pnpm dev
    ```

2.  **Open in Browser:**
    Navigate to `http://localhost:3000` (or the port your Next.js app is running on) and go to the page where you've integrated the `Calendar` component (e.g., `http://localhost:3000/my-calendar`).

## Special Instructions

*   **Dialog Component Path:** The import `import { Dialog, ... } from "@/components/ui/dialog";` assumes your Shadcn/ui components are located at `components/ui` relative to your configured path alias `@`. If your setup differs, adjust this import path accordingly.
*   **Local Storage:** Event data is stored in the browser's `localStorage` under the key `"events"`. Clearing your browser's local storage for the site will erase all saved events.
*   **FullCalendar Styling:**
    *   FullCalendar's core styles are generally included with its packages. If you encounter styling issues, you might need to explicitly import FullCalendar's CSS in your global styles or at the top of your `Calendar.tsx` component (though often not required with module bundlers).
    *   The component attempts to apply a dark theme to FullCalendar using the `fc-dark-theme` class. You might need to add custom CSS to fully style FullCalendar for dark mode if its default dark mode handling (via Tailwind's `dark` class on `<html>`) isn't sufficient for all elements.
    ```css
    /* Example for custom FullCalendar dark theme styling if needed in globals.css */
    .fc-dark-theme .fc-col-header-cell-cushion,
    .fc-dark-theme .fc-daygrid-day-number,
    .fc-dark-theme .fc-list-event-time,
    .fc-dark-theme .fc-list-event-title {
        color: #e2e8f0; /* Example: slate-200 */
    }

    .fc-dark-theme .fc-daygrid-day {
        background-color: #1e293b; /* Example: slate-800 for day cells */
    }

    .fc-dark-theme .fc-toolbar-title {
        color: #f8fafc; /* Example: slate-50 */
    }
    ```
    *However, the current implementation toggles the `dark` class on the `<html>` element, which Tailwind uses. FullCalendar plugins might automatically adapt if they are well-integrated with Tailwind's dark mode, or they might require specific theme props.*

*   **Conflict Detection Note:** For recurring events, conflict detection currently checks only the *first instance* being created. Subsequent instances might still conflict.

This README should provide a good starting point for setting up and running the calendar component within a Next.js project.