# Golf Game PWA v17

Free mobile-first golf scoring PWA using Google Apps Script + Google Sheets.

## v17 changes
- Match status now separates Game / Tommy / Buy states after a game is decided.
- Score circles represent score vs PAR only: PAR = one circle; below PAR = double circle.
- Stroke background is only a handicap indicator, not a win/loss indicator.
- Opponent rows show 9-hole `Match` handicap (18H handicap ÷ 2).
- Front 9 / Back 9 Result calculates Bonus as the player's bonus minus the opponent's bonus.
- If a game is decided on the final hole, Tommy and Buy are 0.
- Admin can enter all players' score and UP for one hole in a single save.
- Match loading uses parallel API requests and score/course lookup maps to reduce lag.
- Handicap matrix remains integer -14 to +14; F9/B9 allocation supports 0.5 strokes.

## Deployment
1. Upload the PWA files to GitHub Pages.
2. Deploy the included `Golf_Game_Apps_Script_v13.gs` as the Apps Script Web App.
3. Keep the Web App URL in `app.js` unchanged unless your deployment URL changes.
