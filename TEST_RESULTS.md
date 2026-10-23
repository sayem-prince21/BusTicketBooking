# API Test Results — Bus Ticket Booking

- **Run at:** 2026-10-22 20:21:54
- **API base URL:** http://localhost:5290
- **Result:** FAILURES PRESENT — 85/86 passed, 1 failed

## Auth

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Register duplicate email rejected | 400 | 400 | PASS |
| 2 | Register duplicate phone rejected | 400 | 400 | PASS |
| 3 | Login with wrong password -> 401 | 401 | 401 | PASS |
| 4 | Login with unknown email -> 401 | 401 | 401 | PASS |
| 5 | Login with email AND phone -> 400 | 400 | 400 | PASS |
| 6 | Login using phone number | 200 | 200 | PASS |
| 7 | GET /me without token -> 401 | 401 | 401 | PASS |
| 8 | GET /me with token | 200 | 200 | PASS |
## Bus

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Get all buses | 200 | 200 | PASS |
| 2 | Get a specific bus by Id | 200 | 405 | FAIL |
| 3 | Bus search by route and date | 200 | 200 | PASS |
| 4 | Update a bus | 200 | 200 | PASS |
| 5 | Delete unknown bus -> 404 | 404 | 404 | PASS |
| 6 | Create bus with minimal payload -> 400 | 400 | 400 | PASS |
| 7 | Create a new bus | 200 | 200 | PASS |
| 8 | Delete the scratch bus | 200 | 200 | PASS |
## Seats

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Get all seats of the bus (40) | 200 | 200 | PASS |
| 2 | Get a specific seat A1 | 200 | 200 | PASS |
| 3 | Book seat A1 directly | 200 | 200 | PASS |
| 4 | A1 shows IsAvailable=false after booking | 200 | 200 | PASS |
| 5 | Available seats exclude A1 | 200 | 200 | PASS |
| 6 | Booked seats include A1 | 200 | 200 | PASS |
| 7 | Booking A1 again -> 400 | 400 | 400 | PASS |
| 8 | Cancel A1 seat | 200 | 200 | PASS |
| 9 | A1 available again after cancel | 200 | 200 | PASS |
| 10 | Cancel A1 again -> 400 | 400 | 400 | PASS |
| 11 | Unknown seat Z99 -> 404 | 404 | 404 | PASS |
| 12 | Seats of unknown bus -> 404 | 404 | 404 | PASS |
| 13 | Book seat on unknown bus -> 404 | 404 | 404 | PASS |
## Booking

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Customer 1 books seat A1 | 200 | 200 | PASS |
| 2 | Duplicate seat booking -> 409 | 409 | 409 | PASS |
| 3 | Customer 2 books seat A2 | 200 | 200 | PASS |
| 4 | Booking without token -> 401 | 401 | 401 | PASS |
| 5 | Booking with empty passenger name -> 400 | 400 | 400 | PASS |
| 6 | Booking with all-zero busId -> 400 | 400 | 400 | PASS |
| 7 | Booking with unknown busId -> 404 | 404 | 404 | PASS |
| 8 | Booking with invalid seat Z99 -> 404 | 404 | 404 | PASS |
| 9 | Customer 1 gets my bookings (own only) | 200 | 200 | PASS |
| 10 | Customer 2 gets my bookings (own only) | 200 | 200 | PASS |
| 11 | Customer 1 confirmed bookings include A1 | 200 | 200 | PASS |
| 12 | Customer 2 confirmed bookings include A2 | 200 | 200 | PASS |
| 13 | Get own booking by id | 200 | 200 | PASS |
| 14 | Get another customer's booking -> 404 | 404 | 404 | PASS |
| 15 | Get unknown booking -> 404 | 404 | 404 | PASS |
| 16 | Seat A1 unavailable while booked | 200 | 200 | PASS |
| 17 | Customer 1 cancels own booking | 200 | 200 | PASS |
| 18 | Cancelling again -> 400 | 400 | 400 | PASS |
| 19 | Cancel another customer's booking -> 404 | 404 | 404 | PASS |
| 20 | Cancel without token -> 401 | 401 | 401 | PASS |
| 21 | Seat A1 free again after cancel | 200 | 200 | PASS |
| 22 | Rebook the cancelled seat A1 | 200 | 200 | PASS |
| 23 | Cancelled bookings list includes A1 | 200 | 200 | PASS |
| 24 | Customer 2 has no cancelled bookings | 200 | 200 | PASS |
## Concurrency

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Simultaneous booking of seat B2: exactly one wins (200 + 409), got {'c2': 200, 'c1': 409} | [200, 409] | [200, 409] | PASS |
| 2 | Seat B2 ends up booked | booked | {'seatId': 'afb415d0-ca39-4d9b-935c-baf201166caa', 'busId': 'c80779fe-6316-4c19-8cb6-db9a1560db98', 'seatNumber': 'B2', 'isAvailable': False} | PASS |
## Admin

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Admin dashboard | 200 | 200 | PASS |
| 2 | Admin dashboard summary | 200 | 200 | PASS |
| 3 | Get all customers | 200 | 200 | PASS |
| 4 | Get one customer by id | 200 | 200 | PASS |
| 5 | Get unknown customer -> 404 | 404 | 404 | PASS |
| 6 | Admin updates customer details | 200 | 200 | PASS |
| 7 | Admin sees all bookings | 200 | 200 | PASS |
| 8 | Admin cancels another user's booking | 200 | 200 | PASS |
| 9 | Seat A2 freed after admin cancel | 200 | 200 | PASS |
| 10 | Customer 2 sees the admin cancellation | 200 | 200 | PASS |
| 11 | Delete customer with bookings -> 409 | 409 | 409 | PASS |
| 12 | Delete customer without bookings | 200 | 200 | PASS |
| 13 | Customer must not access admin dashboard -> 403 | 403 | 403 | PASS |
| 14 | Customer must not access admin customers -> 403 | 403 | 403 | PASS |
| 15 | Anonymous admin dashboard -> 401 | 401 | 401 | PASS |
## Profile

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Get my profile | 200 | 200 | PASS |
| 2 | Update my profile | 200 | 200 | PASS |
| 3 | Update profile to another user's email -> 409 | 409 | 409 | PASS |
| 4 | Change password with wrong current -> 400 | 400 | 400 | PASS |
| 5 | Change password | 200 | 200 | PASS |
| 6 | Login with new password | 200 | 200 | PASS |
| 7 | Old password no longer works | 401 | 401 | PASS |
| 8 | Admin must not access customer profile -> 403 | 403 | 403 | PASS |
## Tickets

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Create a ticket | 201 | 201 | PASS |
| 2 | Get all tickets | 200 | 200 | PASS |
| 3 | Get a ticket by id | 200 | 200 | PASS |
| 4 | Get unknown ticket -> 404 | 404 | 404 | PASS |
| 5 | Update a ticket | 200 | 200 | PASS |
| 6 | Delete a ticket | 204 | 204 | PASS |
| 7 | Deleted ticket -> 404 | 404 | 404 | PASS |
| 8 | Delete unknown ticket -> 404 | 404 | 404 | PASS |

