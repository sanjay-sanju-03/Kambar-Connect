# Kambar-Connect

Kasargod Bus Guide is a mobile-first web app for scheduled private-bus departure times between New Bus Stand and Kambar. It helps passengers quickly find the next bus and browse the full timetable.

The app includes English and Malayalam text, route search, next-bus status, full timetable cards, bus stop details, and a hidden `/admin` management route. It does not provide live GPS tracking.

> Timings may change and buses may be delayed. Please allow extra time.

## Stack

- React 18 + Vite for the frontend
- Express for the backend API
- JSON or MongoDB Atlas schedule storage
- Email/password admin authentication with HTTP-only sessions
- No live GPS tracking

## Run locally

```powershell
npm install
npm run server
```

Open a second terminal in this folder:

```powershell
npm run dev
```

Then open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The frontend falls back to the bundled community timetable if the API is offline. Update `server/data/schedule.json` with verified bus names and departure times.

Create a `.env` file from `.env.example`, then set:

- `MONGODB_URI` for MongoDB Atlas storage
- `SESSION_SECRET` for signed admin sessions
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` for admin login

Without `MONGODB_URI`, the app uses the JSON timetable and local environment-based admin login.

## API

- `GET /api/health` — health check
- `GET /api/schedule` — current schedule and metadata
- `GET /api/routes/:routeId/trips` — trips for one direction
- `POST /api/suggestions` — accepts a short timetable correction for review
- `POST /api/admin/login` — admin sign-in
- `POST /api/admin/logout` — admin sign-out
- `GET /api/admin/session` — verify an admin session
- `PUT /api/admin/schedule` — save a timetable with admin authentication
# Kambar-Connect

