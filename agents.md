# A Technical Specification of Pomofocus.io Agents and Capabilities

## Section 1: System Overview

### Introduction

This document provides a technical specification of the Pomofocus.io web application, modeled as a system of interconnected, stateful agents. Each agent encapsulates a distinct domain of functionality, such as time management, task handling, or user settings. This agent-based model is intended to provide an unambiguous and structured representation of the application's capabilities, states, and operational logic for technical integration, automation, and analysis. The system is designed around the Pomodoro Technique, a time management method that uses a timer to break work into focused intervals separated by short breaks.

### Global State Management

The behavior and capabilities of all agents within the Pomofocus system are governed by a set of global states. These states determine feature availability and the underlying architecture of the user session.

**Authentication Status**: The primary global state is `isAuthenticated: boolean`. This state dictates whether a user is operating anonymously or as a logged-in user. The transition to an authenticated state fundamentally alters the application's architecture. For an anonymous user, the application functions as a self-contained, client-side instance with state likely persisted in local browser storage. For an authenticated user, the application transitions to a client-server model. This architectural shift is necessitated by features such as the Mobile Alarm, which requires a backend server to register a device and send push notifications, a capability that cannot be managed solely within the browser. Consequently, an authenticated session enables server-side data persistence for tasks, settings, and reports, facilitating cross-device synchronization.

**Subscription Tier**: The second critical global state is `subscriptionTier: ('free' | 'premium')`. This state is only relevant when `isAuthenticated` is true and acts as the primary controller for feature flagging throughout the application. Access to advanced capabilities, such as third-party integrations, extended reporting, and unlimited templates, is contingent upon a 'premium' subscription status. The premium plan is available on a monthly or yearly auto-renewing subscription basis, with a 7-day free trial option.

## Section 2: Agent: TimerAgent

### Description

The TimerAgent is the central component of the Pomofocus application. It is responsible for managing all time-tracking states and executing the core logic of the Pomodoro Technique. It operates in distinct modes—Pomodoro, Short Break, and Long Break—and manages the transitions between them, either automatically or through user intervention.

### State Definition

The internal state of the TimerAgent can be modeled as follows:

- `currentMode: ('Pomodoro' | 'ShortBreak' | 'LongBreak')`: Represents the active timer mode. The duration for each mode is configurable via the SettingsAgent.
- `timerStatus: ('running' | 'paused' | 'stopped')`: Defines the operational status of the timer. 'stopped' is the initial state before a session begins or after it is reset.
- `timeRemaining: number`: The time left in the current session, measured in seconds. This value decrements when `timerStatus` is 'running'.
- `pomodorosCompletedInCycle: number`: A counter that tracks the number of completed 'Pomodoro' sessions. This counter is used by the system to determine when to trigger a 'LongBreak' mode, based on the 'Long Break interval' setting.

### Capabilities

The TimerAgent exposes a set of capabilities that allow for direct control over the timer's operation. These actions form the primary user interaction loop with the application's core functionality.

| Capability         | Parameters         | Description                                                                                                  | Preconditions                                |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| `startTimer()`     | None               | Begins or resumes the countdown. Sets `timerStatus` to 'running'.                                            | `timerStatus` must be 'paused' or 'stopped'. |
| `pauseTimer()`     | None               | Pauses the countdown. Sets `timerStatus` to 'paused'.                                                        | `timerStatus` must be 'running'.             |
| `resetTimer()`     | None               | Resets `timeRemaining` to the configured duration for the `currentMode` and sets `timerStatus` to 'stopped'. | None.                                        |
| `switchMode(mode)` | `mode: ('Pomodoro' | 'ShortBreak'                                                                                                 | 'LongBreak')`                                | Manually changes the `currentMode` and resets the timer to the new mode's configured duration. | None. |

## Section 3: Agent: TaskAgent

### Description

The TaskAgent is responsible for managing the entire lifecycle of user tasks. This includes creation, modification, prioritization, completion, and deletion. The agent provides the structural framework for users to list and organize the work they intend to accomplish during their focus sessions.

### State Definition

