# National Acts Mobile

Expo + React Native + TypeScript for Android and iOS. Online ticket check-in is the first feature.

## Start

1. Run `npm install`.
2. Copy `.env.example` to `.env`. Enter your API base URL and the user API key used by national-acts-users. The base URL may include an API prefix, but no endpoint path.
3. Run `npm start`. Open the project in Expo Go on a physical Android or iOS phone.
4. Sign in, allow camera access, and scan a ticket inside the app.

Your phone must reach the API. `localhost` refers to the phone itself, so use a reachable HTTPS API host. The terminal development QR opens the app; ticket QR codes are scanned after login. Native Android/iOS are the targets; web secure storage is not supported.

## Understand the pieces

- [App.tsx](./App.tsx): header/logo, login gate, and function menu. [Route layout](./src/app/_layout.tsx) wraps Expo Router in the authentication provider.
- [AuthProvider](./src/auth/AuthProvider.tsx): secure session persistence and logout. Passwords are never saved. The 24-hour local session matches the existing users app cookie lifetime. Server JWT expiry still governs requests; check-in HTTP 401 displays the authorization error without automatically signing out, since either the API key or token may have been rejected.
- [auth.service.ts](./src/auth/auth.service.ts): existing login contract: POST `/user/login`, JSON `{ username, password }`, `x-api-key`, direct User response containing `isAuthenticated` and `token`. Logout clears the local session, matching the existing users app. Password-reset-required accounts must reset on the website.
- [client.ts](./src/api/client.ts): URL configuration, Bearer token, timeout and HTTP errors.
- [ticket.ts](./src/features/checkin/ticket.ts): QR parsing and result interpretation.
- [CheckInScreen](./src/features/checkin/CheckInScreen.tsx): permissions, camera, scan lock and results.
- [registry.ts](./src/features/registry.ts): add another component and registry entry here. The hamburger menu appears automatically with two or more features.

Roles/permissions are left for later. The API must enforce access to protected actions.

## Ticket contract

POST `/mobile/ticket/checkin/{encodedTicketId}` with Bearer authorization and no body. Accepts a direct object or `{ "ticketCheckIn": object }`:

```json
{ "ticketId": "abc-123", "checkInStatus": 1, "errorMessage": "" }
```

1 = checked in (green); 2 = already checked in (amber); other integers show errorMessage. Invalid responses fail visibly. Scanning locks immediately until **Scan next ticket**. Requests are not retried automatically: a timed-out request may already have checked in the ticket.

Supported QR payloads are raw IDs (`abc-123`), JSON (`{"ticketId":"abc-123"}`), or URLs with a `ticketId` query parameter (`https://example.com/?ticketId=abc-123`). IDs permit 1–256 letters, digits, hyphens and underscores. QR URLs are parsed locally and never fetched. Confirm the actual ticket QR format; customize getTicketId if needed.

The specified mobile endpoint was absent from the sibling API checkout during implementation. It must be deployed with the contract above before end-to-end use.

## Configuration and distribution

EXPO_PUBLIC values are readable in the built app. The existing API key is preserved for compatibility and must not grant privileged access without a staff JWT. Never put server secrets here.

Camera permissions and secure storage plugins are in [app.json](./app.json). Before distribution, choose your own ios.bundleIdentifier and android.package, then run `npx eas-cli@latest build:configure`. EAS can build iOS from Windows; store distribution requires Apple/Google accounts. Native plugin changes require a new native build.

## Verification

Run `npm run typecheck`, `npm test`, and `npx expo-doctor`. Before venue use, verify both physical platforms: login failure/success, relaunch, logout, denied permissions, all check-in statuses, invalid QR, repeated camera detections, expired token and network failure. Live API and camera testing need credentials and devices. Offline check-in is not implemented.

References: [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).

Dependency audit: npm reports five moderate advisories in Expo CLI/fingerprint glob dependencies. The suggested automatic fix downgrades Expo across major versions, so it has not been applied.
