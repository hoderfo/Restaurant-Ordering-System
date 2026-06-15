--
-- PostgreSQL database dump
--

\restrict TZouCbGnlsOD8KOLKcy61T6qnklhauSrXYfXYW2l2wKV13oBubyJOOqbqOyjtsB

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DiscountType" AS ENUM (
    'PERCENTAGE',
    'FLAT'
);


ALTER TYPE public."DiscountType" OWNER TO postgres;

--
-- Name: MenuCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MenuCategory" AS ENUM (
    'STARTER',
    'MAIN',
    'DESSERT',
    'BEVERAGE'
);


ALTER TYPE public."MenuCategory" OWNER TO postgres;

--
-- Name: MenuItemStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MenuItemStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SOLD_OUT'
);


ALTER TYPE public."MenuItemStatus" OWNER TO postgres;

--
-- Name: OrderItemStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderItemStatus" AS ENUM (
    'PENDING',
    'IN_PREPARATION',
    'READY',
    'SERVED'
);


ALTER TYPE public."OrderItemStatus" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'BILLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'EWALLET'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'PENDING',
    'SEATED',
    'CANCELLED',
    'NO_SHOW',
    'COMPLETED'
);


ALTER TYPE public."ReservationStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'admin',
    'management',
    'floor',
    'kitchen'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TableStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'OCCUPIED',
    'CLEANING'
);


ALTER TYPE public."TableStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    "userId" integer,
    action text NOT NULL,
    resource text,
    success boolean NOT NULL,
    "ipAddress" text,
    details jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bills (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "taxRate" numeric(5,2) NOT NULL,
    "taxAmount" numeric(10,2) NOT NULL,
    "discountType" public."DiscountType",
    "discountValue" numeric(10,2),
    "discountAmount" numeric(10,2),
    "discountReason" text,
    total numeric(10,2) NOT NULL,
    "paymentMethod" public."PaymentMethod",
    "closedAt" timestamp(3) without time zone,
    "closedById" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bills OWNER TO postgres;

--
-- Name: bills_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bills_id_seq OWNER TO postgres;

--
-- Name: bills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bills_id_seq OWNED BY public.bills.id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category public."MenuCategory" NOT NULL,
    status public."MenuItemStatus" DEFAULT 'ACTIVE'::public."MenuItemStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "menuItemId" integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    note text,
    status public."OrderItemStatus" DEFAULT 'PENDING'::public."OrderItemStatus" NOT NULL,
    "voidedAt" timestamp(3) without time zone,
    "voidedById" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    "tableId" integer NOT NULL,
    "reservationId" integer,
    status public."OrderStatus" DEFAULT 'ACTIVE'::public."OrderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lockedAt" timestamp(3) without time zone
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    "tableId" integer NOT NULL,
    "customerName" text NOT NULL,
    phone text NOT NULL,
    "partySize" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    duration integer DEFAULT 90 NOT NULL,
    notes text,
    status public."ReservationStatus" DEFAULT 'PENDING'::public."ReservationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" integer NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledById" integer
);


