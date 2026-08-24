# Project Summary — Movie Ticket Booking (In-Memory)

## 1. What was asked (prompt by prompt)

| # | Prompt | What it meant |
|---|--------|----------------|
| 1 | Build a movie ticket booking app per `context.md`, using in-memory storage. Review requirements & correct mistakes first. Make data models. Write business logic for **seat booking → payment (simulated) → notification**. Handle: booking an unavailable seat, cancellation, cancelling a seat that isn't booked. Write unit tests for happy flow + those edge cases. Keep it simple, no heavy dependencies, no extra scope. | Full first version of the app. |
| 2 | Reference everything generated earlier. **Remove payment and notification code.** **Add search/listing** (city → locality → theatre → language/format). New code must link directly to existing modules/data models. Keep it simple. | Second version — trimmed scope, added discovery flow. |
| 3 | (this prompt) Summarize the whole chat: prompts, mistakes found, how they were fixed, data models, files generated and how they work. | This document. |

## 2. Mistakes found in the original requirements (`context.md`) and fixes

| Issue in original spec | Problem | Fix |
|---|---|---|
| `Theatre_seats(theatre_id, movie_id, Seats[])` **and** `seats(movie_id, theatre_id, ...)` as two overlapping models | A theatre plays the same movie multiple times a day (different times/language/format). Seats keyed by `(movie_id, theatre_id)` would incorrectly share one seat map across all of those screenings. | Merged both into one **`Show`** entity — a specific `(movie, theatre, language, format, startTime)` combination. Seats belong to a **Show**, not to a movie/theatre pair. |
| `Movie.theatres` field + `Theatre.ref: Movie` | Circular embedded reference between Movie and Theatre; redundant once a join entity exists. | Removed both — `Show` is the single join between Movie and Theatre. |
| `seats.user_id` stored directly on the seat | Loses booking history; awkward to look up "which booking does this seat belong to" for cancellation. | Seat keeps a `bookingId` back-reference instead; the `Booking` entity owns `userId` + the list of `seatIds`. |
| No `Booking` entity in the original models | Required to cancel a specific booking (possibly multiple seats) rather than one seat in isolation, and to track CONFIRMED/CANCELLED state. | Added `Booking(id, showId, userId, seatIds[], amount, status, createdAt, cancelledAt)`. |
| Discount coupons mentioned in requirements | Not part of the explicit task list (booking/cancel/payment/notification, then search). Implementing it would violate "don't add anything extra." | Intentionally **not implemented** — flagged instead of silently added or silently dropped. |

## 3. Data models (`src/models/index.js`)

| Model | Fields | Purpose |
|---|---|---|
| `Movie` | `id, name, durationMins, language, format, cost` | Static movie info. |
| `Theatre` | `id, name, city, locality` | Static theatre info, used for city/locality search. |
| `Show` | `id, movieId, theatreId, language, format, startTime` | One screening. Links Movie ↔ Theatre. Corrected model (see §2). |
| `Seat` | `id, showId, row, column, price, status, bookingId` | Belongs to a `Show`. `status`: `AVAILABLE` \| `BOOKED`. `bookingId` set only when booked. |
| `User` | `id, name` | Minimal user info. |
| `Booking` | `id, showId, userId, seatIds[], amount, status, createdAt, cancelledAt` | One booking transaction. `status`: `CONFIRMED` \| `CANCELLED`. |

Enums `SeatStatus` and `BookingStatus` live in the same file.

## 4. Files generated and how they work

```
src/
  models/index.js          data model factories + enums (§3)
  errors.js                typed errors used across services
  store/inMemoryStore.js   in-memory Maps for every model + reset() for tests
  services/
    bookingService.js      bookSeats() + cancelBooking()
    searchService.js       listMoviesByCity(), getAvailableSeats()
test/
  bookingService.test.js   5 tests: happy flow + edge cases
  searchService.test.js    3 tests: city/locality/format filtering, seat availability
package.json               "test": "node --test" (zero external dependencies)
```

**`inMemoryStore.js`** — one `Map` per model (`movies`, `theatres`, `shows`, `seats`, `users`, `bookings`), exposed via getters so `reset()` (used before every test) is visible everywhere that imports the store.

**`bookingService.js`**
- `bookSeats({ userId, showId, seatIds })`:
  1. Validates the `Show` and every `Seat` exist and belong to that show.
  2. If **any** requested seat isn't `AVAILABLE` → throws `SeatNotAvailableError`, **nothing is booked** (all-or-nothing).
  3. Otherwise marks all requested seats `BOOKED` immediately and links them to a new `Booking` (`status: CONFIRMED`).
  4. *(Payment and notification steps from v1 were removed in v2 per prompt 2 — booking now ends here.)*
- `cancelBooking(bookingId)`:
  1. Throws `BookingNotFoundError` if the booking doesn't exist.
  2. Throws `BookingAlreadyCancelledError` if it's already cancelled (covers "cancelling a seat that isn't booked").
  3. Otherwise frees all its seats back to `AVAILABLE`, clears `bookingId`, sets `status: CANCELLED`.

**`searchService.js`** (added in v2, reuses the same store/models — no new models needed)
- `findTheatresByCity(city, locality?)` — filters `store.theatres`.
- `findShowsByTheatre(theatreId, { language?, format? })` — filters `store.shows`.
- `listMoviesByCity(city, { locality?, language?, format? })` — implements the required **city → locality → theatre → language/2D-3D** listing; joins each `Show` to its `Movie`.
- `getAvailableSeats(showId)` — filters `store.seats` by `SeatStatus.AVAILABLE`; the natural next step after picking a show from search results, before calling `bookSeats`.

## 5. Unit tests

**`bookingService.test.js`** (5 tests)
1. Happy flow — books available seats, booking is `CONFIRMED`, seats become `BOOKED`, untouched seats stay `AVAILABLE`.
2. Edge case — booking a seat that's already `BOOKED` throws `SeatNotAvailableError`; other requested seats stay untouched (no partial booking).
3. Cancellation — cancelling a `CONFIRMED` booking frees its seat, and the freed seat can be booked again by another user.
4. Edge case — cancelling a booking ID that doesn't exist throws `BookingNotFoundError`.
5. Edge case — cancelling an already-cancelled booking throws `BookingAlreadyCancelledError`.

**`searchService.test.js`** (3 tests)
1. Lists movies for a city, grouped by theatre, excluding theatres in other cities.
2. Narrows results correctly by `locality`, `language`, and `format` (2D/3D).
3. Returns only seats with `status: AVAILABLE` for a given show.

All 8 tests pass via `npm test` (Node's built-in `node:test` runner — zero external dependencies).

## 6. Stack notes

- Plain Node.js, CommonJS, no frameworks.
- No database — pure in-memory `Map`s, reset per test.
- No test library installed — Node 22's built-in `node:test` + `assert` cover happy-path and edge-case assertions.
- Payment and notifications were implemented in v1, then explicitly removed in v2 per your request — current codebase has no payment/notification code.
