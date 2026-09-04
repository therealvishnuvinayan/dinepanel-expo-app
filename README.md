# DinePanel Customer

DinePanel Customer is the Expo mobile application for discovering participating restaurants, scanning secure reward claim codes, and viewing reward activity.

The shared FastAPI backend is maintained and deployed from the separate [dinepanel-api repository](https://github.com/therealvishnuvinayan/dinepanel-api). This repository does not own or run the API, database, Alembic migrations, or server secrets.

## Local setup

Requirements:

- Node.js and npm
- An Expo-supported iOS simulator, Android emulator, browser, or physical device

Install and start the Customer app:

```sh
npm install
cp .env.example .env
npm start
```

The Customer app uses one frontend-safe environment variable:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000
```

`EXPO_PUBLIC_API_URL` must point to a running DinePanel API deployment. The client reads it through `api/client.ts` and communicates with the API over HTTP; there is no filesystem dependency on the API repository.

For Android Emulator, use `http://10.0.2.2:8000` for an API running on the same computer. For a physical device, use an address reachable from that device, such as the computer's LAN address. Restart Metro after changing `.env`.

Never place database credentials, signing secrets, or private server tokens in an `EXPO_PUBLIC_*` variable. Expo public variables are bundled into the client application.

## Customer flow

The implemented reward flow is:

```text
Sign in → scan claim code → server preview → confirm bill → claim reward → reward history
```

Claim QR values are parsed by `utils/claimUrl.ts`. Bill values and reward calculations come from the shared API rather than from QR payload fields.

The tappable prototype OTP helper is compiled into development builds only. Customer
and retained legacy Merchant release builds never display or prefill the static
development credentials, and the production API does not accept the development OTP
provider.

## Validation

Run the existing Customer checks from the repository root:

```sh
npm run typecheck
npm run lint
npx expo install --check
npx expo export --platform web
```

The root package currently has no automated unit-test script.

## Legacy Merchant Vite app

The transitional `merchant/` Vite application intentionally remains in this repository until the separate Admin migration. It accesses the shared API over `VITE_API_URL`; it does not depend on backend source files.

```sh
cd merchant
npm install
cp .env.example .env
npm run lint
npm test
npm run build
```

The legacy merchant claim-URL test reuses the Customer app's canonical `utils/claimUrl.ts` parser. That frontend-only coupling is intentional for now and is unaffected by the backend extraction.
