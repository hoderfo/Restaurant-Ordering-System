CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'management', 'floor', 'kitchen'))
);

CREATE TABLE tables (
    table_id SERIAL PRIMARY KEY,
    label VARCHAR(10) NOT NULL, -- e.g. T1, T2,...
    capacity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning'))
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    table_id INT REFERENCES tables(table_id),
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    party_size INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INT NOT NULL DEFAULT 90, -- in minutes!
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'seated', 'cancelled', 'no_show', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INT REFERENCES users(user_id),
    cancelled_at TIMESTAMPTZ,
    cancelled_by INT REFERENCES users(user_id)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    table_id INT REFERENCES tables(table_id),
    reservation_id INT REFERENCES reservations(reservation_id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'billed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ -- Set when billing starts
);

CREATE TABLE menu_items (
    menu_item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('starter', 'main', 'dessert', 'beverage')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out'))
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    menu_item_id INT REFERENCES menu_items(menu_item_id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL, -- snapshot(?) at time of order
    note VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_preparation', 'ready', 'served')),
    voided_at TIMESTAMPTZ,
    voided_by INT REFERENCES users(user_id)
);

CREATE TABLE bills (
    bill_id SERIAL PRIMARY KEY,
    order_id INT UNIQUE REFERENCES orders(order_id),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'flat', NULL)),
    discount_value DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    discount_reason TEXT,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'ewallet')),
    closed_at TIMESTAMPTZ,
    closed_by INT REFERENCES users(user_id)
);

CREATE TABLE void_log ( -- Append-only, DO NOT DELETE!!!
    void_log_id SERIAL PRIMARY KEY,
    order_item_id INT REFERENCES order_items(order_item_id),
    reason TEXT NOT NULL,
    voided_at TIMESTAMPTZ DEFAULT NOW(),
    voided_by INT REFERENCES users(user_id)
);

CREATE TABLE audit_log (
	audit_log_id SERIAL PRIMARY KEY,
	user_id INT REFERENCES users(user_id),
	action VARCHAR(50) NOT NULL,
	resource VARCHAR(100),
	timestamp TIMESTAMPTZ DEFAULT NOW(),
	ip_address VARCHAR(45),
	success BOOLEAN NOT NULL,
	details JSONB
);
