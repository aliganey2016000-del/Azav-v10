# Role-Based Access Control (RBAC) & Multi-Tenant Model

## Platform User Roles

1. `SUPER_ADMIN`: Global platform administrator. Full permissions across all tenants.
2. `AZAAM_STAFF`: AZAAM Operational Staff. Global view of applications, placements, and approvals.
3. `UNIVERSITY_ADMIN`: Administrator for a specific University tenant. Can manage university students and applications.
4. `UNIVERSITY_STAFF`: Staff member for a specific University tenant. View access to university students.
5. `ORGANIZATION_ADMIN`: Healthcare Organization administrator. Manages placement capacity, departments, and supervisors.
6. `ORGANIZATION_STAFF`: Healthcare Organization staff. Manages placement schedules.
7. `CLINICAL_SUPERVISOR`: Doctor / Medical Supervisor. Reviews logbook entries, conducts mid-term and final evaluations.
8. `STUDENT`: University-affiliated medical student.
9. `INDEPENDENT_APPLICANT`: Medical practitioner or student applying independently without university affiliation.

## Strict Data Isolation Rules

- **University Scope**: University A users can NEVER view or modify University B students, applications, or documents.
- **Organization Scope**: Healthcare Organization A users can NEVER view or modify Organization B placements or supervisors.
- **Supervisor Scope**: Supervisors can ONLY access trainees assigned to their organization and clinical rotation.
- **Student Scope**: Students can ONLY access their own profile, applications, placements, attendance logs, logbooks, evaluations, and certificates.
- **IDOR Protection**: Middleware (`idor.ts`) inspects resource ownership and tenant boundaries server-side.
