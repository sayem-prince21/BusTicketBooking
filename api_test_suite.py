#!/usr/bin/env python3
"""
API test suite for the Bus Ticket Booking API.

Runs every scenario defined in the .http files:
  AuthController.http, BookingController.http, BusController.http,
  SeatController.http, TicketController.http, Admin.http,
  Customer.http, CustomerAdmin.http, validationTest.http

The suite registers two fresh customers and creates a fresh bus on every run,
so it is safe to run repeatedly. The admin account must already exist.

Usage:
  python api_test_suite.py
  API_BASE_URL=http://localhost:5290 python api_test_suite.py
  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=... python api_test_suite.py

Requires the API to be running (dotnet run --launch-profile http) and MySQL
up. Set ADMIN_EMAIL and ADMIN_PASSWORD for the existing admin account.
Uses only the Python standard library.
"""

import json
import os
import threading
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE = os.environ.get("API_BASE_URL", "http://localhost:5290").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
PASSWORD = os.environ.get("TEST_PASSWORD", "TestUser@123")
REPORT_FILE = os.environ.get("REPORT_FILE", "TEST_RESULTS.md")

# Unique suffix so every run gets fresh users, phone numbers and buses.
RUN = f"{int(time.time()) % 100000000:08d}"

results = []


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def call(method, path, token=None, body=None):
    """Send one request. Returns (status, parsed_json_or_text)."""
    url = BASE + path
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            status, raw = resp.status, resp.read().decode(errors="replace")
    except urllib.error.HTTPError as exc:
        status, raw = exc.code, exc.read().decode(errors="replace")
    except Exception as exc:  # connection refused, timeout, ...
        return 0, f"connection error: {exc}"

    if not raw:
        return status, None
    try:
        return status, json.loads(raw)
    except json.JSONDecodeError:
        return raw and status, raw


def record(section, name, ok, expected, actual, note=""):
    results.append({
        "section": section, "name": name, "ok": ok,
        "expected": str(expected), "actual": str(actual), "note": note,
    })
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}  (expected {expected}, got {actual})")
    return ok


def expect(section, name, method, path, expected, token=None, body=None,
           extra=None, note=""):
    """Fire a request, assert the status code (and optional body predicate)."""
    status, data = call(method, path, token, body)
    ok = status == expected
    if ok and extra is not None:
        try:
            ok = bool(extra(data))
        except Exception:
            ok = False
    record(section, name, ok, expected, status, note)
    return status, data


def heading(title):
    print(f"\n=== {title} ===")


# ---------------------------------------------------------------------------
# Setup: users, tokens, bus
# ---------------------------------------------------------------------------