- `taskList: Task[]`: An ordered array of Task objects. The formal structure of the Task object is defined in the Appendix.
- `activeTaskId: string | null`: The unique identifier of the task currently selected for the active focus session. When a Pomodoro session is completed, the `actualPomodoros` count for this task is incremented.

### Capabilities

The TaskAgent supports a comprehensive set of actions for task management:

- `addTask(name, estimatedPomodoros)`: Creates a new task object and adds it to the `taskList`. The `estimatedPomodoros` parameter represents the user's estimate of how many 25-minute focus sessions the task will require.
- `updateTask(taskId, { name, estimatedPomodoros })`: Modifies the properties of an existing task identified by `taskId`.
- `deleteTask(taskId)`: Permanently removes a task from the `taskList`.
- `toggleTaskCompletion(taskId)`: Toggles the `isComplete` status of a specified task. This corresponds to checking or unchecking a task in the UI.
- `setActiveTask(taskId)`: Sets the `activeTaskId` state to the specified task's ID, linking subsequent timer activity to that task.
- `incrementEstimate(taskId)`: Increases the `estimatedPomodoros` count for a task by one. This is accessible via the Ctrl + I keyboard shortcut.
- `decrementEstimate(taskId)`: Decreases the `estimatedPomodoros` count for a task by one. This is accessible via the Ctrl + D keyboard shortcut.
- `clearFinishedTasks()`: Removes all tasks from the `taskList` where `isComplete` is true.
- `clearAllTasks()`: Empties the entire `taskList`, regardless of task completion status.
- `saveAsTemplate(task)`: A premium capability that saves a task's properties as a reusable template. A maximum of three templates can be saved on the free plan.

The TaskAgent's behavior is significantly influenced by the state of the IntegrationAgent. In its default, "native" mode, it manages a simple task model. However, when a Todoist integration is active (a premium feature), the agent enters an "integrated" mode. In this mode, it acts as a synchronization layer. Tasks can be imported from Todoist, and their data model within Pomofocus is enriched with fields like notes and due dates, which are sourced directly from Todoist. The completion status (`isComplete`) is synchronized bidirectionally between the two applications. This dual-mode operation means that the source of truth for task data can shift from Pomofocus to an external service, and actions like `updateTask` may trigger API calls to Todoist, representing a critical dependency for any automated interaction.

## Section 4: Agent: SettingsAgent

### Description

The SettingsAgent manages all user-configurable preferences. It serves as the single source of truth for parameters that control the behavior of the TimerAgent, the application's appearance, and notification systems. The high degree of customization offered is a core feature of the Pomofocus application.

### State Definition

The agent's state is a complex configuration object that mirrors the structure of the application's settings panel. It can be modeled with the following nested properties:

```
timerSettings:
  pomodoro: number (minutes)
  shortBreak: number (minutes)
  longBreak: number (minutes)
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  longBreakInterval: number (number of Pomodoros)
soundSettings:
  alarmSound: AlarmSound (enum, see Appendix)
  alarmVolume: number (range 0-100)
  alarmRepeat: number
  tickingSound: TickingSound (enum, see Appendix)
  tickingVolume: number (range 0-100)
themeSettings:
  colorTheme: string (hex color code or theme identifier)
  hourFormat: ('12h' | '24h')
  darkModeWhenRunning: boolean
notificationSettings:
  reminder: boolean (for the last minute of a session)
  mobileAlarm: { enabled: boolean, deviceId: string | null, type: ('Pomodoro' | 'Breaks' | 'Both' | 'None') }
integrationSettings:
  todoistConnected: boolean (Premium)
  webhookUrl: string | null (Premium)
```

### Capabilities

- `updateSetting(key, value)`: The primary capability for modifying any setting. The `key` parameter uses a dot-notation string (e.g., 'timerSettings.pomodoro') to target a specific value within the state object.

### Comprehensive Settings Specification

The following table provides a detailed specification for every user-configurable setting managed by the SettingsAgent.