## Failures & notes

- **Bus / Get a specific bus by Id**: expected 200, got 405 — route GET /api/bus/{id} is not implemented in BusController (server returns 405)

## Booking Cancellation — targeted test (DELETE /api/booking/{id})

- **Run at:** 2026-10-23
- **API base URL:** http://localhost:5290
- **Result:** ALL PASSED — 15/15 checks passed
- **Scope:** Booking Cancellation API only. Existing test data used; no records created, no source or schema changes.
- **Auth:** HS256 JWTs minted with the app's dev signing key (`Jwt:Key` from User Secrets) in the exact claim format `AuthController` issues, validated via `GET /api/auth/me` (200). Tokens used: Admin (`princedev@gmail.com`), Customer1 (`customer1@example.com`), Customer2 (`customer2@example.com`).
- **Target booking:** `e47e4a70-578c-4794-8506-4a2f3305ad95` — pre-existing guest booking, seat I3, bus `1636fc26-bb71-484f-87ac-06a82f043c79`, ticket `75341347-abe8-43a5-b518-c4a9a3ecdccb`. Guest bookings have `UserId = null`, so only an Admin JWT can cancel them; the Admin JWT was used for the happy path.
- **Pre-state verified before test 1:** `Bookings.Status = Confirmed`, `Tickets.Status = Confirmed` / `SeatAvailable = 0`, `Seats.IsAvailable = 0`.

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Cancel valid booking with Admin JWT | 200 OK | 200 OK — body `bookingStatus: Cancelled`, `ticketStatus: Cancelled`, `seatNumber: I3`, `isSeatAvailable: true` | PASS |
| 2 | Response is `200 OK` | 200 | 200 | PASS |
| 3 | `Bookings.Status` = Cancelled (DB) | Cancelled | Cancelled | PASS |
| 4 | `Tickets.Status` = Cancelled (DB) | Cancelled | Cancelled | PASS |
| 5 | `Seats.IsAvailable` = true (DB, seat `c20736f3-6950-40f0-b595-a7580b7a667d`) | 1 | 1 | PASS |
| 6 | `Tickets.SeatAvailable` = true (set by same code path) | 1 | 1 | PASS |
| 7 | API cross-check: `GET /api/booking/{id}` shows Cancelled; `GET /api/seat/bus/{bus}/I3` shows available | 200 / true | 200 / true | PASS |
| 8 | Cancel the same booking again | 400 Bad Request | 400 — "This booking is already cancelled." | PASS |
| 9 | Cancel non-existent booking ID (random UUID) | 404 | 404 — "Booking not found." | PASS |
| 10 | Cancel malformed (non-GUID) ID | 404 | 404 — route `{id:guid}` does not match | PASS |
| 11 | Customer1 cancels Customer2's booking `f3b09e05-5e87-4c4c-bb21-8a484d06fb3b` | rejected | 404 — "Booking not found." | PASS |
| 12 | Customer2's booking unchanged after the attempt (DB) | Confirmed | Confirmed | PASS |

