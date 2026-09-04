import bcrypt from 'bcryptjs';
import { connectDatabase, closeDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { UserRole } from '../types/index.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
}

if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
}

async function main() {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  }

  await connectDatabase();

  const passwordHash = await bcrypt.hash(password, 12);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.passwordHash = passwordHash;
    existingUser.roles = [UserRole.SUPER_ADMIN];
    existingUser.status = 'ACTIVE';
    await existingUser.save();
    console.log(`Updated Super Admin: ${email}`);
  } else {
    await User.create({
      firstName: 'AIMN',
      lastName: 'Super Admin',
      email,
      passwordHash,
      roles: [UserRole.SUPER_ADMIN],
      status: 'ACTIVE',
      universityId: null,
      organizationId: null,
      studentId: null,
    });
    console.log(`Created Super Admin: ${email}`);
  }

  await closeDatabase();
}

main().catch(async (error) => {
  console.error(error);
  await closeDatabase();
  process.exitCode = 1;
});
