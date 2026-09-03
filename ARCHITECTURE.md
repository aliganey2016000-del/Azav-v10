# AZAAM International Medics Network — Architecture Specification

## Overview

The AZAAM Clinical Attachment & Training Management Platform implements a clean, layered, modular monorepo architecture.

```
STUDENT / INDEPENDENT APPLICANT
   │
   ▼
UNIVERSITY (Optional for Independent Applicants)
   │
   ▼
AZAAM INTERNATIONAL MEDICS NETWORK
   │
   ▼
HEALTHCARE ORGANIZATION
   │
   ▼
CLINICAL SUPERVISOR
   │
   ▼
CLINICAL ATTACHMENT ROTATION
   ├── ATTENDANCE LOGGING
   ├── DIGITAL LOGBOOK
   └── MID-TERM / FINAL EVALUATION
   │
   ▼
COMPLETION & DIGITAL CERTIFICATE ISSUANCE & VERIFICATION
```

## Architectural Layers

1. **Controller Layer**: Handles Express request parsing, validation, HTTP response codes, and standard JSON envelope responses.
2. **Service Layer**: Implements core business logic, capacity validation, rotation overlap protection, and state transitions.
3. **Data Access Layer**: Mongoose Models & Schemas interfacing with MongoDB.

## Crucial Business Rules

1. **Independent Applicants**:
   - `applicantType = 'INDEPENDENT'` enforced backend-side.
   - `universityId` MUST BE `null` for independent applicants.
2. **Healthcare Organization Capacity**:
   - Organization active placement limit enforced backend-side prior to placement creation.
3. **Supervisor Assignment**:
   - A supervisor assigned to a placement MUST belong to the same organization hosting that placement.
4. **Attendance & Evaluation Uniqueness**:
   - Attendance unique compound index: `attachmentId + date`.
   - Evaluation unique compound index: `attachmentId + type`.
5. **Certificate Issuance & Verification**:
   - Certificates issued ONLY after clinical attachment status is `COMPLETED`.
   - Public certificate verification does not expose sensitive user IDs, hashes, or audit logs.
