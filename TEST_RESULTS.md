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
