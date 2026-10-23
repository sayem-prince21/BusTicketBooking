# Bus Ticket Booking API

An ASP.NET Core Web API for searching bus routes, checking seat availability, making and cancelling bookings, and managing customer accounts. It uses MySQL for application data, ASP.NET Core Identity for user accounts, and JWT bearer tokens for authenticated customer and administrator operations.

## Features

- Customer registration and login with email or phone number
- JWT authentication and role-based customer and administrator access
- Bus creation, route/date search, updates, and deletion
- Forty seats generated for each newly created bus
- Seat availability checks and booking/cancellation
- Guest bookings and authenticated customer bookings
- Booking history, cancellation, and ticket details
- Customer profile and password management
- Administrator dashboard and customer management

## Technology

- .NET 10 / ASP.NET Core
- Entity Framework Core
- MySQL
- ASP.NET Core Identity
- JWT bearer authentication
- Python 3 (optional API test suite; standard library only)

## Prerequisites

- .NET 10 SDK
- A running MySQL server and a database account with permission to create and update tables
- Python 3 if you want to run `api_test_suite.py`
- The VS Code REST Client extension is optional for running the included `.http` request files

## Configure the application

The API reads its database connection string and JWT settings from .NET configuration. For local development, store them in User Secrets rather than adding credentials to source control.

From the repository directory, set the database connection string and JWT values:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Port=3306;Database=bus_ticket_booking;User=YOUR_DB_USER;Password=YOUR_DB_PASSWORD;"
dotnet user-secrets set "Jwt:Key" "REPLACE_WITH_A_LONG_RANDOM_SECRET"
dotnet user-secrets set "Jwt:Issuer" "BusTicketBooking"
dotnet user-secrets set "Jwt:Audience" "BusTicketBooking"
```

Replace the database username and password with values for your MySQL installation. Use a strong, private JWT signing key; do not use the placeholder above in a deployed environment. The application requires all three `Jwt` settings at startup.

Create the database if it does not already exist:

```sql
CREATE DATABASE bus_ticket_booking;
```

## Create the schema and run the API

Apply the checked-in Entity Framework migrations:

```powershell
dotnet tool install --global dotnet-ef --version 10.0.0
dotnet ef database update
```

If `dotnet-ef` is already installed, skip the installation command.

Start the API using the included HTTP launch profile:

```powershell
dotnet run --launch-profile http
```

The base URL is `http://localhost:5290`. The HTTPS profile is also available and uses `https://localhost:7226` (and `http://localhost:5290`).

The root route (`GET /`) returns `Hello World!` and can be used to confirm the API is running.

## Set up an administrator

1. Start the API with the database and JWT configuration above. The application creates the `Admin` and `Customer` roles at startup.
2. Register an account using `POST /api/auth/register` (see the example below).
3. Stop the API and set the email of that existing account as the administrator email:

   ```powershell
   dotnet user-secrets set "Admin:Email" "admin@example.com"
   ```

4. Restart the API. On startup, the application assigns the configured account the `Admin` role.

The admin email must belong to an account that has already been registered; the application does not create the account or set its password for you. Keep administrator credentials private.

## Authentication

Register and log in at `/api/auth/register` and `/api/auth/login`. A successful login returns a JWT that expires after one hour. Send it on protected requests using:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Login accepts exactly one identifier: `email` or `phoneNumber`, plus `password`. Customer-only profile routes require the `Customer` role. Dashboard and customer-administration routes require the `Admin` role. Booking creation accepts guest requests without a token; when a valid customer token is supplied, the booking is associated with that account.

Example registration:

```http
POST http://localhost:5290/api/auth/register
Content-Type: application/json

{
  "fullName": "Alex Example",
  "email": "alex@example.com",
  "phoneNumber": "01712345678",
  "password": "Use-A-Strong1!"
}
```

Example login:

```http
POST http://localhost:5290/api/auth/login
Content-Type: application/json

{
  "email": "alex@example.com",
  "password": "Use-A-Strong1!"
}
```

Registration passwords must satisfy the configured Identity policy: at least eight characters, including uppercase and lowercase letters, a digit, and a non-alphanumeric character.

## API reference

All routes below are relative to `http://localhost:5290`. The `Bearer` column indicates routes that require a JWT; role requirements are listed where applicable.

### Authentication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a customer account |
| `POST` | `/api/auth/login` | Public | Log in with email or phone and receive a JWT |
| `GET` | `/api/auth/me` | Bearer | Get the current account |