| Setting Key                                | Description                                   | Data Type     | Accepted Values / Range                                              | Default Value | Requires Premium      |
| ------------------------------------------ | --------------------------------------------- | ------------- | -------------------------------------------------------------------- | ------------- | --------------------- |
| `timerSettings.pomodoro`                   | Duration of the focus session.                | number        | Integer (minutes)                                                    | 25            | No                    |
| `timerSettings.shortBreak`                 | Duration of the short break.                  | number        | Integer (minutes)                                                    | 5             | No                    |
| `timerSettings.longBreak`                  | Duration of the long break.                   | number        | Integer (minutes)                                                    | 15            | No                    |
| `timerSettings.autoStartBreaks`            | Automatically start breaks after a Pomodoro.  | boolean       | true / false                                                         | false         | No                    |
| `timerSettings.autoStartPomodoros`         | Automatically start Pomodoros after a break.  | boolean       | true / false                                                         | false         | No                    |
| `timerSettings.longBreakInterval`          | Number of Pomodoros before a long break.      | number        | Integer                                                              | 4             | No                    |
| `soundSettings.alarmSound`                 | Sound played at the end of a session.         | string (enum) | 'Kitchen', 'Bell', 'Bird', 'Digital', 'Wood'                         | 'Bell'        | No                    |
| `soundSettings.alarmVolume`                | Volume of the alarm sound.                    | number        | 0 - 100                                                              | 50            | No                    |
| `soundSettings.alarmRepeat`                | Number of times the alarm repeats.            | number        | Integer                                                              | 1             | No                    |
| `soundSettings.tickingSound`               | Background sound during sessions.             | string (enum) | 'None', 'Ticking Fast', 'Ticking Slow', 'White Noise', 'Brown Noise' | 'None'        | No                    |
| `soundSettings.tickingVolume`              | Volume of the ticking sound.                  | number        | 0 - 100                                                              | 50            | No                    |
| `themeSettings.colorTheme`                 | Main color theme for the timer.               | string        | Predefined theme identifiers                                         | 'default'     | No                    |
| `themeSettings.hourFormat`                 | Time display format.                          | string        | '12h', '24h'                                                         | '24h'         | No                    |
| `themeSettings.darkModeWhenRunning`        | Enable dark mode when the timer is active.    | boolean       | true / false                                                         | false         | No                    |
| `notificationSettings.reminder`            | Notify during the last minute of a session.   | boolean       | true / false                                                         | false         | No                    |
| `notificationSettings.mobileAlarm.enabled` | Enable push notifications to a mobile device. | boolean       | true / false                                                         | false         | No (Requires Account) |
| `integrationSettings.todoistConnected`     | Status of Todoist integration.                | boolean       | true / false                                                         | false         | Yes                   |
| `integrationSettings.webhookUrl`           | Webhook endpoint URL.                         | string        | Valid URL                                                            | null          | Yes                   |

## Section 5: Agent: ReportAgent

### Description

The ReportAgent is responsible for aggregating, processing, and presenting user productivity data. It provides visualizations of focus time and offers data export functionalities, allowing users to analyze their work patterns over various timeframes.

### State Definition

- `currentReportView: { dateRange: { from: Date, to: Date }, grouping: ('daily' | 'weekly' | 'monthly' | 'yearly') }`: Defines the parameters for the currently displayed report. The 'yearly' grouping is a premium feature.
- `reportData: any`: The structured dataset corresponding to the `currentReportView` parameters, used to render visual charts and summaries.

### Capabilities

- `generateReport(dateRange, grouping)`: Fetches and processes focus history data based on the specified date range and grouping level. This capability populates the `reportData` state.
- `downloadReport(format, { columns, delimiter })`: Exports the user's focus history to a file. This is a premium-only capability.
  - `format`: The file format, currently supporting 'CSV'.
  - `columns`: An array of strings specifying which data fields to include (e.g., 'Include Task', 'Focus Time').
  - `delimiter`: The character used to separate values in the CSV file, with options for 'Tab' or 'Comma'.

The ReportAgent clearly illustrates the application's freemium business model. The standard reporting features—daily, weekly, and monthly summaries—are designed for personal productivity tracking and are available to all users. These features provide intrinsic value by helping users reflect on their focus habits. The premium features, however, are oriented towards professional use cases. Yearly reports allow for long-term analysis, while the highly configurable CSV export functionality transforms Pomofocus from a simple timer into a data source for external systems. The ability to export raw data is intended for integration into larger professional workflows, such as generating client invoices, populating project management dashboards, or performing in-depth data analysis in spreadsheet software. This positions the premium version of the application as a tool for users who need to justify or analyze their time in a professional context.

