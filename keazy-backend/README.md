# Keazy Backend (Node + MongoDB)

## Quick start
1. Install MongoDB and Node.js LTS.
2. Copy `.env.example` to `.env` and set MONGO_URI.
3. `npm install`
4. `npm run seed`
5. `npm run dev`
6. Test with cURL commands in this README.

## What it does
- Receives text queries from Android.
- Extracts intent and entities (city, area, urgency).
- Matches providers and returns ranked results.
- Supports bookings, events, and provider management.

## Next steps
- Add OTP/JWT auth.
- Expand city/area dictionaries.
- Compute real distances with lat/lng (Haversine).
- Add dashboards (Metabase) for match rate and completion.

## to restart
- net start MongoDB in cmd(admin)
- in project folder -> cmd -> 
