import User from '../models/User.js';

// Deliberately reads credentials from the environment, never accepts them
// as literal strings in this file — an admin password has no business
// sitting in source that could end up committed to a repo. Opt-in only: if
// ADMIN_EMAIL/ADMIN_PASSWORD aren't set, this does nothing rather than
// erroring, so a fresh clone without them configured still seeds cleanly.
export const seedAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('\u2139\ufe0f  ADMIN_EMAIL/ADMIN_PASSWORD not set \u2014 skipping admin account seed');
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`\u2705 Promoted existing account (${email}) to admin`);
    } else {
      console.log(`\u2705 Admin account already exists (${email})`);
    }
    return;
  }

  // Password hashing happens in User's own pre-save hook — never hashed
  // here, so there is exactly one place in the codebase that knows how
  // passwords are hashed.
  await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email,
    password,
    role: 'admin',
  });
  console.log(`\u2705 Created admin account (${email})`);
};
