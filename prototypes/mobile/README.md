# ILSP mobile proof

This is a runnable Expo SDK 57 prototype for iOS, Android and web. It uses the shared version-one contract and only read-only local endpoints.

Implemented:

- published feed from `/api/v1/articles`;
- typed article detail from `/api/v1/articles/[slug]`;
- score-event fixture from `/api/v1/scores`;
- native Expo Router navigation between feed and article screens;
- last-successful-response caching for read-only offline fallback;
- English/Hebrew interface switching with LTR/RTL direction changes;
- complete editorial image frames through `resizeMode="contain"`;
- no write route, credential, analytics SDK or external account action.

Run the local Next.js site first. Then, from this directory:

1. `npm install`
2. set `EXPO_PUBLIC_ILSP_API_BASE_URL` to the local ILSP address (for example `http://192.168.1.20:3000` from a phone on the same network)
3. run `npm start`, `npm run ios`, `npm run android` or `npm run web`

The score response is intentionally a contract fixture, not a live-data claim. Distribution, store signing and developer-account work remain outside this local proof.
