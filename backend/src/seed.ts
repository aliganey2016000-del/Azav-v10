import bcrypt from 'bcryptjs';
import { connectDatabase, closeDatabase } from './config/database.js';
import { User } from './models/User.js';
import { University } from './models/University.js';
import { Organization } from './models/Organization.js';
import { Department } from './models/Department.js';
import { ClinicalSupervisor } from './models/ClinicalSupervisor.js';
import { Student } from './models/Student.js';
import { Programme, Specialty, Country, City } from './models/Programme.js';
import { UserRole, ApplicantType, OrganizationType } from './types/index.js';

function assertSeedIsSafe(): string {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    throw new Error('[Seed] Refusing to seed while NODE_ENV=production.');
  }

  if (process.env.ALLOW_DATABASE_SEED !== 'true') {
    throw new Error('[Seed] Set ALLOW_DATABASE_SEED=true explicitly for a non-production seed run.');
  }

  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('[Seed] SEED_PASSWORD must be explicitly provided and contain at least 12 characters.');
  }

  return seedPassword;
}

export async function seedDatabase() {
  const seedPassword = assertSeedIsSafe();
  console.log('[Seed] Initializing non-production Mongoose seed data...');
  const connected = await connectDatabase();
  if (!connected) {
    console.warn('[Seed] MongoDB not reachable. Skipping database seed persistence.');
    return;
  }

  const defaultPasswordHash = await bcrypt.hash(seedPassword, 10);

  // 1. Seed Countries & Cities
  let country = await Country.findOne({ code: 'US' });
  if (!country) {
    country = await Country.create({ name: 'United States', code: 'US', iso2: 'US', phoneCode: '+1' });
  }

  let city = await City.findOne({ name: 'Boston' });
  if (!city) {
    city = await City.create({ name: 'Boston', countryId: country._id, code: 'BOS' });
  }

  // 2. Seed Programmes & Specialties
  let programme = await Programme.findOne({ code: 'MBBS' });
  if (!programme) {
    programme = await Programme.create({ name: 'Bachelor of Medicine & Surgery', code: 'MBBS', durationMonths: 12 });
  }

  let specialty = await Specialty.findOne({ code: 'INT_MED' });
  if (!specialty) {
    specialty = await Specialty.create({ name: 'Internal Medicine', code: 'INT_MED', category: 'Clinical' });
  }

  // 3. Seed University & Organization
  let university = await University.findOne({ code: 'HARVARD_MED' });
  if (!university) {
    university = await University.create({
      name: 'Harvard Medical School',
      code: 'HARVARD_MED',
      country: country.name,
      city: city.name,
      address: '25 Shattuck St, Boston, MA',
      email: 'admissions@hms.harvard.edu',
      phone: '+1 617-432-1000',
      website: 'https://hms.harvard.edu',
      capacity: 100,
    });
  }

  let organization = await Organization.findOne({ contactEmail: 'clinical@massgeneral.org' });
  if (!organization) {
    organization = await Organization.create({
      name: 'Massachusetts General Hospital',
      type: OrganizationType.HOSPITAL,
      registrationNumber: 'MGH-99201',
      country: country.name,
      city: city.name,
      address: '55 Fruit St, Boston, MA',
      contactEmail: 'clinical@massgeneral.org',
      contactPhone: '+1 617-726-2000',
      capacity: 20,
      description: 'Primary teaching hospital of Harvard Medical School.',
    });
  }

  let department = await Department.findOne({ organizationId: organization._id, code: 'INT_MED' });
  if (!department) {
    department = await Department.create({
      organizationId: organization._id,
      name: 'Internal Medicine Department',
      code: 'INT_MED',
      description: 'General inpatient and outpatient medicine unit',
    });
  }

  // 4. Seed Users for each Role
  const usersToSeed = [
    {
      firstName: 'Global',
      lastName: 'SuperAdmin',
      email: 'admin@azaammedics.org',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      firstName: 'Azaam',
      lastName: 'StaffOfficer',
      email: 'staff@azaammedics.org',
      roles: [UserRole.AZAAM_STAFF],
    },
    {
      firstName: 'Harvard',
      lastName: 'UniAdmin',
      email: 'admin@hms.harvard.edu',
      roles: [UserRole.UNIVERSITY_ADMIN],
      universityId: university._id,
    },
    {
      firstName: 'MassGen',
      lastName: 'OrgAdmin',
      email: 'admin@massgeneral.org',
      roles: [UserRole.ORGANIZATION_ADMIN],
      organizationId: organization._id,
    },
    {
      firstName: 'Dr. Sarah',
      lastName: 'Jenkins',
      email: 'sjenkins@massgeneral.org',
      roles: [UserRole.CLINICAL_SUPERVISOR],
      organizationId: organization._id,
    },
    {
      firstName: 'John',
      lastName: 'UniStudent',
      email: 'student.harvard@azaammedics.org',
      roles: [UserRole.STUDENT],
      universityId: university._id,
    },
    {
      firstName: 'Amina',
      lastName: 'IndependentDoctor',
      email: 'independent.student@azaammedics.org',
      roles: [UserRole.INDEPENDENT_APPLICANT],
      universityId: null,
    },
  ];

  for (const userData of usersToSeed) {
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = await User.create({
        ...userData,
        passwordHash: defaultPasswordHash,
        status: 'ACTIVE',
      });
      console.log(`[Seed] Created User: ${user.email} (${user.roles.join(', ')})`);
    } else {
      // Explicit seed runs reset only these non-production seeded accounts to
      // the operator-provided password; the password itself is never logged.
      user.passwordHash = defaultPasswordHash;
      await user.save();
    }

    // Create supervisor record if role is CLINICAL_SUPERVISOR
    if (userData.roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
      let supervisor = await ClinicalSupervisor.findOne({ userId: user._id });
      if (!supervisor) {
        supervisor = await ClinicalSupervisor.create({
          userId: user._id,
          organizationId: organization._id,
          departmentId: department._id,
          specialtyId: specialty._id,
          licenseNumber: 'MD-774920',
          qualification: 'MD, FACP Internal Medicine',
          yearsOfExperience: 12,
          verified: true,
        });
      }
    }

    // Create student profiles
    if (userData.roles.includes(UserRole.STUDENT)) {
      let student = await Student.findOne({ userId: user._id });
      if (!student) {
        student = await Student.create({
          userId: user._id,
          universityId: university._id,
          programmeId: programme._id,
          specialtyId: specialty._id,
          studentNumber: 'HARV-2026-901',
          applicantType: ApplicantType.UNIVERSITY,
          status: 'ACTIVE',
        });
        user.studentId = student._id as any;
        await user.save();
      }
    }

    if (userData.roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
      let student = await Student.findOne({ userId: user._id });
      if (!student) {
        student = await Student.create({
          userId: user._id,
          universityId: null,
          programmeId: programme._id,
          specialtyId: specialty._id,
          studentNumber: 'IND-2026-104',
          applicantType: ApplicantType.INDEPENDENT,
          status: 'ACTIVE',
        });
        user.studentId = student._id as any;
        await user.save();
      }
    }
  }

  console.log('[Seed] Non-production seed completed successfully.');
  console.log('[Seed] Seed account password came from SEED_PASSWORD and was not printed.');
}

if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => closeDatabase())
    .catch(async (error) => {
      console.error(error?.message || error);
      await closeDatabase();
      process.exitCode = 1;
    });
}