def setup():
    """Register/login customers, log in admin, create the test bus."""
    heading("Setup")

    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        print("Set ADMIN_EMAIL and ADMIN_PASSWORD for the existing admin account.")
        raise SystemExit(2)

    status, _ = call("GET", "/")
    if status != 200:
        print(f"API not reachable at {BASE} (GET / -> {status}).")
        print("Start it with: dotnet run --launch-profile http")
        raise SystemExit(2)

    c1_email = f"apitest1{RUN}@test.com"
    c2_email = f"apitest2{RUN}@test.com"
    c1_phone = f"017{RUN}"
    c2_phone = f"018{RUN}"

    for email, phone, label in ((c1_email, c1_phone, "Customer 1"),
                                (c2_email, c2_phone, "Customer 2")):
        status, data = call("POST", "/api/auth/register", body={
            "fullName": f"API Test {label}",
            "email": email,
            "phoneNumber": phone,
            "password": PASSWORD,
        })
        if status != 200:
            print(f"  registration failed for {label}: {status} {data}")
            raise SystemExit(2)

    # Customer tokens.
    tokens = {}
    for email, phone, key in ((c1_email, c1_phone, "c1"),
                              (c2_email, c2_phone, "c2")):
        status, data = call("POST", "/api/auth/login",
                            body={"email": email, "password": PASSWORD})
        if status != 200:
            print(f"  login failed for {email}: {status} {data}")
            raise SystemExit(2)
        tokens[key] = data["token"]
        tokens[f"{key}_id"] = data["userId"]
        tokens[f"{key}_email"] = email
        tokens[f"{key}_phone"] = phone

    # Admin token.
    status, data = call("POST", "/api/auth/login",
                        body={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if status != 200:
        print(f"  admin login failed ({ADMIN_EMAIL}): {status} {data}")
        print("  Admin account is required for the admin scenarios.")
        raise SystemExit(2)
    tokens["admin"] = data["token"]

    # Fresh bus with a clean 40-seat map.
    depart_at = (datetime.now() + timedelta(days=7)).replace(
        hour=9, minute=0, second=0, microsecond=0)
    status, bus = call("POST", "/api/bus", body={
        "busName": "API Test Express",
        "busNumber": f"TS-{RUN}",
        "source": "Dhaka",
        "destination": "Chittagong",
        "departureTime": depart_at.strftime("%Y-%m-%dT%H:%M:%S"),
        "ticketPrice": 800,
    })
    if status != 200:
        print(f"  bus creation failed: {status} {bus}")
        raise SystemExit(2)

    tokens["bus_id"] = bus["busId"]
    tokens["depart_date"] = depart_at.strftime("%Y-%m-%d")
    print(f"  ready: bus {tokens['bus_id']}, customers {c1_email} / {c2_email}")
    return tokens


# ---------------------------------------------------------------------------
# Scenario groups (mirroring the .http files)
# ---------------------------------------------------------------------------

def test_auth(t):
    s = "Auth"
    heading(f"{s} (AuthController.http)")

    expect(s, "Register duplicate email rejected", "POST", "/api/auth/register", 400,
           body={"fullName": "Dup", "email": t["c1_email"],
                 "phoneNumber": f"019{RUN}", "password": PASSWORD})
    expect(s, "Register duplicate phone rejected", "POST", "/api/auth/register", 400,
           body={"fullName": "Dup", "email": f"dup{RUN}@test.com",
                 "phoneNumber": t["c1_phone"], "password": PASSWORD})
    expect(s, "Login with wrong password -> 401", "POST", "/api/auth/login", 401,
           body={"email": t["c1_email"], "password": "WrongPass@1"})
    expect(s, "Login with unknown email -> 401", "POST", "/api/auth/login", 401,
           body={"email": f"ghost{RUN}@test.com", "password": PASSWORD})
    expect(s, "Login with email AND phone -> 400", "POST", "/api/auth/login", 400,
           body={"email": t["c1_email"], "phoneNumber": t["c1_phone"],
                 "password": PASSWORD})
    expect(s, "Login using phone number", "POST", "/api/auth/login", 200,
           body={"phoneNumber": t["c1_phone"], "password": PASSWORD},
           extra=lambda d: d.get("token"))
    expect(s, "GET /me without token -> 401", "GET", "/api/auth/me", 401)
    expect(s, "GET /me with token", "GET", "/api/auth/me", 200, token=t["c1"],
           extra=lambda d: d.get("email") == t["c1_email"])


def test_bus(t):
    s = "Bus"
    heading(f"{s} (BusController.http)")
    bus_id = t["bus_id"]

    expect(s, "Get all buses", "GET", "/api/bus", 200,
           extra=lambda d: any(b["busId"] == bus_id for b in d))
    # NOTE: BusController has no GET /api/bus/{id} route; the .http file
    # references one, so the request matches the PUT/DELETE route and the
    # server answers 405 Method Not Allowed. The test documents the gap.
    expect(s, "Get a specific bus by Id", "GET", f"/api/bus/{bus_id}", 200,
           note="route GET /api/bus/{id} is not implemented in BusController "
                "(server returns 405)")
    expect(s, "Bus search by route and date", "GET",
           f"/api/bus/search?source=Dhaka&destination=Chittagong"
           f"&date={t['depart_date']}", 200,
           extra=lambda d: any(b["busId"] == bus_id for b in d))
    expect(s, "Update a bus", "PUT", f"/api/bus/{bus_id}", 200,
           body={"busName": "API Test Express Renamed", "busNumber": f"TS-{RUN}"},
           extra=lambda d: d["busName"] == "API Test Express Renamed")
    expect(s, "Delete unknown bus -> 404", "DELETE",
           f"/api/bus/{uuid.uuid4()}", 404)

    # Minimal payload from BusController.http: Source/Destination/
    # DepartureTime are [Required] now, so this scenario returns 400.
    expect(s, "Create bus with minimal payload -> 400", "POST", "/api/bus", 400,
           body={"busName": "Green Line", "busNumber": f"GL-{RUN}"},
           note=".http scenario predates Required Source/Destination/"
                "DepartureTime fields in CreateBusRequest")

    # Create + delete a scratch bus (mirrors create/delete scenarios safely).
    status, scratch = expect(s, "Create a new bus", "POST", "/api/bus", 200,
                             body={"busName": "Scratch Bus",
                                   "busNumber": f"SC-{RUN}",
                                   "source": "Dhaka",
                                   "destination": "Chittagong",
                                   "departureTime": (datetime.now()
                                       + timedelta(days=7)).strftime(
                                           "%Y-%m-%dT09:00:00"),
                                   "ticketPrice": 500})
    if status == 200:
        expect(s, "Delete the scratch bus", "DELETE",
               f"/api/bus/{scratch['busId']}", 200)


def test_seats(t):
    s = "Seats"
    heading(f"{s} (SeatController.http)")
    bus_id = t["bus_id"]

    expect(s, "Get all seats of the bus (40)", "GET", f"/api/seat/bus/{bus_id}",
           200, extra=lambda d: len(d) == 40)
    expect(s, "Get a specific seat A1", "GET", f"/api/seat/bus/{bus_id}/A1", 200)
    expect(s, "Book seat A1 directly", "POST",
           f"/api/seat/bus/{bus_id}/A1/book", 200)
    expect(s, "A1 shows IsAvailable=false after booking", "GET",
           f"/api/seat/bus/{bus_id}/A1", 200,
           extra=lambda d: d["isAvailable"] is False)
    expect(s, "Available seats exclude A1", "GET",
           f"/api/seat/bus/{bus_id}/available", 200,
           extra=lambda d: all(x["seatNumber"] != "A1" for x in d))
    expect(s, "Booked seats include A1", "GET",
           f"/api/seat/bus/{bus_id}/booked", 200,
           extra=lambda d: any(x["seatNumber"] == "A1" for x in d))
    expect(s, "Booking A1 again -> 400", "POST",
           f"/api/seat/bus/{bus_id}/A1/book", 400)
    expect(s, "Cancel A1 seat", "PUT", f"/api/seat/bus/{bus_id}/A1/cancel", 200)
    expect(s, "A1 available again after cancel", "GET",
           f"/api/seat/bus/{bus_id}/A1", 200,
           extra=lambda d: d["isAvailable"] is True)
    expect(s, "Cancel A1 again -> 400", "PUT",
           f"/api/seat/bus/{bus_id}/A1/cancel", 400)
    expect(s, "Unknown seat Z99 -> 404", "GET",
           f"/api/seat/bus/{bus_id}/Z99", 404)
    expect(s, "Seats of unknown bus -> 404", "GET",
           f"/api/seat/bus/{uuid.uuid4()}", 404)
    expect(s, "Book seat on unknown bus -> 404", "POST",
           f"/api/seat/bus/{uuid.uuid4()}/A1/book", 404)


def test_booking_flow(t):
    s = "Booking"
    heading(f"{s} (validationTest.http / Customer.http / BookingController.http)")
    bus_id = t["bus_id"]

    # --- happy path -------------------------------------------------------
    status, data = expect(
        s, "Customer 1 books seat A1", "POST", "/api/booking", 200, token=t["c1"],
        body={"passengerName": "Customer One", "busId": bus_id, "seatNumber": "A1"},
        extra=lambda d: d["booking"]["status"] == "Confirmed")
    b1 = data["booking"]["bookingId"] if status == 200 else None

    expect(s, "Duplicate seat booking -> 409", "POST", "/api/booking", 409,
           token=t["c2"],
           body={"passengerName": "Customer Two", "busId": bus_id,
                 "seatNumber": "A1"})

    status, data = expect(
        s, "Customer 2 books seat A2", "POST", "/api/booking", 200, token=t["c2"],
        body={"passengerName": "Customer Two", "busId": bus_id, "seatNumber": "A2"})
    b2 = data["booking"]["bookingId"] if status == 200 else None

    # --- validation & auth errors ----------------------------------------
    expect(s, "Booking without token -> 401", "POST", "/api/booking", 401,
           body={"passengerName": "Anonymous", "busId": bus_id, "seatNumber": "B1"})
    expect(s, "Booking with empty passenger name -> 400", "POST",
           "/api/booking", 400, token=t["c1"],
           body={"passengerName": "  ", "busId": bus_id, "seatNumber": "B1"})
    expect(s, "Booking with all-zero busId -> 400", "POST", "/api/booking", 400,
           token=t["c1"],
           body={"passengerName": "Validation Test",
                 "busId": "00000000-0000-0000-0000-000000000000",
                 "seatNumber": "A1"})
    expect(s, "Booking with unknown busId -> 404", "POST", "/api/booking", 404,
           token=t["c1"],
           body={"passengerName": "Validation Test", "busId": str(uuid.uuid4()),
                 "seatNumber": "A1"})
    expect(s, "Booking with invalid seat Z99 -> 404", "POST", "/api/booking", 404,
           token=t["c1"],
           body={"passengerName": "Validation Test", "busId": bus_id,
                 "seatNumber": "Z99"})

    # --- reads & isolation ------------------------------------------------
    expect(s, "Customer 1 gets my bookings (own only)", "GET", "/api/booking", 200,
           token=t["c1"],
           extra=lambda d: any(x["seatNumber"] == "A1" for x in d)
           and all(x["seatNumber"] != "A2" for x in d))
    expect(s, "Customer 2 gets my bookings (own only)", "GET", "/api/booking", 200,
           token=t["c2"],
           extra=lambda d: any(x["seatNumber"] == "A2" for x in d)
           and all(x["seatNumber"] != "A1" for x in d))
    expect(s, "Customer 1 confirmed bookings include A1", "GET",
           "/api/booking/confirmed", 200, token=t["c1"],
           extra=lambda d: any(x["seatNumber"] == "A1" for x in d))
    expect(s, "Customer 2 confirmed bookings include A2", "GET",
           "/api/booking/confirmed", 200, token=t["c2"],
           extra=lambda d: any(x["seatNumber"] == "A2" for x in d))
    expect(s, "Get own booking by id", "GET", f"/api/booking/{b1}", 200,
           token=t["c1"], extra=lambda d: d["seatNumber"] == "A1")
    expect(s, "Get another customer's booking -> 404", "GET",
           f"/api/booking/{b2}", 404, token=t["c1"])
    expect(s, "Get unknown booking -> 404", "GET",
           f"/api/booking/{uuid.uuid4()}", 404, token=t["c1"])
    expect(s, "Seat A1 unavailable while booked", "GET",
           f"/api/seat/bus/{bus_id}/A1", 200,
           extra=lambda d: d["isAvailable"] is False)

    # --- cancellation -----------------------------------------------------
    expect(s, "Customer 1 cancels own booking", "DELETE", f"/api/booking/{b1}",
           200, token=t["c1"],
           extra=lambda d: d["bookingStatus"] == "Cancelled"
           and d["isSeatAvailable"] is True)
    expect(s, "Cancelling again -> 400", "DELETE", f"/api/booking/{b1}", 400,
           token=t["c1"])
    expect(s, "Cancel another customer's booking -> 404", "DELETE",
           f"/api/booking/{b2}", 404, token=t["c1"])
    expect(s, "Cancel without token -> 401", "DELETE", f"/api/booking/{b2}", 401)
    expect(s, "Seat A1 free again after cancel", "GET",
           f"/api/seat/bus/{bus_id}/A1", 200,
           extra=lambda d: d["isAvailable"] is True)

    status, data = expect(
        s, "Rebook the cancelled seat A1", "POST", "/api/booking", 200,
        token=t["c2"],
        body={"passengerName": "Rebooking Test", "busId": bus_id,
              "seatNumber": "A1"})
    b3 = data["booking"]["bookingId"] if status == 200 else None

    expect(s, "Cancelled bookings list includes A1", "GET",
           "/api/booking/cancelled", 200, token=t["c1"],
           extra=lambda d: any(x["bookingId"] == b1 and x["status"] == "Cancelled"
                               for x in d))
    expect(s, "Customer 2 has no cancelled bookings", "GET",
           "/api/booking/cancelled", 200, token=t["c2"],
           extra=lambda d: len(d) == 0)

    return {"b1": b1, "b2": b2, "b3": b3}


def test_concurrency(t):
    s = "Concurrency"
    heading(f"{s} (validationTest.http simultaneous booking)")
    bus_id = t["bus_id"]
    seat = "B2"

    barrier = threading.Barrier(2)
    codes = {}

    def book(key, token):
        barrier.wait()
        codes[key], _ = call("POST", "/api/booking", token,
                             {"passengerName": f"Race {key}", "busId": bus_id,
                              "seatNumber": seat})

    threads = [threading.Thread(target=book, args=("c1", t["c1"])),
               threading.Thread(target=book, args=("c2", t["c2"]))]
    for th in threads:
        th.start()
    for th in threads:
        th.join()

    got = sorted(codes.values())
    record(s, f"Simultaneous booking of seat {seat}: exactly one wins "
              f"(200 + 409), got {codes}",
           got == [200, 409], "[200, 409]", got)

    status, _ = call("GET", f"/api/seat/bus/{bus_id}/{seat}")
    status2, seat_data = call("GET", f"/api/seat/bus/{bus_id}/{seat}")
    record(s, f"Seat {seat} ends up booked", status2 == 200
           and seat_data["isAvailable"] is False, "booked", seat_data)


def test_admin(t, bookings):
    s = "Admin"
    heading(f"{s} (Admin.http / CustomerAdmin.http)")
    admin = t["admin"]

    expect(s, "Admin dashboard", "GET", "/api/admin/dashboard", 200, token=admin)
    expect(s, "Admin dashboard summary", "GET", "/api/admin/dashboard/summary",
           200, token=admin,
           extra=lambda d: d["totalBookings"] >= 3)
    expect(s, "Get all customers", "GET", "/api/admin/customers", 200,
           token=admin,
           extra=lambda d: any(c["email"] == t["c1_email"] for c in d))
    expect(s, "Get one customer by id", "GET",
           f"/api/admin/customers/{t['c1_id']}", 200, token=admin,
           extra=lambda d: d["email"] == t["c1_email"])
    expect(s, "Get unknown customer -> 404", "GET",
           f"/api/admin/customers/{uuid.uuid4()}", 404, token=admin)
    expect(s, "Admin updates customer details", "PUT",
           f"/api/admin/customers/{t['c2_id']}", 200, token=admin,
           body={"fullName": "Updated Customer", "email": t["c2_email"],
                 "phoneNumber": t["c2_phone"]})
    expect(s, "Admin sees all bookings", "GET", "/api/booking", 200, token=admin,
           extra=lambda d: len(d) >= 3)

    b2 = bookings["b2"]
    expect(s, "Admin cancels another user's booking", "DELETE",
           f"/api/booking/{b2}", 200, token=admin)
    expect(s, "Seat A2 freed after admin cancel", "GET",
           f"/api/seat/bus/{t['bus_id']}/A2", 200,
           extra=lambda d: d["isAvailable"] is True)
    expect(s, "Customer 2 sees the admin cancellation", "GET",
           "/api/booking/cancelled", 200, token=t["c2"],
           extra=lambda d: any(x["bookingId"] == b2 for x in d))

    expect(s, "Delete customer with bookings -> 409", "DELETE",
           f"/api/admin/customers/{t['c1_id']}", 409, token=admin)

    # Scratch customer that can be deleted cleanly.
    scratch_email = f"apitest3{RUN}@test.com"
    status, data = call("POST", "/api/auth/register", body={
        "fullName": "Scratch Customer", "email": scratch_email,
        "phoneNumber": f"016{RUN}", "password": PASSWORD})
    if status == 200:
        expect(s, "Delete customer without bookings", "DELETE",
               f"/api/admin/customers/{data['userId']}", 200, token=admin)

    expect(s, "Customer must not access admin dashboard -> 403", "GET",
           "/api/admin/dashboard", 403, token=t["c1"])
    expect(s, "Customer must not access admin customers -> 403", "GET",
           "/api/admin/customers", 403, token=t["c1"])
    expect(s, "Anonymous admin dashboard -> 401", "GET",
           "/api/admin/dashboard", 401)


def test_customer_profile(t):
    s = "Profile"
    heading(f"{s} (Customer.http)")
    c1 = t["c1"]

    expect(s, "Get my profile", "GET", "/api/customer/profile", 200, token=c1,
           extra=lambda d: d["email"] == t["c1_email"])
    expect(s, "Update my profile", "PUT", "/api/customer/profile", 200, token=c1,
           body={"fullName": "API Test Customer One Updated",
                 "email": t["c1_email"], "phoneNumber": t["c1_phone"]},
           extra=lambda d: d["profile"]["fullName"]
           == "API Test Customer One Updated")
    expect(s, "Update profile to another user's email -> 409", "PUT",
           "/api/customer/profile", 409, token=c1,
           body={"fullName": "X", "email": t["c2_email"],
                 "phoneNumber": t["c1_phone"]})

    expect(s, "Change password with wrong current -> 400", "PUT",
           "/api/customer/profile/change-password", 400, token=c1,
           body={"currentPassword": "WrongPass@1", "newPassword": "NewPass@123"})
    expect(s, "Change password", "PUT",
           "/api/customer/profile/change-password", 200, token=c1,
           body={"currentPassword": PASSWORD, "newPassword": "NewPass@123"})
    expect(s, "Login with new password", "POST", "/api/auth/login", 200,
           body={"email": t["c1_email"], "password": "NewPass@123"})
    expect(s, "Old password no longer works", "POST", "/api/auth/login", 401,
           body={"email": t["c1_email"], "password": PASSWORD})
    expect(s, "Admin must not access customer profile -> 403", "GET",
           "/api/customer/profile", 403, token=t["admin"])


def test_tickets(t):
    s = "Tickets"
    heading(f"{s} (TicketController.http)")

    status, ticket = expect(
        s, "Create a ticket", "POST", "/api/ticket", 201,
        body={"passengerName": "John Hunj", "seatNumber": "12A",
              "ticketPrice": 25.5})
    if status != 201:
        return
    ticket_id = ticket["ticketId"]

    expect(s, "Get all tickets", "GET", "/api/ticket", 200)
    expect(s, "Get a ticket by id", "GET", f"/api/ticket/{ticket_id}", 200,
           extra=lambda d: d["seatNumber"] == "12A")
    expect(s, "Get unknown ticket -> 404", "GET",
           f"/api/ticket/{uuid.uuid4()}", 404)
    expect(s, "Update a ticket", "PUT", f"/api/ticket/{ticket_id}", 200,
           body={"passengerName": "John Doe", "seatNumber": "12B",
                 "ticketPrice": 30.0, "seatAvailable": False},
           extra=lambda d: d["seatNumber"] == "12B")
    expect(s, "Delete a ticket", "DELETE", f"/api/ticket/{ticket_id}", 204)
    expect(s, "Deleted ticket -> 404", "GET", f"/api/ticket/{ticket_id}", 404)
    expect(s, "Delete unknown ticket -> 404", "DELETE",
           f"/api/ticket/{uuid.uuid4()}", 404)


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def write_report():
    passed = sum(1 for r in results if r["ok"])
    failed = len(results) - passed
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        "# API Test Results — Bus Ticket Booking",
        "",
        f"- **Run at:** {stamp}",
        f"- **API base URL:** {BASE}",
        f"- **Result:** {'ALL PASSED' if failed == 0 else 'FAILURES PRESENT'} — "
        f"{passed}/{len(results)} passed, {failed} failed",
        "",
    ]

    current = None
    number = 0
    for r in results:
        if r["section"] != current:
            current = r["section"]
            number = 0
            lines.append(f"## {current}")
            lines.append("")
            lines.append("| # | Test | Expected | Actual | Result |")
            lines.append("|---|------|----------|--------|--------|")
        number += 1
        lines.append(f"| {number} | {r['name']} | {r['expected']} | {r['actual']} | "
                     f"{'PASS' if r['ok'] else 'FAIL'} |")
    lines.append("")

    failures = [r for r in results if not r["ok"]]
    if failures:
        lines.append("## Failures & notes")
        lines.append("")
        for r in failures:
            note = f" — {r['note']}" if r["note"] else ""
            lines.append(f"- **{r['section']} / {r['name']}**: expected "
                         f"{r['expected']}, got {r['actual']}{note}")
        lines.append("")

    with open(REPORT_FILE, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print(f"\n{'=' * 60}")
    print(f"TOTAL: {passed}/{len(results)} passed, {failed} failed")
    print(f"Report written to {REPORT_FILE}")
    return failed


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Bus Ticket Booking API test suite — base {BASE}, run id {RUN}")
    t = setup()
    test_auth(t)
    test_bus(t)
    test_seats(t)
    bookings = test_booking_flow(t)
    test_concurrency(t)
    test_admin(t, bookings)
    test_customer_profile(t)
    test_tickets(t)
    failed = write_report()
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
