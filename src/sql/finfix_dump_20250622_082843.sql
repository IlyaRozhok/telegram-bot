--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

-- Started on 2025-06-22 05:28:43 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS railway;
--
-- TOC entry 3427 (class 1262 OID 16384)
-- Name: railway; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE railway WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 851 (class 1247 OID 16404)
-- Name: enum_debts_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_debts_status AS ENUM (
    'active',
    'closed'
);


--
-- TOC entry 848 (class 1247 OID 16397)
-- Name: enum_debts_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_debts_type AS ENUM (
    'installment',
    'bank',
    'other'
);


--
-- TOC entry 878 (class 1247 OID 16490)
-- Name: enum_feedback_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_feedback_category AS ENUM (
    'compliment',
    'bug',
    'idea'
);


--
-- TOC entry 875 (class 1247 OID 16483)
-- Name: enum_feedbacks_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_feedbacks_category AS ENUM (
    'compliment',
    'bug',
    'idea'
);


--
-- TOC entry 866 (class 1247 OID 16454)
-- Name: enum_incomes_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_incomes_frequency AS ENUM (
    'monthly',
    'weekly',
    'daily',
    'yearly',
    'one-time'
);


--
-- TOC entry 863 (class 1247 OID 16449)
-- Name: enum_incomes_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_incomes_type AS ENUM (
    'regular',
    'irregular'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16507)
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 16441)
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id uuid NOT NULL,
    telegram_id character varying(255) NOT NULL,
    type public.enum_debts_type NOT NULL,
    bank_name character varying(255),
    creditor_name character varying(255),
    amount numeric(10,2) NOT NULL,
    interest_rate numeric(5,2),
    monthly_interest numeric(10,2),
    comment character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- TOC entry 216 (class 1259 OID 16427)
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid NOT NULL,
    telegram_id character varying(255) NOT NULL,
    category character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    date timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 16497)
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id uuid NOT NULL,
    telegram_id character varying(255) NOT NULL,
    username character varying(255),
    first_name character varying(255),
    category public.enum_feedback_category DEFAULT 'idea'::public.enum_feedback_category NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 220 (class 1259 OID 16474)
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    id uuid NOT NULL,
    telegram_id character varying(255) NOT NULL,
    username character varying(255),
    first_name character varying(255),
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    category public.enum_feedbacks_category DEFAULT 'idea'::public.enum_feedbacks_category NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16465)
-- Name: incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incomes (
    id uuid NOT NULL,
    telegram_id character varying(255) NOT NULL,
    type public.enum_incomes_type NOT NULL,
    source character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    frequency public.enum_incomes_frequency DEFAULT 'one-time'::public.enum_incomes_frequency,
    description character varying(255),
    date_received timestamp with time zone,
    next_expected timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 16434)
-- Name: installments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.installments (
    id uuid NOT NULL,
    telegram_id character varying(255) NOT NULL,
    amount_per_month numeric NOT NULL,
    total_cost numeric NOT NULL,
    service_fee numeric NOT NULL,
    months_count integer NOT NULL,
    months_remaining integer NOT NULL,
    total_remaining numeric NOT NULL,
    comment character varying(255),
    start_date date NOT NULL,
    final_payment_date date NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- TOC entry 215 (class 1259 OID 16386)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    telegram_id character varying(255) NOT NULL,
    username character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    currency character varying(255) DEFAULT 'UAH'::character varying NOT NULL,
    mono_api_key character varying(255)
);


--
-- TOC entry 3428 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN users.mono_api_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.mono_api_key IS 'Monobank API key for transaction sync';


--
-- TOC entry 214 (class 1259 OID 16385)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3429 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3245 (class 2604 OID 16389)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3421 (class 0 OID 16507)
-- Dependencies: 222
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SequelizeMeta" (name) FROM stdin;
20240320_add_currency_to_users.ts
\.


--
-- TOC entry 3417 (class 0 OID 16441)
-- Dependencies: 218
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) FROM stdin;
6f42b3aa-6c42-44b3-81a5-2a65d79776ed	857166428	other	\N	Berik	728829.00	\N	\N	Due by 2025-05-08T00:00:00.000Z	2025-06-05 18:39:06.466+00	2025-06-05 18:39:06.466+00
5fdf71f5-49c5-4dde-bb0d-a7634a97cd51	456034962	bank	Wise	\N	10000.00	5.00	500.00	\N	2025-06-05 19:18:35.832+00	2025-06-05 19:18:35.832+00
abbde492-d414-47cb-b249-305bde900487	307821181	bank	Mono black	\N	58147.00	3.10	1802.56	\N	2025-06-12 15:29:55.382+00	2025-06-12 15:29:55.382+00
e5749269-3cce-42c0-ace5-b398be603c7a	307821181	bank	Abank	\N	142860.00	3.70	5285.82	\N	2025-06-12 15:32:36.746+00	2025-06-12 15:32:36.746+00
d18b7d73-abd2-435d-9bd6-f367af0dbaf1	307821181	other	\N	Wash machine	6000.00	\N	\N	Due by 2025-06-15T00:00:00.000Z	2025-06-12 15:41:27.498+00	2025-06-12 15:41:27.498+00
693f50c8-095c-4093-85c2-6dfe975c19fd	178592527	bank	Aib bank	\N	-520.00	2.50	-13.00	\N	2025-06-12 16:33:32.574+00	2025-06-12 16:33:32.574+00
a26871ab-1f4b-4f89-ad31-0147b7c0e4a1	1069365962	bank	Gggg	\N	80.00	3.49	2.79	\N	2025-06-13 10:18:01.893+00	2025-06-13 10:18:01.893+00
7d255d1d-da10-41bd-b44e-8c050badaa80	1069365962	bank	Qwer	\N	1000.00	6.00	60.00	\N	2025-06-13 10:19:40.28+00	2025-06-13 10:19:40.28+00
\.


