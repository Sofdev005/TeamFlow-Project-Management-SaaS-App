# TeamFlow Project Resume

> Frontend onboarding document for the `teamflow-web` workspace. Describes checked-in behavior as of this snapshot. Backend implementation details are not present in this repository and are labeled as unverified.

## 1. Project Overview & Tech Stack

TeamFlow is presented as a multi-tenant project and task management SaaS: users register a workspace/organization, create projects, and manage tasks on a three-column Kanban board. The frontend associates users/projects with `organizationId`, but tenant enforcement and isolation are backend responsibilities and cannot be verified here.

| Area | Exact technology in this checkout |
|---|---|
| Framework / runtime | Next.js `16.3.6` (App Router), React / React DOM `19.2.8`, TypeScript `^5` |
| Styling | Tailwind CSS `^4`, `@tailwindcss/postcss` `^4` |
| HTTP | Axios `^1.20.0`; login/register currently use browser `fetch` directly |
| Drag and drop | `@dnd-kit/core` `^6.3.1`, `@dnd-kit/sortable` `^10.0.0`, `@dnd-kit/utilities` `^3.2.2` |
| Other runtime libraries | `@microsoft/signalr` `^10.0.11` (dependency installed; no usage found under `src/`), `lucide-react` `^1.48.0`, `clsx` `^2.1.1`, `tailwind-merge` `^3.7.0` |
| Tooling | ESLint `^9`, `eslint-config-next` `16.3.6`, Node types `^20` |
| Backend named in project request | .NET 8, Clean Architecture, PostgreSQL, EF Core; **not included in this workspace and not independently verifiable from source** |

**Version correction:** the request mentions Next.js 15; the checked-in `package.json` specifies Next.js 16.3.6, React 19.2.8, and Tailwind CSS 4. Prefer the manifest over the request's version assumptions.

## 2. Architecture & Directory Structure

The frontend is a single Next.js App Router application rooted at `src/app`. Pages that use React state, browser storage, or event handlers are client components (`'use client'`). `src/app/layout.tsx` wraps all routes in `AuthProvider`.

| Path | Purpose |
|---|---|
| `/` (`src/app/page.tsx`) | Redirects to `/login` |
| `/login` | Login form; posts credentials and populates auth context |
| `/register` | Registration/workspace creation form; posts user and organization data |
| `/dashboard` | Lists projects, creates/deletes projects |
| `/projects` | Lists projects and links to their boards |
| `/projects/[id]` | Loads and manages a project's Kanban board |
| `src/components/DashboardLayout.tsx` | Shared navigation shell, user display, logout action |
| `src/components/BoardColumnContainer.tsx` | Droppable column and sortable task-list rendering |
| `src/components/TaskCard.tsx` | Sortable task card and priority display |
| `src/components/TaskSideDrawer.tsx` | Edit/delete task UI |
| `src/context/AuthContext.tsx` | In-memory auth state with browser `localStorage` persistence |
| `src/lib/apiClient.ts` | Shared Axios instance and JWT/401 interceptors |
| `src/services/projectService.ts` | Project API functions and project types |
| `src/services/taskService.ts` | Task API functions, types, and status/priority payload conversion |

**State and auth:** `AuthProvider` keeps `user` and `token` in React state. On mount, it reads `teamflow_token` and `teamflow_user` from `localStorage`; malformed user JSON clears both keys. `login()` updates state and stores both values; `logout()` clears both. `isAuthenticated` is `!!token`. The root layout supplies this provider globally. The inspected pages/layout do not implement a route guard: dashboard pages can render before auth hydration, while API calls rely on the Axios interceptor/backend response.

**API client:** `src/lib/apiClient.ts` creates an Axios instance with `baseURL = NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'` and JSON content type. Its request interceptor reads `teamflow_token` in the browser and sets `Authorization: Bearer <token>`. Its response interceptor clears both auth keys and redirects to `/login` on HTTP 401, then rejects the original error. This behavior applies only to calls made through `apiClient`, not direct `fetch` calls.

**Configuration:** `@/*` resolves to `src/*` (`tsconfig.json`). Tailwind is imported via `@import "tailwindcss"` in `src/app/globals.css`.

## 3. API Contracts & Services

The following are the frontend TypeScript contracts; they do not establish the exact .NET DTOs or validation rules.

