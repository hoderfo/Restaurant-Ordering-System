# Backend Testing Checklist

## Overview
This checklist verifies the new backend routes for Part C.

## 1. Initiatation

1. Start the server:
   ```bash
   npm run dev
   ```

## 2. Menu management (management role)

### Login as `manager1`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager1","password":"password123"}'
```

Save the returned `token`.

### Create a menu item

```bash
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Truffle Pasta",
    "description": "Creamy pasta with truffle oil",
    "price": 18.50,
    "category": "main",
    "status": "active"
  }'
```

Expected:
- status code `201`
- response contains `menuItem`
- `category` is one of `starter`, `main`, `dessert`, `beverage`

### Update a menu item

```bash
curl -X PUT http://localhost:3000/api/menu/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "price": 19.00,
    "status": "active"
  }'
```

Expected:
- status code `200`
- response contains updated `menuItem`

### Delete (deactivate) a menu item

```bash
curl -X DELETE http://localhost:3000/api/menu/1 \
  -H "Authorization: Bearer <token>"
```

Expected:
- status code `200`
- message: `Menu item marked inactive.`
- item status becomes `inactive`

## 3. Billing and checkout (floor role)

### Login as floor staff

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"floor1","password":"password123"}'
```

Save the token.

### Checkout an order

```bash
curl -X POST http://localhost:3000/api/orders/1/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "paymentMethod": "card",
    "discountType": "percentage",
    "discountValue": 10,
    "discountReason": "Loyalty discount"
  }'
```

Expected:
- status code `201`
- response contains `bill`
- `orders.status` becomes `billed`
- `orders.locked_at` is populated
- `bills.payment_method` is one of `cash`, `card`, `ewallet`

### View the bill

```bash
curl http://localhost:3000/api/orders/1/bill \
  -H "Authorization: Bearer <token>"
```

Expected:
- status code `200`
- response contains `bill`

## 4. RBAC validation

Try accessing menu management with a non-management token and expect `403`.
Try checking out with a `kitchen` token and expect `403`.

## 5. Database checks

Confirm the following in PostgreSQL:
- `orders.status` changed to `billed`
- `orders.locked_at` is not null
- `bills` row exists for `order_id`

## 6. Helpful notes

- Use `HTTP 401` when token is missing.
- Use `HTTP 403` when role is not allowed.
- Use `HTTP 404` for missing resources.
- Use `HTTP 400` for invalid input fields.
