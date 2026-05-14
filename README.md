# RickshawX - Smart Mobility for CUET (2050)

RickshawX is a microservice-based ride sharing system for a smart CUET campus. It covers user auth, ride requests, trip lifecycle, fare calculation, mock payments, and notifications.

## Architecture

Services:

- **Auth**: user registration and login, JWT auth
- **Ride**: ride request creation and acceptance
- **Trip**: trip lifecycle (create, start, end), fare calculation
- **Payment**: mock payment processing on trip completion
- **Notification**: event-driven notifications
- **Gateway**: unified API base URL

Infrastructure:

- **MongoDB** for data persistence
- **RabbitMQ** for event-driven integration
- **Redis** (optional caching; currently disabled in code)

Event flow (high level):

1. Ride created -> `ride.created` event
2. Trip created -> `trip.created` event
3. Trip started -> `trip.started` event
4. Trip completed -> `trip.completed` event
5. Payment created -> `payment.completed` event
6. Trip service updates payment status
7. Notification service stores notifications for the user

## Run the system

Prerequisites:

- Docker Desktop

Start everything:

```bash
scripts/compose-up.ps1
```

Stop everything:

```bash
docker compose down
```

## URLs

- Frontend: `http://localhost:5173`
- Gateway base URL: `http://localhost:8080`
- RabbitMQ UI: `http://localhost:15672` (admin/admin)

Health checks (via gateway):

- `http://localhost:8080/health`
- `http://localhost:8080/health/auth`
- `http://localhost:8080/health/ride`
- `http://localhost:8080/health/trip`
- `http://localhost:8080/health/payment`
- `http://localhost:8080/health/notification`

## Authentication

Register (PowerShell):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/auth/register `
	-ContentType 'application/json' `
	-Body '{"name":"Junu","email":"junu@example.com","password":"secret123"}'
```

Login (PowerShell):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/auth/login `
	-ContentType 'application/json' `
	-Body '{"email":"junu@example.com","password":"secret123"}'
```

If you want curl in PowerShell, use `curl.exe`:

```powershell
curl.exe -X POST http://localhost:8080/auth/login ^
	-H "Content-Type: application/json" ^
	-d "{\"email\":\"junu@example.com\",\"password\":\"secret123\"}"
```

The response includes a JWT token. Use it as:

```
Authorization: Bearer <token>
```

## End-to-end verification

1. **Create a ride** (frontend or API)
2. **Start the trip** from the dashboard
3. **End the trip** from the dashboard
4. **Confirm payment** via payment endpoint
5. **Check notifications** on the dashboard

Direct API checks (PowerShell):

```powershell
# Create ride
Invoke-RestMethod -Method Post -Uri http://localhost:8080/ride `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer <token>" } `
  -Body '{"origin":"Main Gate","destination":"Library"}'

# Create trip (example payload)
Invoke-RestMethod -Method Post -Uri http://localhost:8080/trip `
  -ContentType 'application/json' `
  -Body '{"userId":"USER_ID","driverId":"driver-demo","rideId":"RIDE_ID","pickupLocation":{"address":"Main Gate","coordinates":{"lat":22.459,"lng":91.969}},"dropoffLocation":{"address":"Library","coordinates":{"lat":22.463,"lng":91.965}}}'

# Start and end trip
Invoke-RestMethod -Method Put -Uri http://localhost:8080/trip/TRIP_ID/start
Invoke-RestMethod -Method Put -Uri http://localhost:8080/trip/TRIP_ID/end `
  -ContentType 'application/json' `
  -Body '{"endLocation":{"address":"Library","coordinates":{"lat":22.463,"lng":91.965}}}'

# Confirm payment
Invoke-RestMethod -Method Get -Uri http://localhost:8080/payment/trip/TRIP_ID

# Notifications
Invoke-RestMethod -Method Get -Uri http://localhost:8080/notification/user/USER_ID
```

## Data storage

User and ride data is stored in MongoDB within the Docker stack:

- `auth_db`
- `ride_db`
- `trip_db`
- `payment_db`
- `notification_db`

## RabbitMQ verification

Open `http://localhost:15672` and confirm:

- **Connections** show active service connections
- **Queues** include `notification_queue`, `payment_trip_queue`, and others
- **Exchanges** include `ride_events`, `trip_events`, `payment_events`

If connections show 0, restart services. Each service retries until RabbitMQ is available.

## Troubleshooting

- **Frontend shows "Network error"**
  - Confirm gateway is running: `http://localhost:8080/health`
  - Open the frontend at `http://localhost:5173` (avoid the container IP URL)
  - Check browser DevTools -> Network for `/auth/login` or `/auth/register`
- **404 in browser for auth routes**
  - `/auth/register` and `/auth/login` are **POST** routes, not GET routes
- **PowerShell curl errors**
  - Use `Invoke-RestMethod` or `curl.exe` (see examples above)

## Service list

All service definitions live in [docker-compose.yml](docker-compose.yml).