--
-- TOC entry 3415 (class 0 OID 16427)
-- Dependencies: 216
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) FROM stdin;
b2a6fbb7-0ca1-44b7-951a-1972ec43c5cf	307821181	Telecommunications	1000.00	2025-06-12 15:39:24.854+00	2025-06-12 15:39:24.855+00	2025-06-12 15:39:24.855+00
ccf4490d-b874-4f74-a9f4-7894898d6b9f	307821181	House utilities	2000.00	2025-06-12 15:38:58.521+00	2025-06-12 15:38:58.521+00	2025-06-17 15:05:33.528+00
4d9b80aa-e195-41bd-adc9-88024b701b76	307821181	Sport	3000.00	2025-06-17 15:05:48.37+00	2025-06-17 15:05:48.372+00	2025-06-17 15:05:48.372+00
37f819b9-bee9-438e-8a1d-e51257ccfbfa	307821181	Rent	12000.00	2025-06-17 16:30:28.135+00	2025-06-17 16:30:28.137+00	2025-06-17 16:30:28.137+00
f89ff99c-c1d6-40a3-8ac9-91800d99b335	307821181	Donats	7000.00	2025-06-17 16:37:31.826+00	2025-06-17 16:37:31.827+00	2025-06-17 16:37:31.827+00
8b6f2e07-bcc6-46ec-af7a-90c18bcc01dc	307821181	Food	20000.00	2025-06-17 16:37:47.163+00	2025-06-17 16:37:47.163+00	2025-06-17 16:37:47.163+00
fc3b0d2b-5d28-4239-ae99-efe83143772a	307821181	Entertainment	4000.00	2025-06-17 16:38:01.61+00	2025-06-17 16:38:01.61+00	2025-06-17 16:38:01.61+00
\.


--
-- TOC entry 3420 (class 0 OID 16497)
-- Dependencies: 221
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback (id, telegram_id, username, first_name, category, message, is_read, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3419 (class 0 OID 16474)
-- Dependencies: 220
-- Data for Name: feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedbacks (id, telegram_id, username, first_name, message, is_read, created_at, updated_at, category) FROM stdin;
8f52040e-669f-456f-b970-03ad7d6ff337	307821181	irozho	Ilya	gogogo	f	2025-06-12 14:10:49.253+00	2025-06-12 14:10:49.254+00	idea
d8fd10db-cd5f-49d2-be90-aea4a26ce96c	307821181	irozho	Ilya	Idea	f	2025-06-12 14:45:50.051+00	2025-06-12 14:45:50.052+00	idea
26c0cce1-32c0-4656-b60a-1a2c5827391d	307821181	irozho	Ilya	Normal	f	2025-06-12 14:48:56.573+00	2025-06-12 14:48:56.574+00	compliment
4cacddd2-b968-4604-8f0b-d979e5b51f4a	307821181	irozho	Ilya	Super	f	2025-06-13 11:36:08.014+00	2025-06-13 11:36:08.014+00	idea
\.


--
-- TOC entry 3418 (class 0 OID 16465)
-- Dependencies: 219
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incomes (id, telegram_id, type, source, amount, frequency, description, date_received, next_expected, is_active, created_at, updated_at) FROM stdin;
f654741d-99ad-4c80-9de0-1b6c45b25ec3	307821181	regular	IN1	110000.00	monthly	\N	\N	\N	t	2025-06-12 15:46:03.349+00	2025-06-12 15:46:03.349+00
\.


--
-- TOC entry 3416 (class 0 OID 16434)
-- Dependencies: 217
-- Data for Name: installments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) FROM stdin;
cb1e9083-54fd-4ef9-8f8c-204f6ccfa9c9	393054561	5	15000	1425	5	4	20	iPhone 15 Pro Max)	2025-04-30	2025-09-29	2025-06-12 15:52:29.014+00	2025-06-12 15:52:29.014+00
90dba694-b5bc-491d-a588-d9959d4b1375	307821181	204.67	2000	380	10	4	818.68	gro 1	2024-11-30	2025-09-29	2025-06-17 15:08:52.079+00	2025-06-17 15:08:52.079+00
5e47168c-5df5-4c5b-8d9d-d107a5ab0f24	307821181	2456	24000	5472	12	9	22104	tax 1	2025-02-28	2026-02-27	2025-06-17 15:09:35.592+00	2025-06-17 15:09:35.592+00
5624021b-533d-499d-a550-204d15cb4a45	307821181	1510	13800	3146.4	12	6	9060	gro 2	2024-11-30	2025-11-29	2025-06-17 15:14:01.597+00	2025-06-17 15:14:01.597+00
a7fc1e64-e89b-42e1-8686-f1849077a8c6	307821181	2353.67	23000	5244	12	3	7061.01	tax 2	2024-08-31	2025-08-30	2025-06-17 15:14:46.767+00	2025-06-17 15:14:46.767+00
e0c6034b-b338-43bc-8d48-80d4ff896fa2	307821181	1023.33	10000	2280	12	7	7163.31	tax 2	2024-12-31	2025-12-30	2025-06-17 16:12:45.111+00	2025-06-17 16:12:45.111+00
3f2589f9-1d79-4ed5-9cba-a142123dddda	307821181	255	2500	570	12	6	1530	gro 3	2024-11-30	2025-11-29	2025-06-17 16:13:34.268+00	2025-06-17 16:13:34.268+00
5417366f-0c9b-4af4-9f33-fbf21c16634d	307821181	1330.33	13000	2964	12	4	5321.32	tax 3	2024-09-30	2025-09-29	2025-06-17 16:14:25.142+00	2025-06-17 16:14:25.142+00
af934488-878d-4181-a385-8bda414e29de	307821181	2067.34	20202	4606.06	12	6	12404.04	tax 3	2024-11-30	2025-11-29	2025-06-17 16:15:10.868+00	2025-06-17 16:15:10.868+00
b1693045-d158-4449-93f0-09760c01acca	307821181	6128.4	91926	26198.91	15	3	18385.199999999997	macbook	2024-05-31	2025-08-30	2025-06-17 16:47:53.84+00	2025-06-17 16:47:53.84+00
2b84c36b-f9a8-442a-ad36-fe3f75033c73	307821181	3683.34	10350	589.95	3	3	11050.02	chair	2025-05-31	2025-08-30	2025-06-17 16:49:32.543+00	2025-06-17 16:49:32.543+00
\.