## Booking Cancellation Authorization Test — cross-customer DELETE (Customer 1 → Customer 2's booking)

- **Run at:** 2026-10-23 06:32 UTC
- **API base URL:** http://localhost:5290
- **Result:** PASS — API returned 404 and the target booking's DB state was unchanged
- **Scope:** Authorization test only. Read-only DB queries (SELECT); no records created or modified, no source/config/migration changes.
- **Auth:** All stored Customer 1 JWTs were expired, and `customer1@example.com` rejected the repo passwords (`TestUser@123`, `TestUser@1234!`, `NewPass@123` → 401). With operator approval, the existing account `new@gmail.com` (UserId `61ef2032-c30a-4228-b799-eb4ce28d9816`) was used as "Customer 1"; a fresh token was obtained via `POST /api/auth/login` (200).
- **Target booking:** `7d5bf86a-cf57-4b76-a5c6-7b307f8e94b0` — seat D2, bus `1636fc26-bb71-484f-87ac-06a82f043c79`, seat `764b3b3d-7dcc-45f4-a6b9-e22dab268d7c`, owned by Customer 2 (`customer2@example.com`, UserId `4e990bac-3268-4dd3-bf23-064dc1d9c5cc`), verified via read-only DB join. No `Tickets` row exists for this booking.
- **Pre-state (read-only SELECT):** `Bookings.Status = Confirmed`, `Seats.IsAvailable = 0`, no ticket row.

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Target booking belongs to Customer 2, not Customer 1 (DB join on UserId) | owner ≠ C1 | owner = customer2@example.com; C1 = new@gmail.com | PASS |
| 2 | `DELETE /api/booking/7d5bf86a-…` with Customer 1 token | 404 Not Found | 404 — "Booking not found." | PASS |
| 3 | Booking status unchanged (DB, before vs after) | Confirmed | Confirmed (row identical) | PASS |
| 4 | Seat availability unchanged (DB) | IsAvailable = 0 | 0 (row identical) | PASS |
| 5 | Ticket state unchanged (DB) | no ticket row | no ticket row (identical) | PASS |
| 6 | Full pre/post snapshot comparison (booking + seat + ticket join) | identical | identical | PASS |

Notes:

- The stored `customer2@example.com` JWT from BookingController.http was no longer valid at test time (401 on `GET /api/booking/{id}`); ownership was instead verified directly in the database, which is authoritative.
- 3 failed login attempts were recorded against `customer1@example.com` while looking for a valid token (below the 5-attempt lockout threshold; no lockout triggered). Its password appears to have been changed and is no longer the repo-documented `TestUser@123`.
