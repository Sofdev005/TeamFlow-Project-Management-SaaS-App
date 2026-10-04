# TeamFlow Web

Frontend for TeamFlow - a multi-tenant project & task management app (Next.js App Router + .NET 8 API).


<img width="7712" height="6685" alt="diagram (1)" src="https://github.com/user-attachments/assets/444b7d46-ff38-4f93-9b08-3764c35110e8" />

[![Architecture diagram](https://gitdiagram.com/diagram-badge.svg)](https://gitdiagram.com/sofdev005/teamflow-project-management-saas-app?utm_source=readme&utm_medium=badge)

## Screenshots


<img width="1338" height="649" alt="image" src="https://github.com/user-attachments/assets/117b9121-cb86-4b72-b33c-8455373d91d9" />
<img width="1345" height="646" alt="image" src="https://github.com/user-attachments/assets/e76e5dc9-1b3f-4cba-b3fc-6e77e20d4b63" />
<img width="1355" height="653" alt="image" src="https://github.com/user-attachments/assets/c66cda29-fea3-4d24-ab9d-451e2104969f" />

<img width="1357" height="645" alt="image" src="https://github.com/user-attachments/assets/b8b2a2cd-c78d-46b1-8d6c-b84affdb379b" />
## Stack

- Next.js 16.3.6 (App Router), React 19.2.8, TypeScript 5
- Tailwind CSS 4
- Axios (single `apiClient` with JWT + 401 interceptors)
- dnd-kit (Kanban drag & drop)

## Pages

| Route | Purpose |
|---|---|
| `/login` | Sign in |
| `/register` | Create account + organization |
| `/dashboard` | Overview stats, recent projects, quick create |
| `/projects` | Project list, create, delete |
| `/projects/[id]` | Kanban board: columns, tasks, drag & drop, task drawer |
| `/team` | Organization members + invite |
| `/settings` | Profile & org info (read-only - no backend endpoints yet) |

All app pages are wrapped in `DashboardLayout`, which enforces the auth guard
(redirects to `/login` until the stored session is hydrated).

## Run

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL if the API is not on localhost:5000
npm run dev
```

App runs on http://localhost:3000. The API must be reachable and allow CORS
from `http://localhost:3000` (the backend policy `AllowFrontend` already does).

## Backend contract this frontend expects

| Method | Route | Used by |
|---|---|---|
| POST | `/api/auth/register` | register |
| POST | `/api/auth/login` | login |
| GET | `/api/projects` | dashboard, projects |
| POST | `/api/projects` | project create |
| DELETE | `/api/projects/{id}` | project delete *(missing in current backend - UI surfaces an error)* |
| GET | `/api/tasks?projectId=` | board load (fallback: `/api/projects/{id}/tasks`) *(missing in current backend)* |
| POST | `/api/tasks` | task create |
| PATCH | `/api/tasks/{id}/move` | drag & drop persist |
| PUT | `/api/tasks/{id}` | task edit |
| DELETE | `/api/tasks/{id}` | task delete |
| GET | `/api/boards/columns/{projectId}` | board columns |
| POST | `/api/boards/columns` | add column |
| GET | `/api/organizations/members` | team page |
| POST | `/api/organizations/members/invite` | invite member |

Enum mappings used: `TaskPriority` Low=1 / Medium=2 / High=3 / Urgent=4;
`OrgRole` Owner=1 / Admin=2 / Manager=3 / Developer=4 / Viewer=5.

## Known backend gaps handled gracefully by this UI

1. `dotnet build` currently fails (`TasksController` uses `command.TaskId` but `UpdateTaskCommand` has `Id`).
2. No `CreateBoardColumnCommand` handler - adding a column falls back to a session-only column.
3. `GetColumns` filters by `BoardId`, not `ProjectId` - board falls back to default columns if the endpoint 404s.
4. No GET tasks endpoint - board shows a notice and empty columns instead of crashing.
5. No DELETE project endpoint - the UI shows a clear error instead of pretending it worked.
6. Drag & drop failures roll the board back and refresh, instead of leaving optimistic state diverged from the server.

Fix the backend items above to get full end-to-end behavior.
