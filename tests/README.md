# Playwright test suite

## Setup
1. Create or update the app credentials in your shell:
   - PLAYWRIGHT_EMAIL
   - PLAYWRIGHT_PASSWORD
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
2. Install dependencies with `npm install`.
3. Run the suite with `npx playwright test`.

## What is covered
- Makhdoum CRUD flows through the add/edit/details screens.
- Assistance history + bridal prep + medical aid flows.
- Inventory saving and update behavior.

## Notes
- The suite uses the real Supabase environment configured for the workspace.
- Tests are intentionally written against the visible Arabic UI labels to catch regressions in the user experience.
