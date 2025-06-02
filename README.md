# Flam Calendar

Flam Calendar is a feature-rich interactive calendar application built with Next.js, React, FullCalendar, Tailwind CSS, and Shadcn/ui. It allows users to manage their events efficiently with features like event creation, editing, deletion, recurrence, conflict detection, color-coding, filtering, dark mode, and local storage persistence.

## Key Features

*   **Full-Featured Calendar:** View events by month, week, or day using FullCalendar.
*   **Event Management:**
    *   Create new events with title, description, start/end times, and color.
    *   Edit existing events.
    *   Delete individual events or entire recurring series.
*   **Recurring Events:** Add daily, weekly, or monthly recurring events (creates a set number of future instances).
*   **Conflict Detection:** Get alerted if a new or modified event time conflicts with existing events.
*   **Color Coding & Filtering:**
    *   Assign custom colors to events.
    *   Filter the calendar view and event list by one or more event colors.
*   **Dark Mode:** Seamlessly switch between light and dark themes. The preference is saved in local storage.
*   **Local Storage Persistence:** All events are saved in the browser's local storage, so your schedule persists across sessions.
*   **Event Tooltips:** Hover over an event in the calendar to see its description.
*   **Responsive UI:** Designed with Tailwind CSS for a great experience on all device sizes.
*   **Modern Dialogs:** Uses Shadcn/ui for clean and accessible dialogs for event management.
*   **Event Sidebar:** A list of currently displayed events for quick reference and access.

## Tech Stack

*   **Frontend:** React, Next.js (App Router)
*   **Calendar:** FullCalendar (@fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/interaction)
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn/ui (specifically Dialog)
*   **Language:** TypeScript

## Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (v9.x or later), yarn, or pnpm

## Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/rithinsai-dev/Flam-calendar.git
    cd Flam-calendar
    ```

2.  **Install Dependencies:**
    This project uses npm.
    ```bash
    npm install
    ```
    *(If you prefer yarn or pnpm, you can use `yarn install` or `pnpm install` respectively, but ensure `package-lock.json` is either deleted or your chosen lock file is prioritized).*

3.  **Set up Shadcn/ui (if not already configured by the project):**
    The project relies on Shadcn/ui for dialog components. If the `components/ui` directory is minimal or missing, you might need to initialize Shadcn/ui and add the dialog component.
    *   **Initialize Shadcn/ui (if needed):**
        ```bash
        npx shadcn-ui@latest init
        ```
        Follow the prompts. This will create `components.json` and set up paths. Ensure your settings align with the project's structure (e.g., using `@/components/ui`).
    *   **Add the Dialog component:**
        ```bash
        npx shadcn-ui@latest add dialog
        ```
        This will add the necessary dialog files to your `components/ui` directory.

4.  **Verify Tailwind CSS Configuration:**
    Ensure your `tailwind.config.js` (or `.ts`) has `darkMode: "class"` enabled:
    ```javascript
    // tailwind.config.js or tailwind.config.ts
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      darkMode: "class",
      // ... other configurations
    };
    ```
    And your global CSS file (e.g., `app/globals.css`) includes Tailwind's base directives:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```

## Running the Application

1.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    *(Or `yarn dev` / `pnpm dev`)*

2.  **Open in Browser:**
    Navigate to `http://localhost:3000` (or the port specified in your terminal) to view the application. The calendar component is likely integrated into a page like `/` or a specific route like `/calendar`.

## Output Screenshots

*(Please replace the bracketed text with actual screenshots of your application)*

1.  **Main Calendar View (Light Mode):**
    Shows the FullCalendar interface with events displayed.
    `[Image: Main calendar view with some events, light mode, color filters visible on the left]`

2.  **Event Creation/Editing Dialog:**
    Illustrates the dialog used for adding or modifying an event.
    `[Image: Dialog open for adding a new event, showing fields for title, description, time, color, and recurrence]`

3.  **Calendar with Filtered Events:**
    Demonstrates the color filtering feature in action.
    `[Image: Calendar view showing only events of a specific color after applying a filter, with the selected color filter highlighted]`

4.  **Dark Mode View:**
    Shows the application in dark mode.
    `[Image: Main calendar view in dark mode, demonstrating the theme change]`

5.  **Event List Sidebar:**
    Displays the list of events currently visible in the calendar.
    `[Image: Sidebar on the left listing current events, with their titles, times, and color indicators]`

6.  **Event Tooltip:**
    Shows the tooltip appearing when hovering over an event.
    `[Image: Calendar view with a mouse cursor hovering over an event, and a small tooltip box displaying the event's description]`

## Project Structure Highlights

*   `app/`
    *   `(pages)/page.tsx` or similar: Likely where the `<Calendar />` component is rendered.
*   `components/`
    *   `Calendar.tsx`: The core interactive calendar component.
    *   `ui/`: Contains Shadcn/ui components (e.g., `dialog.tsx`).
*   `public/`: For static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `components.json`: Shadcn/ui configuration.

## Notes

*   **Local Storage:** Event data is stored in the browser's `localStorage` under the key `"events"`. Clearing your browser's local storage for the site will erase all saved events.
*   **Conflict Detection:** For recurring events, conflict detection currently checks only the *first instance* being created. Subsequent instances might still conflict.

---

Remember to replace the `[Image: ...]` placeholders with your actual screenshots! You can embed images in Markdown like this:
`![Alt text for image](path/to/your/screenshot.png)`
If your images are in the repository, use relative paths. If they are hosted online, use the full URL.