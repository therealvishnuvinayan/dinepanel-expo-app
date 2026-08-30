# DinePanel Phase 1

DinePanel is an Expo mobile prototype backed by a FastAPI REST API and PostgreSQL. The app keeps its existing premium UI, while authentication, restaurants, bills, reward claims, transaction history, and balance persistence now come from the backend.

## Architecture

```text
Expo SDK 54 app
  -> JSON REST API + JWT bearer token
FastAPI
  -> SQLAlchemy 2 sessions + Decimal business rules
PostgreSQL / Neon
  -> users, restaurants, bills, reward_transactions, reward_claims
```

The reward ledger is the balance source of truth. `users` has no balance column. The API sums completed, signed `reward_transactions` amounts whenever it returns a balance.

## Backend setup

Python 3.11+ and a PostgreSQL database are required.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Set these values in `backend/.env`:

```dotenv
DATABASE_URL=postgresql+psycopg://dinepanel:password@localhost:5432/dinepanel
JWT_SECRET=replace-with-at-least-32-random-characters
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

Generate a suitable JWT secret with `openssl rand -hex 32`.

For Neon, use its connection host and require TLS. The SQLAlchemy URL has this form:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

Never put `DATABASE_URL` or `JWT_SECRET` in an `EXPO_PUBLIC_*` variable.

Apply and verify migrations:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
alembic current
alembic check
```

Seed or refresh the four demo restaurants (the command is idempotent):

```bash
python -m app.db.seed
```

Start the API so it is reachable by simulators and physical devices:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health and interactive API docs are available at `http://localhost:8000/health` and `http://localhost:8000/docs`.

## Expo setup

The validated versions remain Expo `54.0.2`, React Native `0.81.5`, React `19.1.0`, and Expo Router `6.0.24`.

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

For Android Emulator, use `http://10.0.2.2:8000`. For Expo Go on a physical device, the phone cannot use the Mac's `localhost`. Find the Mac's Wi-Fi address with `ipconfig getifaddr en0`, keep both devices on the same network, and use:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Restart Metro after changing `.env`. The backend must be bound to `0.0.0.0`, and the macOS firewall must permit incoming Python connections.

Mobile JWTs are persisted with Expo SecureStore. The web build uses browser local storage because SecureStore is a native Android/iOS facility.

## Development flow

1. Enter `+971501234567` in the app (the UAE prefix is already shown in the phone field).
2. Enter development OTP `123456`.
3. Open Scan and select **Use demo bill**.
4. The backend creates a real AED 500 Green Chilli bill and previews the stored 2% rate.
5. Claiming creates one completed AED 10 ledger entry and one reward claim in a single transaction.
6. Home and Rewards immediately show the returned AED 10 balance/activity.
7. Restarting the app restores the SecureStore token, calls `/me`, and reloads the persisted ledger balance.
8. Repeating the claim request for the same bill returns HTTP 409. A unique constraint on `reward_claims.bill_id` enforces this at the database level.

## API endpoints

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /me`
- `GET /restaurants`
- `GET /restaurants/{id}`
- `GET /rewards/balance`
- `GET /rewards/transactions`
- `GET /rewards/transactions/{id}`
- `POST /bills/demo`
- `POST /bills/{bill_id}/claim`
- `GET /health`

Except for health, auth, and restaurant discovery, user-specific endpoints require `Authorization: Bearer <token>`.

## Tests and validation

```bash
cd backend
source .venv/bin/activate
pytest -q
python -c "from app.main import app; print(app.title)"
alembic check

cd ..
npm run typecheck
npm run lint
npx expo install --check
EXPO_OFFLINE=1 npx expo export --platform web --clear
```

## Phase 1 boundaries

- OTP `123456` is development/test-only. Production intentionally returns a service error until a real SMS provider is added.
- Bill scanning is simulated; every **Use demo bill** action creates a new real database bill. OCR and POS integrations are not included.
- Rewards can be earned but not redeemed in this phase.
- Offers and presentation-only restaurant metadata remain local UI content; restaurant identity, description, address, active state, and reward percentage come from the API.
- Merchant/admin tools, payments, recommendations, campaigns, push notifications, and AI are intentionally out of scope.