--
-- TOC entry 3414 (class 0 OID 16386)
-- Dependencies: 215
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) FROM stdin;
1	393054561	Alex	2025-06-05 11:31:55.639+00	2025-06-05 11:31:55.639+00	UAH	\N
4	857166428	Tas	2025-06-05 17:22:48.496+00	2025-06-05 17:22:48.496+00	UAH	\N
8	1154710246	Ассалам	2025-06-05 19:14:19.667+00	2025-06-05 19:14:19.667+00	UAH	\N
10	412504006	Artem	2025-06-05 19:29:30.335+00	2025-06-05 19:29:30.335+00	UAH	\N
12	178592527	Никитка классный типочек	2025-06-12 16:28:33.599+00	2025-06-12 16:28:33.599+00	UAH	\N
13	515190118	Алексей	2025-06-13 09:54:18.982+00	2025-06-13 09:54:18.982+00	UAH	\N
14	608149098	Руслан	2025-06-13 10:02:28.858+00	2025-06-13 10:02:28.858+00	UAH	\N
15	1399237266	хх	2025-06-13 10:03:32.701+00	2025-06-13 10:03:32.701+00	UAH	\N
16	1069365962	Q	2025-06-13 10:15:25.253+00	2025-06-13 10:15:25.253+00	UAH	\N
17	236665854	Maksim	2025-06-13 10:44:40.387+00	2025-06-13 10:44:40.387+00	UAH	\N
20	5646791476	ееее	2025-06-13 11:21:07.467+00	2025-06-13 11:21:07.467+00	UAH	\N
24	283578211	Mir	2025-06-13 11:48:55.159+00	2025-06-13 11:48:55.159+00	USD	\N
25	451833396	TroLolo	2025-06-13 12:45:53.533+00	2025-06-13 12:45:53.533+00	PLN	\N
26	875938981	111	2025-06-13 13:21:30.838+00	2025-06-13 13:21:30.838+00	USD	\N
23	307821181	admin	2025-06-13 11:41:17.105+00	2025-06-21 18:34:47.678+00	USD	uO12j27X7gMPeIpaL1gnzjBfu4e7VjuQQf06ImMcWbuo
\.


--
-- TOC entry 3430 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- TOC entry 3270 (class 2606 OID 16511)
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- TOC entry 3262 (class 2606 OID 16447)
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- TOC entry 3258 (class 2606 OID 16433)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 3268 (class 2606 OID 16505)
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 3266 (class 2606 OID 16481)
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- TOC entry 3264 (class 2606 OID 16473)
-- Name: incomes incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_pkey PRIMARY KEY (id);


--
-- TOC entry 3260 (class 2606 OID 16440)
-- Name: installments installments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT installments_pkey PRIMARY KEY (id);


--
-- TOC entry 3254 (class 2606 OID 16393)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3256 (class 2606 OID 16395)
-- Name: users users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);


-- Completed on 2025-06-22 05:28:43 UTC

--
-- PostgreSQL database dump complete
--