| Interface | Fields |
|---|---|
| `TaskItem` | `id: string`; `title: string`; `projectId: string`; optional `description?: string`; `status?: string \| number`; `columnId?: string`; `order?: number`; `priority?: 'Low' \| 'Medium' \| 'High' \| number`; `createdAt?: string` |
| `BoardColumn` | `id: string`; `title: string`; `tasks: TaskItem[]` |
| `Project` | `id: string`; `name: string`; `organizationId: string`; `createdAt: string`; optional `description?: string` |
| `CreateTaskRequest` | `title: string`; `projectId: string`; `status: string`; optional `description?: string`; `columnId?: string`; `priority?: 'Low' \| 'Medium' \| 'High'` |
| `CreateProjectRequest` | `name: string`; `organizationId: string`; optional `description?: string` |
| Auth `User` | `id: string`; `email: string`; `fullName: string`; optional `organizationId?: string` |

### API routes observed in frontend source

The Axios routes below are relative to `NEXT_PUBLIC_API_URL` (or `http://localhost:5000/api`). Auth routes are direct absolute `fetch` URLs, currently hard-coded to localhost.

| Method | Route | Caller / behavior |
|---|---|---|
| `POST` | `http://localhost:5000/api/auth/login` | Login page; JSON body `{ email, password }`; expects a token and user fields |
| `POST` | `http://localhost:5000/api/auth/register` | Register page; JSON body `{ firstName, lastName, organizationName, email, password }` |
| `GET` | `/projects` | `projectService.getProjects()` |
| `GET` | `/projects/{projectId}` | `projectService.getProjectById()` |
| `POST` | `/projects` | `projectService.createProject(CreateProjectRequest)` |
| `DELETE` | `/projects/{projectId}` | `projectService.deleteProject()` |
| `GET` | `/projects/{projectId}/tasks` | Primary `taskService.getTasksByProjectId()` route; any error triggers fallback |
| `GET` | `/tasks?projectId={projectId}` | Fallback task-list route; response is returned directly |
| `POST` | `/tasks` | `taskService.createTask()`; transforms status and priority into integer enum fields |
| `PATCH` | `/tasks/{taskId}` | Primary `taskService.moveTask()` route; any error triggers fallback |
| `PUT` | `/tasks/{taskId}` | Move fallback; also used by `updateTask()` |
| `DELETE` | `/tasks/{taskId}` | `taskService.deleteTask()` |

**Task create payload built by service:** `{ title, description: data.description || '', projectId, status: 0|1|2, statusName: data.status, columnId: data.columnId || data.status, priority: 0|1|2 }`. Status map is `Todo -> 0`, `InProgress -> 1`, `Done -> 2`; priority map is `Low -> 0`, `Medium -> 1`, `High -> 2`. Unknown statuses default to `0`; unknown priority defaults to `1`.

**Move payload built by service:** `{ status: 0|1|2, columnId: status, order: newOrder }`. `moveTask()` tries `PATCH`, then tries `PUT` if the patch call rejects. `updateTask()` sends the supplied partial task object as-is via `PUT` (the drawer currently converts priority to a number before passing it).

## 4. Core Workflows & Logic

### Authentication

- Login submits `{ email, password }` with `fetch('http://localhost:5000/api/auth/login', { method: 'POST' })`; it does **not** use `apiClient` and therefore does not share its configured base URL or automatic 401 handling.
- On success, the page reads `data.token` and maps response aliases into a user: `id || userId`, `email || submittedEmail`, `fullName || firstName/lastName || 'Developer'`, and `organizationId || orgId`.
- `useAuth().login()` writes the token to `teamflow_token`, serializes the user to `teamflow_user`, updates context state, then the page routes to `/dashboard`.
- Registration follows the same persistence path after `POST /api/auth/register`; it splits full name into first and last name and sends organization name.
- Axios requests attach the stored JWT as a bearer token. An Axios 401 clears the two local-storage entries and sends the browser to `/login`. Direct `fetch` calls do not pass through that interceptor.
- Logout clears context and local storage, then the shared layout navigates to `/login`.

### Kanban drag and drop

- The board defines three columns: `todo` / `To Do`, `in-progress` / `In Progress`, `done` / `Done`.
- `DndContext` uses a `PointerSensor` with a 5-pixel activation distance and `collisionDetection={closestCorners}`. There is no `closestContainer` function/configuration in the current code.
- Each column uses `useDroppable({ id: column.id })` and `SortableContext` with `verticalListSortingStrategy`; each task card uses `useSortable({ id: task.id })`.
- `handleDragOver` immediately updates local `columns` when a task crosses columns: remove it from its source, change its `columnId`, append it to the target. This is optimistic UI behavior while dragging across containers; it does not invoke the API.
- On `handleDragEnd`, the board finds the destination column and task index, converts the column to API status, and calls `taskService.moveTask(taskId, apiStatus, index)`. Sync failures are logged as `Backend move sync pending`; the board is not rolled back or re-fetched on failure. Within-column reorder persistence depends on the resulting `targetCol.tasks` order.
- `fetchBoard()` fetches tasks and groups each one into the configured columns using `mapStatusToColumnId`; a fetch failure logs and displays empty columns.

