# DinePanel Phase 2

DinePanel is a customer rewards app with a companion restaurant workspace. Restaurants keep their existing POS, enter the POS bill number and total in DinePanel Merchant, and show the customer a secure one-time QR. The customer scans it in the existing Expo app and the reward is recorded in the original Phase 1 ledger.

## Architecture

```text
Existing restaurant POS
  -> bill number + amount
Merchant React/Vite app
  -> REST/JWT
FastAPI
  -> SQLAlchemy 2 transactions and server-side Decimal reward rules
PostgreSQL / Neon
  -> opaque claim-token hashes + existing reward ledger
Expo SDK 54 customer app
  -> camera QR scan, preview, confirmation, claim
```

The ledger remains the balance source of truth. There is no `users.balance` column and merchant claims do not create a second accounting path.

## Exact shipped versions

- Expo `54.0.2`
- React Native `0.81.5`
- React `19.1.0`
- Expo Router `6.0.24`
- TypeScript `5.9.3`
- expo-camera `17.0.10` (selected by Expo’s SDK 54 installer)

## 1. PostgreSQL and backend

Python 3.11+ and PostgreSQL are required. One local PostgreSQL option is:

```bash
docker run --name dinepanel-postgres \
  -e POSTGRES_USER=dinepanel \
  -e POSTGRES_PASSWORD=dinepanel \
  -e POSTGRES_DB=dinepanel \
  -p 5432:5432 \
  -d postgres:17
```

Install and configure the API:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Set `backend/.env`:

```dotenv
DATABASE_URL=postgresql+psycopg://dinepanel:dinepanel@localhost:5432/dinepanel
JWT_SECRET=replace-with-at-least-32-random-characters
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:5173
CLAIM_BASE_URL=dinepanel://claim
CLAIM_TOKEN_EXPIRE_MINUTES=10
```

Generate a suitable secret with `openssl rand -hex 32`. For Neon, use its SQLAlchemy URL and `?sslmode=require`. Never expose `DATABASE_URL` or `JWT_SECRET` through an `EXPO_PUBLIC_*` or `VITE_*` variable.

Apply the additive migrations, verify drift, seed, and run:

```bash
alembic upgrade head
alembic current
alembic check
python -m app.db.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The health endpoint and API docs are at `http://localhost:8000/health` and `http://localhost:8000/docs`.

## 2. Merchant workspace

The merchant app is isolated in `merchant/` and does not alter the Expo app’s React dependency tree.

```bash
cd merchant
npm install
cp .env.example .env
npm run dev
```

Its development URL is `http://localhost:5173` and its environment is:

```dotenv
VITE_API_URL=http://localhost:8000
```

Use `+971500000001`, OTP `123456`. The seeded user is Green Chilli Manager with an active `MANAGER` membership at Green Chilli. The seed is idempotent.

The responsive workspace includes:

- phone/OTP merchant access enforcement;
- compact daily metrics and recent activity;
- bill creation with server-calculated reward values;
- a real QR, ten-minute countdown, refresh, and 2-second detail polling;
- newest-first history with status filters;
- bill detail with amount, reward, status, creation, and claimed time.

## 3. Customer Expo app

```bash
cd ..
npm install
cp .env.example .env
npm start
```

For iOS Simulator and web on the same Mac:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000
```

For Android Emulator use `http://10.0.2.2:8000`. For Expo Go on a physical device, find the Mac’s LAN address with `ipconfig getifaddr en0`, keep both devices on the same Wi-Fi, bind FastAPI and Vite to `0.0.0.0`, and configure both apps with that address:

```dotenv
# root .env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000

# merchant/.env
VITE_API_URL=http://192.168.x.x:8000
```

Restart Metro/Vite after environment changes. The OS firewall must allow the selected ports.

Customer development login is `+971501234567`, OTP `123456`. The real flow is Scan → server preview → existing Bill Confirmation → server claim → existing Reward Success. The demo bill remains visible only as a secondary development action.

### Claim QR format

The QR contains only the backend-issued claim URL, normally:

```text
dinepanel://claim/<opaque-token>
```

The canonical parser also accepts `https://HOST/claim/<token>` and `http://HOST/claim/<token>` for hosted, localhost, and LAN development. It rejects other paths, schemes, query strings, fragments, and non-token payloads. No bill amount, reward, percentage, restaurant ID, or customer ID is trusted from the QR.

The Expo Router route `claim/[token]` supports the DinePanel scheme and waits for authenticated session restoration before previewing. In-app scanning remains the required Phase 2 path.

## Merchant API

- `GET /merchant/me`
- `GET /merchant/restaurants`
- `GET /merchant/restaurants/{restaurant_id}/dashboard`
- `POST /merchant/restaurants/{restaurant_id}/bills`
- `GET /merchant/restaurants/{restaurant_id}/bills`
- `GET /merchant/bills/{bill_id}`
- `POST /merchant/bills/{bill_id}/refresh-claim-token`

Every restaurant-scoped route verifies an active `restaurant_staff` membership. A staff user cannot change a URL ID to access another restaurant.

## Customer claim API

- `POST /claims/preview` validates but does not mutate rewards.
- `POST /claims/claim` locks token/bill rows, recalculates the reward on the server, writes the existing transaction and claim rows, consumes the token, marks the bill claimed, and commits atomically.

Tokens use 32 random bytes (at least 256 bits), are returned in plaintext only at issue/refresh time, and are stored as SHA-256 hashes. They expire after ten minutes, are single-use, and refresh invalidates prior active tokens. Existing unique constraints on bill ledger/claim relationships provide a second database-level defense against concurrent double credit.

## Validation commands

```bash
# Backend
cd backend
source .venv/bin/activate
pytest -q
python -m compileall -q app
alembic upgrade head
alembic current
alembic check

# Merchant
cd ../merchant
npm run lint
npm test
npm run build

# Expo
cd ..
npm run typecheck
npm run lint
npx expo install --check
npx expo export --platform web
npm run web
```

## Phase 2 boundaries

- OTP `123456` is development/test-only; no production SMS provider is configured.
- There are no POS integrations, OCR, AI, payments, redemption, merchant payouts, push notifications, WebSockets, or admin portal.
- QR status uses lightweight bill-detail polling rather than WebSockets.
- Expiry status is synchronized when merchant bill data is read; no background expiry worker is included.
- Rewards are earn-only in this phase and remain AED/Dubai-focused for the prototype.