### Buses

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/bus` | Public | List buses |
| `GET` | `/api/bus/search?source={source}&destination={destination}&date={date}` | Public | Search by route and departure date |
| `POST` | `/api/bus` | Public | Create a bus and its 40 seats |
| `PUT` | `/api/bus/{id}` | Public | Update bus name and number |
| `DELETE` | `/api/bus/{id}` | Public | Delete a bus |

The search date should be supplied in a format accepted by ASP.NET Core, such as `2026-10-30`. There is currently no `GET /api/bus/{id}` endpoint.

### Seats

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/seat/bus/{busId}` | Public | List all seats for a bus |
| `GET` | `/api/seat/bus/{busId}/{seatNumber}` | Public | Get one seat |
| `GET` | `/api/seat/bus/{busId}/available` | Public | List available seats |
| `GET` | `/api/seat/bus/{busId}/booked` | Public | List booked seats |
| `POST` | `/api/seat/bus/{busId}/{seatNumber}/book` | Public | Book a seat directly |
| `PUT` | `/api/seat/bus/{busId}/{seatNumber}/cancel` | Public | Mark a seat available |

For a normal passenger booking, use `POST /api/booking`; it also creates the booking and its associated ticket record.

### Bookings

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/booking` | Public; guest or authenticated | Book a seat and create a ticket |
| `GET` | `/api/booking` | Bearer | List the caller's bookings; admins can list all |
| `GET` | `/api/booking/{id}` | Bearer | Get an owned booking; admins can get any |
| `DELETE` | `/api/booking/{id}` | Bearer | Cancel an owned booking; admins can cancel any |
| `GET` | `/api/booking/confirmed` | Bearer | List confirmed bookings for the caller; admins see all |
| `GET` | `/api/booking/cancelled` | Bearer | List cancelled bookings for the caller; admins see all |

Example guest booking:

```http
POST http://localhost:5290/api/booking
Content-Type: application/json

{
  "passengerName": "Alex Example",
  "passengerPhone": "01712345678",
  "passengerEmail": "alex@example.com",
  "busId": "BUS_GUID",
  "seatNumber": "A1"
}
```

Replace `BUS_GUID` with an ID returned by `GET /api/bus`. A bus has seats `A1` through `J4`. The API returns a conflict if the seat has already been booked.

### Customer profile

These routes require a JWT for an account with the `Customer` role.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/customer/profile` | Get the current profile |
| `PUT` | `/api/customer/profile` | Update the current profile |
| `PUT` | `/api/customer/profile/change-password` | Change the current password |

### Administration

These routes require a JWT for an account with the `Admin` role.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard` | Get the administrator dashboard |
| `GET` | `/api/admin/dashboard/summary` | Get customer and booking totals |
| `GET` | `/api/admin/customers` | List customers |
| `GET` | `/api/admin/customers/{id}` | Get a customer |
| `PUT` | `/api/admin/customers/{id}` | Update a customer |
| `DELETE` | `/api/admin/customers/{id}` | Delete a customer without bookings |

Customers with booking history cannot be deleted; the API returns `409 Conflict`.

### Tickets

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/ticket` | Public | Create a standalone ticket |
| `GET` | `/api/ticket` | Public | List standalone tickets |
| `GET` | `/api/ticket/{id}` | Public | Get a standalone ticket |
| `PUT` | `/api/ticket/{id}` | Public | Update a standalone ticket |
| `DELETE` | `/api/ticket/{id}` | Public | Delete a standalone ticket |

Standalone ticket endpoints use in-memory storage and their data is lost when the API process stops. Tickets created as part of a booking are persisted with the booking in the database.

## Testing

The `.http` files in the repository contain example requests that can be run with the VS Code REST Client extension. They cover authentication, buses, bookings, seats, tickets, customers, and admin operations.

The Python API test suite exercises the running API and requires an existing administrator account. Set its credentials before running:

```powershell
$env:API_BASE_URL = "http://localhost:5290"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "YOUR_ADMIN_PASSWORD"
python api_test_suite.py
```

The suite registers fresh test customers and creates a test bus on each run, so it writes test data to the configured database. The default test customer password can be overridden with `TEST_PASSWORD`. See [TEST_RESULTS.md](TEST_RESULTS.md) for the recorded API test results.

## Repository layout

```text
Controllers/     API endpoints
Data/            Entity Framework database context
DTOs/            Request and response types
Migrations/      Entity Framework schema migrations
Models/          Database and API models
Services/        Admin seeding and ticket services
*.http           Example API requests
api_test_suite.py  End-to-end API tests
```

## Notes

- Store database credentials and JWT signing keys in User Secrets locally or an appropriate secret manager in deployment. Do not commit real secrets.
- The API currently has no Swagger/OpenAPI setup; the route tables above and the `.http` files document the implemented endpoints.
- Configure HTTPS and production-grade secret storage before exposing the API outside a local development environment.
