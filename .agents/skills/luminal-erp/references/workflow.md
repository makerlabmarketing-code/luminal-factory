# Production Workflow

Workflow hierarchy

Project

↓

Phase

↓

Task

↓

Assigned Employee

---

## Task

Typical properties

- status
- deadline
- notes
- Google Drive link

---

## Workflow Storage

Current storage

system_settings

Group

PRODUCTION_WORKFLOW

---

## Rules

Do not redesign workflow storage without approval.

Prefer reusable workflow services.

Avoid embedding workflow manipulation directly inside React components.

Workflow operations should be encapsulated inside services.

---

## Future Improvements

Possible future enhancements

- workflow versioning
- activity history
- audit logs
- reusable workflow API