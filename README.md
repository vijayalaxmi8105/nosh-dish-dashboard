\# Nosh Dish Dashboard



A dish dashboard with local draft editing, backend validation, and optimistic locking (a `version` field) so that two people editing the same dish cannot silently overwrite each other.



\*\*Stack:\*\* Node 24, Express, better-sqlite3 (SQLite), React (Vite), plain CSS.



\## Prerequisites



\- Node.js 24 (or a recent version with built-in `fetch`)

\- npm

\- Git



\## Setup



\### 1. Backend



```

cd backend

npm install

copy .env.example .env

npm run seed

npm start

```



The API runs on http://localhost:4000.



`backend/.env.example`:



```

PORT=4000

DB\_PATH=./data/dishes.db

```



`npm run seed` loads `data/dishes.json` (5 dishes). It uses `INSERT OR IGNORE`, so running it again adds no duplicates and never overwrites edited dishes.



\### 2. Frontend (in a second terminal)



```

cd frontend

npm install

copy .env.example .env

npm run dev

```



Open the URL Vite prints (usually http://localhost:5173).



`frontend/.env.example`:



```

VITE\_API\_URL=http://localhost:4000

```



(On macOS/Linux, use `cp` instead of `copy`.)



\## API



\### GET /dishes



Returns all dishes.



```

curl http://localhost:4000/dishes

```



\### PATCH /dishes/:dishId



Updates `dishName` and `isPublished`. The body must include `expectedVersion`, the version the client last saw.



```

curl -X PATCH http://localhost:4000/dishes/1 -H "Content-Type: application/json" -d "{\\"dishName\\":\\"Jeera Rice\\",\\"isPublished\\":true,\\"expectedVersion\\":1}"

```



| Status | Meaning |

|--------|---------|

| 200 | Saved. Returns the updated dish with `version` increased by 1. |

| 400 | Validation failed (wrong types, name over 200 characters, or publishing with an empty name or a non-http/https image URL), or malformed JSON. |

| 404 | Dish not found. |

| 409 | Version conflict. Returns `{ error, current }` where `current` is the latest saved dish. |



Validation rules: a published dish must have a non-empty (trimmed) name and an `imageUrl` that is a valid http/https URL.


## Architecture

- **backend/**: Express API with a SQLite database.
  - `src/db.js`: schema and connection (WAL mode)
  - `src/seed.js`: seeds from `data/dishes.json`
  - `src/dishRepo.js`: data access, including the atomic versioned update
  - `src/validate.js`: request validation
  - `src/server.js`: routes and error handlers
- **frontend/**: React (Vite) app.
  - `src/api/dishesApi.js`: fetch wrapper
  - `src/components/DishCard.jsx`: draft editing, Save/Discard, conflict handling
  - `src/App.jsx`: loading, error and empty states, and polling

## Design decision: optimistic locking with one atomic UPDATE

The version check and the write happen in a single SQL statement:

```sql
UPDATE dishes SET ..., version = version + 1 WHERE dishId = ? AND version = ?
```

If no row was changed, the version was stale and the API returns 409 with the current dish. A separate read-then-write would leave a gap where two requests could both pass the check. One statement avoids that gap, and SQLite runs it atomically.

## Frontend behavior

- Each card keeps a local **draft**, separate from the last saved values. Edits show an "Unsaved changes" badge.
- **Save** sends the draft with the version the card loaded. **Discard** resets the draft to the saved values.
- On a failed save (for example, the server is down), the draft stays and an error shows, so the user can retry.
- On **409**, the draft is kept and a message appears. **Reload latest** replaces the draft with the server copy, after a confirmation warning.

## Bonus: polling for external updates

The app polls `GET /dishes` every 5 seconds.

- A card with **no draft** updates automatically.
- A card with an **unsaved draft** is never overwritten. It shows "Newer saved data available" instead. Save then gives a normal conflict, and Discard loads the newer data.
- The timer is cleared when the component unmounts.
- If a poll fails, the cards stay as they are, a "Connection lost" message shows, and polling retries on the next tick. The message disappears when the server is back.

## Verification steps

Run the backend and frontend as described in Setup, then check each of these.

1. **Seed without duplicates:** `npm run seed` twice. The first run adds 5 dishes, the second adds 0 and the total stays 5.
2. **Seed does not overwrite edits:** edit a dish, run `npm run seed`, then `curl http://localhost:4000/dishes`. The edit and its version are unchanged.
3. **Valid save:** change a name and click Save. The version goes up by 1.
4. **Stale save (409):** open the app in two tabs, save in tab A, then save in tab B. Tab B shows the conflict message and keeps its draft. Reload latest works.
5. **Wrong type (400):** send `"dishName": 123` with curl.
6. **Empty name while publishing (400):** send `"dishName": ""` with `"isPublished": true`.
7. **Unknown dish (404):** `curl -X PATCH http://localhost:4000/dishes/999 ...`
8. **Bad image URL (400):** run `node src/addTestDish.js` in `backend`. It inserts `test-bad-url`, a dish whose `imageUrl` is `not-a-valid-url`. Try to publish it with curl. The API returns 400 and the dish stays unpublished at version 1. Delete the test dish afterward.
9. **Persistence:** stop the backend, run `npm start` again. Saved edits are still there.
10. **Failed save:** stop the backend, edit and Save. The draft stays and an error shows. Restart the backend and click Save again. It succeeds.
11. **Concurrency:** `node src/concurrencyTest.js` in `backend` sends two simultaneous PATCHes with the same `expectedVersion`. One returns 200, the other 409, and the script prints PASS. It changes dish 5 and then restores its name.
12. **Polling:** change a dish with curl while the app is open. A card with no draft updates within 5 seconds. With an unsaved draft, the draft is kept and the "newer saved data" message shows.
13. **Disconnect:** stop the backend. "Connection lost" appears. Restart it and the message clears by itself.

## Known limitations

- No authentication.
- Only `dishName` and `isPublished` are editable. `imageUrl` is read-only.
- Polling is simple (every 5 seconds). SSE or WebSockets would be more efficient.
- Dishes deleted on the server are not removed from an open page until it is refreshed.
- Tests were done manually. There are no automated test suites, apart from the concurrency script.

## Time spent

Approximately Approximately 1 hour 15 minutes. 

## AI and reused-code disclosure

AI assistance (Claude) was used for planning, writing code, and debugging. I ran and tested everything myself. No code was copied from other projects, other than standard library and framework usage.