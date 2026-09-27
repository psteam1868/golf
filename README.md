# Golf Game PWA v11

Updates:
- Handicap Matrix uses a mobile scroll/select picker from -10 to +10.
- Negative = give strokes (red), 0 = square (black), positive = receive strokes (blue).
- Reverse handicap is automatic.
- Admin can edit any player's score; normal players can edit only their own score.
- Match handicap data is stored in the HANDICAPS sheet and returned with getMatch.
- 18-hole handicap is split between F9/B9 as evenly as possible; -10/+10 displays -5/+5 in each nine, with the per-hole strokes assigned by Index within that nine.
- Course data remains permanent.
- PWA service worker uses versioned cache and network-first navigation to reduce stale updates.

Backend: replace the current Google Apps Script with `Golf_Game_Apps_Script_v11.gs`, run `setupDatabase()`, then deploy a new Web App version.
