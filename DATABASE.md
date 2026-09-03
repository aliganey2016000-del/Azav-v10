# MongoDB & Mongoose Architecture Documentation

## Database Stack
- **Database Engine**: MongoDB 7.0
- **ODM**: Mongoose v8.9
- **Connection**: Dedicated Mongoose connection module with automatic retry handling, graceful shutdown listeners, and status check logging.

## Core Mongoose Collections & Indexes

### 1. User (`users`)
- Indexes: `email` (unique), `universityId`, `organizationId`, `studentId`
- Security: `passwordHash` stripped on `toJSON` transformation.

### 2. Student (`students`)
- Indexes: `userId` (unique), `universityId`, `applicantType`
- Schema Rule: Pre-save hook enforces `universityId = null` when `applicantType === 'INDEPENDENT'`.

### 3. Application (`applications`)
- Indexes: `studentId`, `universityId`, `status`
- Linked with `ApplicationStatusHistory` collection for full auditability.

### 4. Placement (`placements`)
- Compound Index: `{ organizationId: 1, startDate: 1, endDate: 1, status: 1 }`
- Capacity & Overlap Control enforced at database service layer.

### 5. ClinicalAttachment (`clinicalattachments`)
- Indexes: `placementId` (unique), `supervisorId`, `organizationId`, `status`

### 6. Attendance (`attendances`)
- Unique Compound Index: `{ attachmentId: 1, date: 1 }`
- Prevents recording duplicate attendance for the same attachment on the same date.

### 7. Evaluation (`evaluations`)
- Unique Compound Index: `{ attachmentId: 1, type: 1 }`
- Prevents duplicate `MID_TERM` or `FINAL` evaluations.

### 8. Certificate (`certificates`)
- Unique Indexes: `certificateNumber` (unique), `verificationCode` (unique)

### 9. Document (`documents`)
- Index: `studentId`, `applicationId`
- Prepared for S3-compatible object storage metadata.

### 10. AuditLog (`auditlogs`)
- Indexes: `actorUserId`, `action`, `entityType`