ALTER TABLE public.reservations OWNER TO postgres;

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO postgres;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tables (
    id integer NOT NULL,
    label text NOT NULL,
    capacity integer NOT NULL,
    status public."TableStatus" DEFAULT 'AVAILABLE'::public."TableStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tables OWNER TO postgres;

--
-- Name: tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tables_id_seq OWNER TO postgres;

--
-- Name: tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tables_id_seq OWNED BY public.tables.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: void_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.void_log (
    id integer NOT NULL,
    "orderItemId" integer NOT NULL,
    reason text NOT NULL,
    "voidedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "voidedById" integer NOT NULL
);


ALTER TABLE public.void_log OWNER TO postgres;

--
-- Name: void_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.void_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.void_log_id_seq OWNER TO postgres;

--
-- Name: void_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.void_log_id_seq OWNED BY public.void_log.id;


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: bills id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills ALTER COLUMN id SET DEFAULT nextval('public.bills_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables ALTER COLUMN id SET DEFAULT nextval('public.tables_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: void_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.void_log ALTER COLUMN id SET DEFAULT nextval('public.void_log_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
74e67685-48dc-4414-9a3f-e7f78ac6a7bc	f37fb9420c22aab0f613da6f6a33b1c904803a1ec51114f838e9c7c62758df41	2026-06-10 22:25:32.914563+07	20260610152532_init	\N	\N	2026-06-10 22:25:32.831492+07	1
9fa00190-399c-4a90-bf9a-320e38a1b741	a0589a2d834b61fb0fd318b02880a007c0ea61d0ebe68c497109b8090535506a	2026-06-11 18:20:30.894995+07	20260611112030_init	\N	\N	2026-06-11 18:20:30.884054+07	1
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, "userId", action, resource, success, "ipAddress", details, "timestamp") FROM stdin;
1	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:43.088
2	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:44.857
3	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:45.628
4	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:50.537
5	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:51.651
6	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:52.313
7	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:52.881
8	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:53.257
9	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:53.539
10	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:53.754
11	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:53.937
12	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:31:54.112
13	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:19.111
14	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:19.929
15	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:20.663
16	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:21.241
17	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:21.658
18	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:23.4
19	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:23.98
20	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:24.289
21	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:24.729
22	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:25.217
23	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:25.796
24	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:26.341
25	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:27.257
26	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:28.134
27	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:32:28.632
28	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:34:55.018
29	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:29.059
30	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:30.633
31	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:31.19
32	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:31.607
33	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:31.868
34	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:32.045
35	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:32.232
36	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:32.419
37	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:32.601
38	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:52:32.779
39	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-10 15:57:51.884
41	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:45.533
40	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:45.531
42	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:45.543
43	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:45.545
44	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:45.63
45	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:45.645
46	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:48.964
47	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:48.967
48	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:48.987
49	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:48.997
50	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:49.054
51	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-11 11:17:49.058
52	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-11 11:17:59.62
53	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-11 11:19:18.528
54	3	LOGIN_SUCCESS	auth	t	::1	{"username": "floor1"}	2026-06-11 11:26:55.251
55	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-12 01:39:14.785
56	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-12 01:39:14.817
57	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-12 01:39:14.826
58	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-12 01:39:14.832
59	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-12 01:39:14.858
60	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-12 01:39:14.881
61	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-12 01:40:49.108
62	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-12 01:45:46.852
63	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-12 01:56:08.474
64	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-12 02:10:06.039
65	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-12 05:55:49.516
66	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-12 06:23:04.452
67	3	LOGIN_SUCCESS	auth	t	::1	{"username": "floor1"}	2026-06-12 06:25:27.811
68	3	LOGIN_SUCCESS	auth	t	::1	{"username": "floor1"}	2026-06-12 06:28:52.679
69	3	ACCESS_DENIED	/kitchen	f	::1	{"method": "GET", "user_role": "floor", "required_roles": ["admin", "management", "kitchen"]}	2026-06-12 06:29:02.246
70	3	ACCESS_DENIED	/kitchen	f	::1	{"method": "GET", "user_role": "floor", "required_roles": ["admin", "management", "kitchen"]}	2026-06-12 06:29:04.186
71	3	ACCESS_DENIED	/kitchen	f	::1	{"method": "GET", "user_role": "floor", "required_roles": ["admin", "management", "kitchen"]}	2026-06-12 06:29:06.452
72	5	LOGIN_SUCCESS	auth	t	::1	{"username": "kitchen1"}	2026-06-12 06:29:43.816
73	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:29:46.939
74	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:29:46.947
75	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:32:51.132
76	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:32:51.141
77	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:33:02.303
78	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:34:06.94
79	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:37:44.693
80	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:37:44.702
81	5	ACCESS_DENIED	/7	f	::1	{"method": "PUT", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:37:50.589
82	5	ACCESS_DENIED	/7	f	::1	{"method": "PUT", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:37:52.881
83	5	ACCESS_DENIED	/7	f	::1	{"method": "PUT", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:37:53.502
84	5	ACCESS_DENIED	/7	f	::1	{"method": "PUT", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:37:54.053
85	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:41:29.485
86	3	ACCESS_DENIED	/kitchen	f	::1	{"method": "GET", "user_role": "floor", "required_roles": ["admin", "management", "kitchen"]}	2026-06-12 06:41:32.514
87	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:50:45.231
88	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:50:45.244
89	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:57:37.854
90	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:57:37.865
91	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 06:57:45.471
92	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 07:01:36.446
93	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 07:10:49.982
94	5	ACCESS_DENIED	/	f	::1	{"method": "GET", "user_role": "kitchen", "required_roles": ["admin", "management", "floor"]}	2026-06-12 07:10:49.987
95	3	ACCESS_DENIED	/kitchen	f	::1	{"method": "GET", "user_role": "floor", "required_roles": ["admin", "management", "kitchen"]}	2026-06-12 07:12:07.618
96	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:50.476
97	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:50.511
98	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:50.481
99	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:50.487
100	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:54.108
101	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:54.112
102	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:54.119
103	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-14 09:12:54.123
104	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-14 09:13:03.277
105	3	LOGIN_SUCCESS	auth	t	::1	{"username": "floor1"}	2026-06-14 09:13:14.565
106	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-14 12:46:48.911
107	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-14 12:46:50.362
108	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-14 12:47:02.459
109	3	LOGIN_SUCCESS	auth	t	::1	{"username": "floor1"}	2026-06-14 12:53:33.396
110	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-14 12:54:01.352
111	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:47.982
112	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:47.984
113	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:47.986
114	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:47.996
115	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:51.834
116	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:51.836
117	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:51.84
118	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:51.842
119	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:53.311
120	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:53.314
121	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:53.318
122	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:53.32
123	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:54.978
124	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:54.98
125	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:54.984
126	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:54.986
127	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:55.463
128	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:55.465
129	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:55.472
130	\N	AUTH_FAILED	token_validation	f	::1	{"error": "jwt expired"}	2026-06-15 16:33:55.475
131	1	LOGIN_SUCCESS	auth	t	::1	{"username": "admin"}	2026-06-15 16:34:02.009
132	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 16:34:07.604
133	1	ADMIN_VIEW_USERS	admin_panel	t	::1	{}	2026-06-15 16:34:10.448
134	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 16:34:41.405
135	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 16:34:45.707
136	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 16:34:46.909
137	1	EXPORT_REPORT_PDF	report_daily_2026-06-15	t	::1	{"date": "2026-06-15", "type": "daily"}	2026-06-15 16:34:49.346
138	1	EXPORT_REPORT_PDF	report_daily_2026-06-15	t	::1	{"date": "2026-06-15", "type": "daily"}	2026-06-15 16:34:51.568
139	1	EXPORT_REPORT_PDF	report_daily_2026-06-15	t	::1	{"date": "2026-06-15", "type": "daily"}	2026-06-15 16:34:54.431
140	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 16:35:03.671
141	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 16:35:30.665
142	1	ADMIN_VIEW_USERS	admin_panel	t	::1	{}	2026-06-15 16:39:00.58
143	1	EXPORT_REPORT_PDF	report_daily_2026-06-15	t	::1	{"date": "2026-06-15", "type": "daily"}	2026-06-15 16:39:03.336
144	1	EXPORT_REPORT_PDF	report_daily_2026-06-15	t	::1	{"date": "2026-06-15", "type": "daily"}	2026-06-15 16:39:05.167
145	1	ADMIN_VIEW_DASHBOARD	admin_panel	t	::1	{}	2026-06-15 17:47:25.543
\.


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bills (id, "orderId", subtotal, "taxRate", "taxAmount", "discountType", "discountValue", "discountAmount", "discountReason", total, "paymentMethod", "closedAt", "closedById", "createdAt") FROM stdin;
1	1	58.00	10.00	5.80	\N	\N	0.00	\N	63.80	CASH	2026-06-12 06:25:47.73	3	2026-06-12 06:25:47.735
2	3	11.00	10.00	1.10	\N	\N	0.00	\N	12.10	CASH	2026-06-12 06:33:56.876	3	2026-06-12 06:33:56.884
3	4	11.00	10.00	1.10	\N	\N	0.00	\N	12.10	CASH	2026-06-12 06:59:30.537	3	2026-06-12 06:59:30.538
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_items (id, name, description, price, category, status, "createdAt") FROM stdin;
1	A5 Japanese Wagyu Striploin	Wagyu striploin served alongside a rich demi-glace, truffled potato mousseline, and charred seasonal wild mushrooms	12.00	MAIN	ACTIVE	2026-06-10 15:29:41.622
3	Butter-Poached Lobster Tail	Slow-cooked in clarified butter until tender, served over a rich lobster risotto or alongside white asparagus and a citrus-herb emulsion	11.00	MAIN	ACTIVE	2026-06-10 15:29:41.623
10	Smoked Rosemary & Blood Orange Spritz	Freshly squeezed blood orange juice, rosemary-infused simple syrup, sparkling artisanal water, and a torched rosemary sprig	2.50	BEVERAGE	ACTIVE	2026-06-10 15:29:41.624
11	Pan-roasted Sea Bass	Known for its buttery texture, paired with a light saffron or lemongrass-infused dashi broth, wilted baby bok choy, and ginger oil	10.50	MAIN	ACTIVE	2026-06-10 15:29:41.624
2	Mille-Feuille	Paper-thin layers of caramelized puff pastry stacked precisely with rich pastry cream, fresh berries, and a dusting of powdered sugar	5.00	DESSERT	ACTIVE	2026-06-10 15:29:41.623
4	Sparkling Water	Refreshing sparkling mineral water	4.50	BEVERAGE	ACTIVE	2026-06-10 15:29:41.623
6	Grand Marnier Souffle	A dramatic, perfectly risen souffle flavored with orange liqueur, punctured at the table to pour in vanilla bean Creme Anglaise	5.50	DESSERT	ACTIVE	2026-06-10 15:29:41.622
7	Herb-crusted Rack of Lamb	Roasted to a perfect medium-rare, crusted with Dijon mustard and fresh herbs, served with a red wine reduction and roasted root vegetables	11.50	MAIN	ACTIVE	2026-06-10 15:29:41.623
8	Foie Gras au Torchon	Smooth duck liver terrine served with a seasonal fruit compote and toasted brioche	8.50	STARTER	ACTIVE	2026-06-10 15:29:41.623
5	Pan-seared Scallops	Pan-seared scallops served with a velvety cauliflower puree, a drizzle of brown butter sage sauce, and crispy pancetta	9.50	STARTER	ACTIVE	2026-06-10 15:29:41.623
9	Wagyu Beef Tartare	Hand-cut premium Wagyu mixed with capers, shallots, cornichons, and a cured egg yolk	7.00	STARTER	ACTIVE	2026-06-10 15:29:41.624
12	Smoked Old Fashioned	High-end bourbon or rye whiskey stirred with bitters and demerara syrup, trapped under a glass dome filled with cherrywood smoke	2.00	BEVERAGE	ACTIVE	2026-06-10 15:29:41.624
13	The Vesper Martini	A sophisticated, timeless classic made with premium gin, vodka, and Lillet Blanc, shaken until ice-cold and garnished with a thin lemon peel	3.50	BEVERAGE	ACTIVE	2026-06-10 15:29:41.765
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, "orderId", "menuItemId", quantity, "unitPrice", note, status, "voidedAt", "voidedById", "createdAt") FROM stdin;
3	3	3	1	11.00		READY	\N	\N	2026-06-12 06:33:27.283
2	1	9	2	7.00		READY	\N	\N	2026-06-12 06:24:27.993
1	1	3	4	11.00		READY	\N	\N	2026-06-12 06:24:18.331
4	4	3	1	11.00		READY	\N	\N	2026-06-12 06:50:35.622
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "tableId", "reservationId", status, "createdAt", "lockedAt") FROM stdin;
1	1	\N	BILLED	2026-06-12 06:24:02.059	2026-06-12 06:25:47.737
2	1	\N	ACTIVE	2026-06-12 06:26:00.36	\N
3	7	\N	BILLED	2026-06-12 06:33:23.04	2026-06-12 06:33:56.898
4	6	\N	BILLED	2026-06-12 06:49:57.675	2026-06-12 06:59:30.545
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservations (id, "tableId", "customerName", phone, "partySize", date, "startTime", duration, notes, status, "createdAt", "createdById", "cancelledAt", "cancelledById") FROM stdin;
2	7	dasdad	1112312	2	2026-06-11 00:00:00	2026-06-11 02:50:00	90	\N	PENDING	2026-06-11 02:50:39.541	1	\N	\N
1	1	cuong	54542	2	2026-06-11 00:00:00	2026-06-11 02:49:00	1372	\N	COMPLETED	2026-06-11 02:49:59.412	1	\N	\N
3	1	asfda	435345	2	2026-06-12 00:00:00	2026-06-12 06:23:00	3	\N	COMPLETED	2026-06-12 06:23:55.761	1	\N	\N
4	7	asfda	32423	2	2026-06-12 00:00:00	2026-06-12 06:33:00	1	\N	COMPLETED	2026-06-12 06:33:02.285	3	\N	\N
5	1	okk	3453445	2	2026-06-12 00:00:00	2026-06-12 06:49:00	1	\N	COMPLETED	2026-06-12 06:49:03.279	3	\N	\N
6	6	okk	3453445	6	2026-06-12 00:00:00	2026-06-12 06:49:00	10	\N	COMPLETED	2026-06-12 06:49:51.588	3	\N	\N
7	1	sfsdfsdf	567484694	2	2026-06-16 00:00:00	2026-06-16 07:03:00	1	\N	COMPLETED	2026-06-12 07:04:12.405	3	\N	\N
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tables (id, label, capacity, status, "createdAt", "isActive") FROM stdin;
2	T4	4	AVAILABLE	2026-06-10 15:25:47.182	t
3	T3	4	AVAILABLE	2026-06-10 15:25:47.182	t
4	T7	8	AVAILABLE	2026-06-10 15:25:47.182	t
5	T8	8	AVAILABLE	2026-06-10 15:25:47.182	t
8	T6	6	AVAILABLE	2026-06-10 15:25:47.182	t
11	23132	4	AVAILABLE	2026-06-11 11:21:05.902	f
12	234243234	4	AVAILABLE	2026-06-11 11:21:08.797	f
13	T22	7	AVAILABLE	2026-06-11 11:26:38.393	f
9	55	4	AVAILABLE	2026-06-10 15:37:31.713	f
10	11	4	AVAILABLE	2026-06-11 11:21:02.583	f
7	T2	2	AVAILABLE	2026-06-10 15:25:47.182	t
6	T5	6	AVAILABLE	2026-06-10 15:25:47.182	t
1	T1	2	AVAILABLE	2026-06-10 15:25:47.182	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role, "createdAt") FROM stdin;
1	admin	$2b$10$ASgznRqMyJl9V2fOYddWW.BhaPZdrX2ToJgQ0DmNOLb2auuap/rv.	admin	2026-06-10 15:25:47.165
2	manager1	$2b$10$ASgznRqMyJl9V2fOYddWW.BhaPZdrX2ToJgQ0DmNOLb2auuap/rv.	management	2026-06-10 15:25:47.172
3	floor1	$2b$10$ASgznRqMyJl9V2fOYddWW.BhaPZdrX2ToJgQ0DmNOLb2auuap/rv.	floor	2026-06-10 15:25:47.174
4	floor2	$2b$10$ASgznRqMyJl9V2fOYddWW.BhaPZdrX2ToJgQ0DmNOLb2auuap/rv.	floor	2026-06-10 15:25:47.176
5	kitchen1	$2b$10$ASgznRqMyJl9V2fOYddWW.BhaPZdrX2ToJgQ0DmNOLb2auuap/rv.	kitchen	2026-06-10 15:25:47.177
6	kitchen2	$2b$10$ASgznRqMyJl9V2fOYddWW.BhaPZdrX2ToJgQ0DmNOLb2auuap/rv.	kitchen	2026-06-10 15:25:47.179
\.


--
-- Data for Name: void_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.void_log (id, "orderItemId", reason, "voidedAt", "voidedById") FROM stdin;
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 145, true);


--
-- Name: bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bills_id_seq', 3, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 13, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 4, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 4, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservations_id_seq', 7, true);


--
-- Name: tables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tables_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: void_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.void_log_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: void_log void_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.void_log
    ADD CONSTRAINT void_log_pkey PRIMARY KEY (id);


--
-- Name: audit_log_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_log_timestamp_idx ON public.audit_log USING btree ("timestamp");


--
-- Name: audit_log_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_log_userId_idx" ON public.audit_log USING btree ("userId");


--
-- Name: bills_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "bills_orderId_key" ON public.bills USING btree ("orderId");


--
-- Name: order_items_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_items_orderId_idx" ON public.order_items USING btree ("orderId");


--
-- Name: order_items_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_status_idx ON public.order_items USING btree (status);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_tableId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_tableId_idx" ON public.orders USING btree ("tableId");


--
-- Name: reservations_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reservations_date_idx ON public.reservations USING btree (date);


--
-- Name: reservations_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reservations_status_idx ON public.reservations USING btree (status);


--
-- Name: reservations_tableId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reservations_tableId_idx" ON public.reservations USING btree ("tableId");


--
-- Name: tables_label_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tables_label_key ON public.tables USING btree (label);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: void_log_orderItemId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "void_log_orderItemId_key" ON public.void_log USING btree ("orderItemId");


--
-- Name: audit_log audit_log_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bills bills_closedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bills bills_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_voidedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public.reservations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.tables(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservations reservations_cancelledById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reservations reservations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservations reservations_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.tables(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: void_log void_log_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.void_log
    ADD CONSTRAINT "void_log_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public.order_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: void_log void_log_voidedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.void_log
    ADD CONSTRAINT "void_log_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict TZouCbGnlsOD8KOLKcy61T6qnklhauSrXYfXYW2l2wKV13oBubyJOOqbqOyjtsB

