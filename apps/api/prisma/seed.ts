import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VraisAvis database...');

  // Créer le super admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@vraisavis.fr' },
    update: {},
    create: {
      email: 'admin@foodback.fr',
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin créé:', superAdmin.email);

  // Créer les plans par défaut
  const starterPlan = await prisma.plan.upsert({
    where: { id: 'plan_starter' },
    update: {},
    create: {
      id: 'plan_starter',
      name: 'Starter',
      priceMonthly: 2900, // 29€
      priceYearly: 29000, // 290€ (2 mois offerts)
      maxRestaurants: 1,
      maxFeedbacksPerMonth: 500,
      features: {
        feedbacks: true,
        slotMachine: true,
        basicStats: true,
        exportCsv: false,
        customBranding: false,
      },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'Pro',
      priceMonthly: 4900, // 49€
      priceYearly: 49000, // 490€
      maxRestaurants: 3,
      maxFeedbacksPerMonth: 2000,
      features: {
        feedbacks: true,
        slotMachine: true,
        basicStats: true,
        advancedStats: true,
        exportCsv: true,
        customBranding: true,
      },
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { id: 'plan_premium' },
    update: {},
    create: {
      id: 'plan_premium',
      name: 'Premium',
      priceMonthly: 9900, // 99€
      priceYearly: 99000, // 990€
      maxRestaurants: 10,
      maxFeedbacksPerMonth: null, // Illimité
      features: {
        feedbacks: true,
        slotMachine: true,
        basicStats: true,
        advancedStats: true,
        exportCsv: true,
        customBranding: true,
        prioritySupport: true,
        apiAccess: true,
      },
    },
  });

  console.log('✅ Plans créés:', starterPlan.name, proPlan.name, premiumPlan.name);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
