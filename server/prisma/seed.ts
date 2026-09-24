import bcrypt from 'bcryptjs';
import { db } from '../src/services/db.js';

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Demo user 1
  let user1 = await db.users.findUnique({ where: { email: 'demo1@example.com' } });
  if (!user1) {
    user1 = await db.users.create({
      data: {
        id: 'usr-demo-1',
        name: 'Sai Krishna',
        email: 'demo1@example.com',
        passwordHash,
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sai',
      },
    });
  }

  // Demo user 2
  let user2 = await db.users.findUnique({ where: { email: 'demo2@example.com' } });
  if (!user2) {
    user2 = await db.users.create({
      data: {
        id: 'usr-demo-2',
        name: 'Rahul Sharma',
        email: 'demo2@example.com',
        passwordHash,
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul',
      },
    });
  }

  console.log('✓ Demo users seeded:');
  console.log('  - demo1@example.com / password123 (Sai Krishna)');
  console.log('  - demo2@example.com / password123 (Rahul Sharma)');
  console.log('🎉 Seeding complete!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
