# CAPITAL Paradox — Public Demo

This is a **public, shareable demo** version of the project. It removes all sensitive
Firebase configuration and replaces the backend with a **local mock database** so the
UI still works without any setup.

## How to Run (No Backend)

1. Open `index.html` in a browser.
2. Navigate through pages:
   - `rounds.html` (team access flow)
   - `auction.html` (live auction demo)
   - `admin.html` / `admin-rounds.html` (admin controls)

## Demo Behavior

- Data is stored in `localStorage` under the key `capital_paradox_demo_db`.
- Refreshing the page keeps state.
- To reset demo data, open DevTools and run:

```js
localStorage.removeItem("capital_paradox_demo_db");
location.reload();
```

## Want to Use Real Firebase?

1. Replace `firebase-config.js` with your real Firebase config.
2. Remove or set `DEMO_MODE = false`.
3. Ensure your Firebase rules are secure.

## Notes

- This demo is safe to share publicly (LinkedIn/GitHub).
- Admin auth is bypassed in demo mode.
