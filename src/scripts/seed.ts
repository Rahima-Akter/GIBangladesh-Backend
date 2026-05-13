import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

async function seedAdmins() {
  console.log("Seeding admin users...\n");

  // Super Admin
  try {
    await auth.api.signUpEmail({
      body: {
        name: "Super Admin",
        email: "gib@superadmin.com",
        password: "password1234",
      },
    });

    // Manually update role since Better Auth doesn't handle roles
    await prisma.user.update({
      where: { email: "gib@superadmin.com" },
      data: {
        role: "SUPER_ADMIN",
        bio: "Super Administrator of GIBangladesh",
        address: "Bangladesh",
        emailVerified: true,
      },
    });

    console.log("Super Admin created: superadmin@gi-bangladesh.com");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Super Admin already exists, skipping...");
    } else {
      console.error("Failed to create Super Admin:", error.message);
    }
  }

  // Admin
  try {
    await auth.api.signUpEmail({
      body: {
        name: "Admin User",
        email: "gib@admin.com",
        password: "password1234",
      },
    });

    await prisma.user.update({
      where: { email: "gib@admin.com" },
      data: {
        role: "ADMIN",
        bio: "Administrator of GIBangladesh",
        address: "Bangladesh",
        emailVerified: true,
      },
    });

    console.log("Admin created: admin@gi-bangladesh.com");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("Admin already exists, skipping...");
    } else {
      console.error("Failed to create Admin:", error.message);
    }
  }
}

// seedAdmins()
//   .catch((error) => {
//     console.error("Seeding failed:", error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