## Section 6: Agent: UserAgent

### Description

The UserAgent manages user identity, authentication status, and subscription details. It serves as the gatekeeper for all authenticated features and handles the lifecycle of a user's account, from creation to deletion.

### State Definition

- `authenticationStatus: ('authenticated' | 'anonymous')`: The current authentication state of the session.
- `userEmail: string | null`: The email address associated with the authenticated user's account.
- `subscription: { tier: ('free' | 'premium'), nextBillingDate: Date | null, autoRenews: boolean }`: An object containing details of the user's subscription plan.

### Capabilities

- `login(email, password)`: Authenticates a user and transitions the `authenticationStatus` to 'authenticated'.
- `logout()`: De-authenticates the user and reverts the `authenticationStatus` to 'anonymous'.
- `getAccountDetails()`: Retrieves the current user's email and subscription information from the server.
- `updateEmail(newEmail)`: Changes the email address associated with the account.
- `cancelSubscription()`: Cancels the auto-renewal for a premium subscription.
- `deleteAccount()`: A destructive and irreversible action that permanently deletes the user's account and all associated data after user confirmation.

## Section 7: Agent: IntegrationAgent

### Description

The IntegrationAgent is a premium-only agent that manages data exchange and interoperability with third-party services. It transforms Pomofocus from a standalone application into a component that can be embedded within a user's broader digital ecosystem.

### State Definition

- `todoist: { isConnected: boolean, syncStatus: ('syncing' | 'idle' | 'error'), config: {...} }`: Manages the state of the Todoist integration, including connection status and synchronization activity.
- `webhook: { isEnabled: boolean, endpointUrl: string, events: ('start' | 'pause' | 'finish') }`: Manages the state of the Webhook integration. `events` specifies which TimerAgent events will trigger a data payload to be sent to the `endpointUrl`.

### Capabilities

- `connectTodoist(apiToken)`: Establishes an authenticated connection to a user's Todoist account.
- `importTodoistTasks()`: Fetches tasks from the connected Todoist account and populates the TaskAgent's `taskList`. It can parse estimated Pomodoros from the task title and import task descriptions as notes.
- `syncTodoistState(task)`: Pushes or pulls state changes, primarily task completion status, between Pomofocus and Todoist.
- `configureWebhook(url, events)`: Sets up a webhook by providing an endpoint URL and selecting the timer events (start, pause, finish) that should be transmitted. This allows for real-time integration with services like Zapier, Make, or IFTTT to automate workflows, such as updating a status in a messaging app or logging time in another tool.

This agent represents the most advanced functionality of the application. While the ReportAgent enables batch data export, the IntegrationAgent facilitates real-time, event-driven data flow. The Webhook capability sends data out of Pomofocus as actions occur, enabling immediate responses in other systems. The Todoist integration provides two-way synchronization, bringing data in and pushing updates back out. This level of interoperability allows Pomofocus to become an active participant in complex workflows, solidifying its value proposition for power users and professionals who rely on interconnected toolchains.

## Section 8: Wave 2 Feature Proposals

This section outlines proposed features for future development waves, building upon the current agent-based architecture. These features are categorized by implementation complexity and potential impact, providing a roadmap for enhancing the Pomodoro application's capabilities.

### Core Functionality Enhancements

1. **Persistent Data Storage** - Implement localStorage/sessionStorage to save timer state, tasks, and settings across browser sessions
2. **Keyboard Shortcuts** - Add global hotkeys (Space to start/pause, R to reset, T to switch modes, Ctrl+I/D for estimate adjustments)
3. **Ticking Sounds** - Implement background ticking sounds during Pomodoro sessions with volume control
4. **Reminder Notifications** - Browser notifications for the last minute of sessions and break reminders
5. **Task Templates** - Save frequently used tasks as templates for quick recreation (premium feature)
6. **Task Notes & Due Dates** - Add rich text notes and due date fields to tasks with calendar integration
7. **Auto-pause on Tab Switch** - Automatically pause timer when user switches browser tabs/windows
8. **Session History** - Track and display completed Pomodoro sessions with timestamps and task associations
9. **Daily/Weekly Goals** - Set and track daily Pomodoro completion goals with progress visualization
10. **Break Activities** - Suggest random break activities (stretching, hydration reminders) during breaks

