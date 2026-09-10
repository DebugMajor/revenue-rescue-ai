CSV final UI fix

Replace:
- frontend/src/pages/Dashboard.jsx
- frontend/src/components/transactions/TransactionForm.jsx

Then append dashboard-csv-fix.css to the END of your existing frontend/src/styles/dashboard.css.
Do NOT add any @import for this file or csv-batch-spacing.css. Keep src/index.css unchanged.

Result: OR gets a proper divider, file/process spacing is cleaner, and after CSV processing the result pane shows only the CSV batch result instead of Run a scenario / Risk / AI / Policy / Recovery / Outcome.
