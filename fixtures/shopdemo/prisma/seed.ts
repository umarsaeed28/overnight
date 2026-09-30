import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const products = [
  { id: "prod-tea-001", sku: "TEA-001", name: "Assam breakfast tea", priceCents: 1200, stock: 40 },
  { id: "prod-mug-002", sku: "MUG-002", name: "Stoneware mug", priceCents: 1800, stock: 25 },
  { id: "prod-pot-003", sku: "POT-003", name: "Cast iron teapot", priceCents: 6400, stock: 8 },
  { id: "prod-rug-004", sku: "RUG-004", name: "Wool floor rug", priceCents: 4900, stock: 12 },
  { id: "prod-tray-005", sku: "TRY-005", name: "Bamboo tea tray", priceCents: 2600, stock: 30 },
  { id: "prod-cosy-006", sku: "CSY-006", name: "Quilted tea cosy", priceCents: 1500, stock: 18 },
  { id: "prod-tin-007", sku: "TIN-007", name: "Airtight tea tin", priceCents: 900, stock: 60 },
  { id: "prod-scale-008", sku: "SCL-008", name: "Kitchen scale", priceCents: 3200, stock: 14 },
  { id: "prod-lamp-009", sku: "LMP-009", name: "Paper table lamp", priceCents: 5500, stock: 0 },
  { id: "prod-cloth-010", sku: "CLT-010", name: "Linen tea towel", priceCents: 1100, stock: 45 },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: { ...product, description: `${product.name}, from the ShopDemo sample catalogue.` },
      update: {},
    });
  }

  await prisma.user.upsert({
    where: { email: "shopper@example.com" },
    create: {
      email: "shopper@example.com",
      name: "Sam Shopper",
      passwordHash: hashPassword("correct-horse"),
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      name: "Ada Admin",
      isAdmin: true,
      passwordHash: hashPassword("correct-horse"),
    },
    update: {},
  });

  console.log(`seeded ${products.length} products and 2 users`);
}

main().finally(() => prisma.$disconnect());