### Status and column mapping (important)

| Direction | Current conversion |
|---|---|
| Backend task status -> frontend column | `mapStatusToColumnId(status, rawColumnId)` stringifies/lowercases the supplied status (if defined; otherwise the raw column ID). `'2'`, values containing `done` or `complete` map to `done`; `'1'`, values containing `progress` or `doing` map to `in-progress`; everything else defaults to `todo`. |
| Frontend column -> API status string | `mapColumnIdToApiStatus('todo') -> 'Todo'`; `'in-progress' -> 'InProgress'`; `'done' -> 'Done'`; unknown IDs default to `'Todo'`. |
| API status string -> integer enum (create/move service) | `Todo -> 0`; `InProgress -> 1`; `Done -> 2`; unknown values default to `0`. Create also sends the original exact string as `statusName`; move sends the string in `columnId`. |

Consequences: numeric .NET enum values `0/1/2` map to the three frontend columns. C#-style strings `Todo`, `InProgress`, and `Done` also map via substring checks (case-insensitive after lowercasing). A defined `status` takes precedence over `rawColumnId`, even if the latter has a more useful value. Unknown status values are silently treated as `todo` on load and `Todo` on outbound mapping.

### Create, edit, delete

- New task UI records target column in `activeColumnForTask`, requires a nonblank title, and sends `createTask` with medium priority. On success it clears form state and re-fetches the board. The UI waits for the server; **there is no `task-${Date.now()}` temporary ID generation in this checkout**.
- Task drawer edits title, description, and priority. Priority is converted to its integer enum before `PUT /tasks/{id}`. A successful save or delete triggers `fetchBoard()` and closes the drawer.
- Project creation includes the current user's organization ID or an empty string if auth context has not loaded. Project and task deletion use confirmation dialogs.

## 5. Key Variables & State Hooks

### Project board (`src/app/projects/[id]/page.tsx`)

| State / value | Purpose |
|---|---|
| `projectId` | Route parameter from `useParams()` |
| `columns` | Board columns with nested task arrays; source of displayed board state |
| `loading` | Initial/reload board loading indicator |
| `selectedTask` | Task currently selected for the detail drawer |
| `isDrawerOpen` | Drawer visibility |
| `activeColumnForTask` | Target column and visibility switch for add-task modal |
| `newTaskTitle` | Add-task form title input |
| `creatingTask` | Add-task submission pending state |
| `taskError` | Add-task validation/server error |
| `sensors` | dnd-kit pointer sensor setup |
| `COLUMNS_CONFIG` | Local column IDs, labels, and API status strings |

The board does **not** currently contain a local `activeId` state or temporary task ID state. Drag active/over identifiers come from dnd-kit events.

### Other important state

- Auth context: `user`, `token`; derived `isAuthenticated`.
- Dashboard: `projects`, `loading`, `isModalOpen`, `projectName`, `projectDescription`, `creating`, `modalError`.
- Task drawer: `title`, `description`, `priority`, `saving`, `deleting`, `error`.

## Active State & Caveats for the Next Assistant

- Workspace scanned: frontend only. No `.cs`, `.csproj`, `.sln`, PostgreSQL schema/migrations, or backend project files were found. Treat .NET 8/Clean Architecture/PostgreSQL/EF Core as requester-supplied context, not verified architecture. Confirm against the backend repository before changing API contracts.
- Auth endpoints are hard-coded to `http://localhost:5000`; the Axios base URL is configurable. This can cause environment mismatch outside local development.
- The task-list and move fallbacks catch all errors, not just unsupported-route/method responses. The fallback may mask an actual backend or network failure.
- Kanban drop state is optimistic but is not reverted if persistence fails.
- `@microsoft/signalr` is present in dependencies, but no SignalR client usage was found in `src/`; do not assume live updates are active.
- No temporary task ID (`task-${Date.now()}`) is present; creation only reflects server-returned tasks after a board refresh.
- Navigation links for `/team` and `/settings` exist in `DashboardLayout`, but corresponding route pages were not found in the listed app tree.

## Running the Frontend

Requires Node.js/npm and the API at the configured URL for live data. From this directory:

```bash
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` can override the Axios API base (include the `/api` prefix if the backend expects it). Login and registration currently remain hard-coded to `http://localhost:5000/api` regardless of that variable. Other scripts in `package.json`: `npm run build`, `npm run start`, `npm run lint`.
