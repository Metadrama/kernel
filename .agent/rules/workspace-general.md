---
trigger: always_on
---

# Avoid using the timeline when working unless specified.

# Data Inspection & Debugging

When you need to inspect database content or model data:
- **ALWAYS** prefer using php artisan agent:dump {ModelName} --limit={N} over 	inker or raw SQL.
- This command uses laravel-toon to provide a token-optimized view of the data, allowing you to see more records within your context window.


