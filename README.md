# Golf Game PWA v14

## Important fix
Handicap is saved as part of `createMatch` and the API returns `handicap_rows` as a verification count.

For N players, the HANDICAPS sheet receives N*(N-1) rows (both directions for every pair). Example for 4 players: 12 rows.

### HANDICAPS columns
match_id | row_player_id | col_player_id | strokes | created_at | updated_at

Negative = give strokes. Matrix input range is -14 to +14. Positive = receive strokes. Reverse direction is automatic.

### Required Apps Script steps
1. Replace the old Apps Script code with `Golf_Game_Apps_Script_v14.gs`.
2. Run `setupDatabase()` once.
3. Deploy a NEW Web App version using the same `/exec` URL deployment.
4. Use the v14 PWA.

The New Game flow now verifies that handicap rows were actually written. If not, it shows an explicit message telling you to run setupDatabase and redeploy the Apps Script.
