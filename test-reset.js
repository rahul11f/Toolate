const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = 'toolatekahalgaon@gmail.com'; // Try a test email or maybe check if there are users
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }
  const testUser = users[0];
  console.log('Testing with user:', testUser.email);
  
  // Create token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600 * 1000);
  
  await prisma.passwordResetToken.deleteMany({ where: { email: testUser.email } });
  
  await prisma.passwordResetToken.create({
    data: {
      email: testUser.email,
      token,
      expires,
    },
  });
  console.log(`Token created: ${token}`);
  
  // Fetch token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  console.log('Fetched token:', resetToken ? 'OK' : 'FAIL');
}

main().catch(console.error).finally(() => prisma.$disconnect());
