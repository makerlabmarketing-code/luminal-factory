# Database

## Primary Tables

employees

Employee information.

attendance

GPS attendance records.

financial_ledger

Expenses and financial transactions.

facilities

Factories and branches.

system_settings

Application configuration.

system_metadata

Shared metadata.

---

## Workflow

Workflow is currently stored inside

system_settings

Group

PRODUCTION_WORKFLOW

Do not change storage structure unless requested.

---

## Best Practices

Prefer

employee_id

instead of

full_name

Avoid assuming schema that is not documented.

If schema information is missing, ask before implementation.

Database migrations must explain

- purpose
- impact
- rollback strategy