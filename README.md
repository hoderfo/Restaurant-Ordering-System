# Restaurant Ordering System - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb ros_db

# Run schema
psql -d ros_db -f db/01_schema.sql
```

### 3. Configure Environment
Edit `.env` file with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ros_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=secret
```

### 4. Start Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login and get JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "...",
  "user": {
    "user_id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### POST `/api/auth/logout`
Logout (requires auth token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully."
}
```

#### GET `/api/auth/me`
Get current user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

## Test Users

All test users have password: `password123`

- `admin` - Admin role (full access)
- `manager1` - Management role (analytics, reports, menu management)
- `floor1`, `floor2` - Floor staff (reservations, orders, billing)
- `kitchen1`, `kitchen2` - Kitchen staff (KDS only)

## RBAC (Role-Based Access Control)

Use the middleware in your routes:

```javascript
const { authenticateToken } = require('./middleware/auth');
const { requireRole, ROLES } = require('./middleware/rbac');

// Example: Only management can access analytics
router.get('/api/analytics/dashboard', 
  authenticateToken, 
  requireRole(ROLES.MANAGEMENT),
  (req, res) => {
    // Your handler
  }
);
```

### Available Role Groups

- `ROLES.ADMIN` - Admin only
- `ROLES.MANAGEMENT` - Admin + Management
- `ROLES.FLOOR_AND_MANAGEMENT` - Admin + Management + Floor
- `ROLES.KITCHEN_AND_MANAGEMENT` - Admin + Management + Kitchen
- `ROLES.ALL_STAFF` - All roles

## Audit Logging

All login attempts, logout events, and access denials are automatically logged to the `audit_log` table.

To log custom events:
```javascript
const { logAudit } = require('./utils/audit');

await logAudit(
  req.user.user_id,
  'void_item',
  `order_item_${itemId}`,
  true,
  req.ip,
  { reason: 'customer complaint' }
);
```

## Next Steps for Team Integration

This auth system unblocks:
- **Member A**: Can now protect reservation endpoints with `requireRole(ROLES.FLOOR_AND_MANAGEMENT)`
- **Member B**: Can protect KDS endpoints with `requireRole(ROLES.KITCHEN_AND_MANAGEMENT)`
- **Member C**: Can protect menu management with `requireRole(ROLES.MANAGEMENT)` and billing with `requireRole(ROLES.FLOOR_AND_MANAGEMENT)`

All team members should test their endpoints with:
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"floor1","password":"password123"}'

# Use the token in subsequent requests
curl http://localhost:3000/api/your-endpoint \
  -H "Authorization: Bearer <token>"
```
