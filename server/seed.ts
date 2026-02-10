import { db } from "./db";
import { operators, trips } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(trips);
  await db.delete(operators);

  // Create operators
  const [buquebus] = await db.insert(operators).values({
    name: "Buquebus",
    type: "ferry",
  }).returning();

  const [coloniaExpress] = await db.insert(operators).values({
    name: "Colonia Express",
    type: "ferry",
  }).returning();

  const [cot] = await db.insert(operators).values({
    name: "COT",
    type: "bus",
  }).returning();

  const [turil] = await db.insert(operators).values({
    name: "Turil",
    type: "bus",
  }).returning();

  const [ega] = await db.insert(operators).values({
    name: "EGA",
    type: "bus",
  }).returning();

  const [copsa] = await db.insert(operators).values({
    name: "COPSA",
    type: "bus",
  }).returning();

  // Create ferry trips
  await db.insert(trips).values([
    {
      operatorId: buquebus.id,
      origin: "Buenos Aires",
      destination: "Colonia",
      departure: "07:30",
      arrival: "08:45",
      duration: "1h 15m",
      price: 240000, // $U 2400 in cents
      type: "ferry",
      features: ["wifi", "cafe", "shop"],
      availableSeats: 200,
    },
    {
      operatorId: buquebus.id,
      origin: "Buenos Aires",
      destination: "Montevideo",
      departure: "09:00",
      arrival: "12:00",
      duration: "3h 00m",
      price: 380000,
      type: "ferry",
      features: ["wifi", "cafe", "shop", "bed"],
      availableSeats: 150,
    },
    {
      operatorId: coloniaExpress.id,
      origin: "Buenos Aires",
      destination: "Colonia",
      departure: "12:30",
      arrival: "13:45",
      duration: "1h 15m",
      price: 210000,
      type: "ferry",
      features: ["pets", "wifi"],
      availableSeats: 180,
    },
    {
      operatorId: coloniaExpress.id,
      origin: "Buenos Aires",
      destination: "Colonia",
      departure: "17:00",
      arrival: "18:15",
      duration: "1h 15m",
      price: 225000,
      type: "ferry",
      features: ["wifi", "cafe"],
      availableSeats: 180,
    },
  ]);

  // Create bus trips
  await db.insert(trips).values([
    {
      operatorId: cot.id,
      origin: "Montevideo",
      destination: "Punta del Este",
      departure: "09:00",
      arrival: "11:00",
      duration: "2h 00m",
      price: 65000,
      type: "bus",
      features: ["ac", "wifi"],
      availableSeats: 45,
    },
    {
      operatorId: cot.id,
      origin: "Montevideo",
      destination: "Punta del Este",
      departure: "14:30",
      arrival: "16:30",
      duration: "2h 00m",
      price: 65000,
      type: "bus",
      features: ["ac", "wifi"],
      availableSeats: 45,
    },
    {
      operatorId: turil.id,
      origin: "Montevideo",
      destination: "Salto",
      departure: "14:00",
      arrival: "20:00",
      duration: "6h 00m",
      price: 110000,
      type: "bus",
      features: ["bed", "coffee", "wifi", "ac"],
      availableSeats: 38,
    },
    {
      operatorId: turil.id,
      origin: "Montevideo",
      destination: "Paysandú",
      departure: "15:30",
      arrival: "20:30",
      duration: "5h 00m",
      price: 95000,
      type: "bus",
      features: ["ac", "wifi", "coffee"],
      availableSeats: 42,
    },
    {
      operatorId: ega.id,
      origin: "Montevideo",
      destination: "Colonia",
      departure: "08:00",
      arrival: "10:30",
      duration: "2h 30m",
      price: 55000,
      type: "bus",
      features: ["ac", "wifi"],
      availableSeats: 48,
    },
    {
      operatorId: copsa.id,
      origin: "Colonia",
      destination: "Montevideo",
      departure: "16:00",
      arrival: "18:30",
      duration: "2h 30m",
      price: 58000,
      type: "bus",
      features: ["ac"],
      availableSeats: 50,
    },
    {
      operatorId: cot.id,
      origin: "Punta del Este",
      destination: "Montevideo",
      departure: "18:00",
      arrival: "20:00",
      duration: "2h 00m",
      price: 65000,
      type: "bus",
      features: ["ac", "wifi"],
      availableSeats: 45,
    },
  ]);

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