### User Experience & Interface

11. **Dark Mode Toggle** - Implement dark theme that activates automatically when timer is running
12. **Custom Themes** - Allow users to create and save custom color schemes beyond the default three
13. **PWA Features** - Convert to Progressive Web App with offline functionality and install prompts
14. **Mobile-Responsive Design** - Optimize UI for mobile devices with touch-friendly controls
15. **Timer Presets** - Quick preset buttons for common timer configurations (15/5/10, 20/5/15, etc.)
16. **Visual Progress Indicators** - Add circular progress rings and animated backgrounds during sessions
17. **Sound Customization** - Expand alarm sound library with more options and custom sound uploads
18. **Notification Center** - In-app notification system for session completions, goals achieved, etc.
19. **Task Categories/Tags** - Organize tasks with color-coded categories and filtering options
20. **Drag & Drop Task Reordering** - Allow users to reorder tasks by dragging in the task list

### Advanced Features & Analytics

21. **Productivity Reports** - Generate detailed reports with charts showing focus time, task completion rates, and trends
22. **Streak Tracking** - Track consecutive days of goal completion with streak counters and badges
23. **Focus Music Integration** - Built-in ambient sounds or Spotify integration for background music during sessions
24. **Team Collaboration** - Multi-user features for shared workspaces and team productivity tracking
25. **Calendar Integration** - Sync tasks with Google Calendar/Outlook for due date management
26. **Data Export** - Export session data to CSV/PDF for external analysis (premium feature)
27. **Breathing Exercises** - Guided breathing sessions during breaks to improve focus and relaxation
28. **Smart Break Suggestions** - AI-powered break activity recommendations based on user preferences and time of day
29. **Habit Tracking Integration** - Connect with habit-tracking apps to log Pomodoro sessions as habit completions
30. **Webhook Integrations** - Send real-time notifications to external services (Slack, Discord, Zapier) on session events

## Section 9: Appendix: Data Models and Enumerations

### Task Object Model

The Task object is the primary data structure managed by the TaskAgent. Its properties are defined below.

| Field Name           | Data Type      | Description                                                     | Example                         | Source (Native/Todoist) |
| -------------------- | -------------- | --------------------------------------------------------------- | ------------------------------- | ----------------------- |
| `id`                 | string         | A unique identifier for the task.                               | 'task-12345'                    | Native                  |
| `name`               | string         | The display name or title of the task.                          | 'Write technical specification' | Native                  |
| `estimatedPomodoros` | number         | The user's estimate of Pomodoro sessions required.              | 4                               | Native                  |
| `actualPomodoros`    | number         | The actual number of Pomodoro sessions completed for this task. | 2                               | Native                  |
| `isComplete`         | boolean        | The completion status of the task.                              | false                           | Native                  |
| `note`               | string \| null | Additional notes or description for the task.                   | 'Focus on sections 1-3.'        | Todoist                 |
| `dueDate`            | Date \| null   | The due date of the task, used for sorting.                     | 2023-10-27T23:59:59Z            | Todoist                 |
| `externalId`         | string \| null | The ID of the task in the external system (e.g., Todoist).      | 'todoist-98765'                 | Todoist                 |

### Enumerations

The following are lists of accepted string literal values for specific settings managed by the SettingsAgent.

**AlarmSound**

- 'Kitchen'
- 'Bell'
- 'Bird'
- 'Digital'
- 'Wood'

**TickingSound**

- 'None'
- 'Ticking Fast'
- 'Ticking Slow'
- 'White Noise'
- 'Brown Noise'

# WAVE 3

- add a navigation bar
- the navigation bar needs to have the same colors as the theme colors
- the theme colors needs to be colors that safari supports for the address bar
