--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

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
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public."SequelizeMeta" (name) VALUES ('20240320_add_currency_to_users.ts');


--
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('6f42b3aa-6c42-44b3-81a5-2a65d79776ed', '857166428', 'other', NULL, 'Berik', 728829.00, NULL, NULL, 'Due by 2025-05-08T00:00:00.000Z', '2025-06-05 18:39:06.466+00', '2025-06-05 18:39:06.466+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('5fdf71f5-49c5-4dde-bb0d-a7634a97cd51', '456034962', 'bank', 'Wise', NULL, 10000.00, 5.00, 500.00, NULL, '2025-06-05 19:18:35.832+00', '2025-06-05 19:18:35.832+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('abbde492-d414-47cb-b249-305bde900487', '307821181', 'bank', 'Mono black', NULL, 58147.00, 3.10, 1802.56, NULL, '2025-06-12 15:29:55.382+00', '2025-06-12 15:29:55.382+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('e5749269-3cce-42c0-ace5-b398be603c7a', '307821181', 'bank', 'Abank', NULL, 142860.00, 3.70, 5285.82, NULL, '2025-06-12 15:32:36.746+00', '2025-06-12 15:32:36.746+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('d18b7d73-abd2-435d-9bd6-f367af0dbaf1', '307821181', 'other', NULL, 'Wash machine', 6000.00, NULL, NULL, 'Due by 2025-06-15T00:00:00.000Z', '2025-06-12 15:41:27.498+00', '2025-06-12 15:41:27.498+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('693f50c8-095c-4093-85c2-6dfe975c19fd', '178592527', 'bank', 'Aib bank', NULL, -520.00, 2.50, -13.00, NULL, '2025-06-12 16:33:32.574+00', '2025-06-12 16:33:32.574+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('a26871ab-1f4b-4f89-ad31-0147b7c0e4a1', '1069365962', 'bank', 'Gggg', NULL, 80.00, 3.49, 2.79, NULL, '2025-06-13 10:18:01.893+00', '2025-06-13 10:18:01.893+00');
INSERT INTO public.debts (id, telegram_id, type, bank_name, creditor_name, amount, interest_rate, monthly_interest, comment, created_at, updated_at) VALUES ('7d255d1d-da10-41bd-b44e-8c050badaa80', '1069365962', 'bank', 'Qwer', NULL, 1000.00, 6.00, 60.00, NULL, '2025-06-13 10:19:40.28+00', '2025-06-13 10:19:40.28+00');


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('b2a6fbb7-0ca1-44b7-951a-1972ec43c5cf', '307821181', 'Telecommunications', 1000.00, '2025-06-12 15:39:24.854+00', '2025-06-12 15:39:24.855+00', '2025-06-12 15:39:24.855+00');
INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('ccf4490d-b874-4f74-a9f4-7894898d6b9f', '307821181', 'House utilities', 2000.00, '2025-06-12 15:38:58.521+00', '2025-06-12 15:38:58.521+00', '2025-06-17 15:05:33.528+00');
INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('4d9b80aa-e195-41bd-adc9-88024b701b76', '307821181', 'Sport', 3000.00, '2025-06-17 15:05:48.37+00', '2025-06-17 15:05:48.372+00', '2025-06-17 15:05:48.372+00');
INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('37f819b9-bee9-438e-8a1d-e51257ccfbfa', '307821181', 'Rent', 12000.00, '2025-06-17 16:30:28.135+00', '2025-06-17 16:30:28.137+00', '2025-06-17 16:30:28.137+00');
INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('f89ff99c-c1d6-40a3-8ac9-91800d99b335', '307821181', 'Donats', 7000.00, '2025-06-17 16:37:31.826+00', '2025-06-17 16:37:31.827+00', '2025-06-17 16:37:31.827+00');
INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('8b6f2e07-bcc6-46ec-af7a-90c18bcc01dc', '307821181', 'Food', 20000.00, '2025-06-17 16:37:47.163+00', '2025-06-17 16:37:47.163+00', '2025-06-17 16:37:47.163+00');
INSERT INTO public.expenses (id, telegram_id, category, amount, date, created_at, updated_at) VALUES ('fc3b0d2b-5d28-4239-ae99-efe83143772a', '307821181', 'Entertainment', 4000.00, '2025-06-17 16:38:01.61+00', '2025-06-17 16:38:01.61+00', '2025-06-17 16:38:01.61+00');


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: finadmin
--



--
-- Data for Name: feedbacks; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public.feedbacks (id, telegram_id, username, first_name, message, is_read, created_at, updated_at, category) VALUES ('8f52040e-669f-456f-b970-03ad7d6ff337', '307821181', 'irozho', 'Ilya', 'gogogo', false, '2025-06-12 14:10:49.253+00', '2025-06-12 14:10:49.254+00', 'idea');
INSERT INTO public.feedbacks (id, telegram_id, username, first_name, message, is_read, created_at, updated_at, category) VALUES ('d8fd10db-cd5f-49d2-be90-aea4a26ce96c', '307821181', 'irozho', 'Ilya', 'Idea', false, '2025-06-12 14:45:50.051+00', '2025-06-12 14:45:50.052+00', 'idea');
INSERT INTO public.feedbacks (id, telegram_id, username, first_name, message, is_read, created_at, updated_at, category) VALUES ('26c0cce1-32c0-4656-b60a-1a2c5827391d', '307821181', 'irozho', 'Ilya', 'Normal', false, '2025-06-12 14:48:56.573+00', '2025-06-12 14:48:56.574+00', 'compliment');
INSERT INTO public.feedbacks (id, telegram_id, username, first_name, message, is_read, created_at, updated_at, category) VALUES ('4cacddd2-b968-4604-8f0b-d979e5b51f4a', '307821181', 'irozho', 'Ilya', 'Super', false, '2025-06-13 11:36:08.014+00', '2025-06-13 11:36:08.014+00', 'idea');


--
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public.incomes (id, telegram_id, type, source, amount, frequency, description, date_received, next_expected, is_active, created_at, updated_at) VALUES ('f654741d-99ad-4c80-9de0-1b6c45b25ec3', '307821181', 'regular', 'IN1', 110000.00, 'monthly', NULL, NULL, NULL, true, '2025-06-12 15:46:03.349+00', '2025-06-12 15:46:03.349+00');


--
-- Data for Name: installments; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('cb1e9083-54fd-4ef9-8f8c-204f6ccfa9c9', '393054561', 5, 15000, 1425, 5, 4, 20, 'iPhone 15 Pro Max)', '2025-04-30', '2025-09-29', '2025-06-12 15:52:29.014+00', '2025-06-12 15:52:29.014+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('90dba694-b5bc-491d-a588-d9959d4b1375', '307821181', 204.67, 2000, 380, 10, 4, 818.68, 'gro 1', '2024-11-30', '2025-09-29', '2025-06-17 15:08:52.079+00', '2025-06-17 15:08:52.079+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('5e47168c-5df5-4c5b-8d9d-d107a5ab0f24', '307821181', 2456, 24000, 5472, 12, 9, 22104, 'tax 1', '2025-02-28', '2026-02-27', '2025-06-17 15:09:35.592+00', '2025-06-17 15:09:35.592+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('5624021b-533d-499d-a550-204d15cb4a45', '307821181', 1510, 13800, 3146.4, 12, 6, 9060, 'gro 2', '2024-11-30', '2025-11-29', '2025-06-17 15:14:01.597+00', '2025-06-17 15:14:01.597+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('a7fc1e64-e89b-42e1-8686-f1849077a8c6', '307821181', 2353.67, 23000, 5244, 12, 3, 7061.01, 'tax 2', '2024-08-31', '2025-08-30', '2025-06-17 15:14:46.767+00', '2025-06-17 15:14:46.767+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('e0c6034b-b338-43bc-8d48-80d4ff896fa2', '307821181', 1023.33, 10000, 2280, 12, 7, 7163.31, 'tax 2', '2024-12-31', '2025-12-30', '2025-06-17 16:12:45.111+00', '2025-06-17 16:12:45.111+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('3f2589f9-1d79-4ed5-9cba-a142123dddda', '307821181', 255, 2500, 570, 12, 6, 1530, 'gro 3', '2024-11-30', '2025-11-29', '2025-06-17 16:13:34.268+00', '2025-06-17 16:13:34.268+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('5417366f-0c9b-4af4-9f33-fbf21c16634d', '307821181', 1330.33, 13000, 2964, 12, 4, 5321.32, 'tax 3', '2024-09-30', '2025-09-29', '2025-06-17 16:14:25.142+00', '2025-06-17 16:14:25.142+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('af934488-878d-4181-a385-8bda414e29de', '307821181', 2067.34, 20202, 4606.06, 12, 6, 12404.04, 'tax 3', '2024-11-30', '2025-11-29', '2025-06-17 16:15:10.868+00', '2025-06-17 16:15:10.868+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('b1693045-d158-4449-93f0-09760c01acca', '307821181', 6128.4, 91926, 26198.91, 15, 3, 18385.199999999997, 'macbook', '2024-05-31', '2025-08-30', '2025-06-17 16:47:53.84+00', '2025-06-17 16:47:53.84+00');
INSERT INTO public.installments (id, telegram_id, amount_per_month, total_cost, service_fee, months_count, months_remaining, total_remaining, comment, start_date, final_payment_date, created_at, updated_at) VALUES ('2b84c36b-f9a8-442a-ad36-fe3f75033c73', '307821181', 3683.34, 10350, 589.95, 3, 3, 11050.02, 'chair', '2025-05-31', '2025-08-30', '2025-06-17 16:49:32.543+00', '2025-06-17 16:49:32.543+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: finadmin
--

INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (1, '393054561', 'Alex', '2025-06-05 11:31:55.639+00', '2025-06-05 11:31:55.639+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (4, '857166428', 'Tas', '2025-06-05 17:22:48.496+00', '2025-06-05 17:22:48.496+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (8, '1154710246', 'Ассалам', '2025-06-05 19:14:19.667+00', '2025-06-05 19:14:19.667+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (10, '412504006', 'Artem', '2025-06-05 19:29:30.335+00', '2025-06-05 19:29:30.335+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (12, '178592527', 'Никитка классный типочек', '2025-06-12 16:28:33.599+00', '2025-06-12 16:28:33.599+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (13, '515190118', 'Алексей', '2025-06-13 09:54:18.982+00', '2025-06-13 09:54:18.982+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (14, '608149098', 'Руслан', '2025-06-13 10:02:28.858+00', '2025-06-13 10:02:28.858+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (15, '1399237266', 'хх', '2025-06-13 10:03:32.701+00', '2025-06-13 10:03:32.701+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (16, '1069365962', 'Q', '2025-06-13 10:15:25.253+00', '2025-06-13 10:15:25.253+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (17, '236665854', 'Maksim', '2025-06-13 10:44:40.387+00', '2025-06-13 10:44:40.387+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (20, '5646791476', 'ееее', '2025-06-13 11:21:07.467+00', '2025-06-13 11:21:07.467+00', 'UAH', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (24, '283578211', 'Mir', '2025-06-13 11:48:55.159+00', '2025-06-13 11:48:55.159+00', 'USD', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (25, '451833396', 'TroLolo', '2025-06-13 12:45:53.533+00', '2025-06-13 12:45:53.533+00', 'PLN', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (26, '875938981', '111', '2025-06-13 13:21:30.838+00', '2025-06-13 13:21:30.838+00', 'USD', NULL);
INSERT INTO public.users (id, telegram_id, username, created_at, updated_at, currency, mono_api_key) VALUES (23, '307821181', 'admin', '2025-06-13 11:41:17.105+00', '2025-06-21 18:34:47.678+00', 'USD', 'uO12j27X7gMPeIpaL1gnzjBfu4e7VjuQQf06ImMcWbuo');


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finadmin
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- PostgreSQL database dump complete
--

