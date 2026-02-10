import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Operators table (Buquebus, COT, Turil, etc.)
export const operators = pgTable("operators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'ferry' or 'bus'
  logo: text("logo"),
});

// Trips table (schedules and routes)
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: varchar("operator_id").notNull().references(() => operators.id),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departure: text("departure").notNull(), // time as "HH:MM"
  arrival: text("arrival").notNull(),
  duration: text("duration").notNull(),
  price: integer("price").notNull(), // price in UYU cents
  type: text("type").notNull(), // 'ferry' or 'bus'
  features: text("features").array().notNull().default(sql`ARRAY[]::text[]`), // ['wifi', 'ac', etc.]
  availableSeats: integer("available_seats").notNull().default(50),
  daysOfWeek: text("days_of_week").array().notNull().default(sql`ARRAY['MON','TUE','WED','THU','FRI','SAT','SUN']::text[]`),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id),
  userId: varchar("user_id"), // null for guest bookings
  passengerName: text("passenger_name").notNull(),
  passengerEmail: text("passenger_email").notNull(),
  passengerPhone: text("passenger_phone"),
  passengers: integer("passengers").notNull().default(1),
  totalPrice: integer("total_price").notNull(),
  bookingDate: timestamp("booking_date").notNull().defaultNow(),
  travelDate: timestamp("travel_date").notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed', 'cancelled', 'completed'
  milesEarned: integer("miles_earned").default(0),
});

// User miles/loyalty program
export const userMiles = pgTable("user_miles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  totalMiles: integer("total_miles").notNull().default(0),
  tierLevel: text("tier_level").notNull().default("bronze"), // 'bronze', 'silver', 'gold', 'platinum'
  lifetimeMiles: integer("lifetime_miles").notNull().default(0),
});

// Miles transactions history
export const milesTransactions = pgTable("miles_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  miles: integer("miles").notNull(),
  type: text("type").notNull(), // 'earned', 'redeemed', 'bonus', 'expired'
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const operatorsRelations = relations(operators, ({ many }) => ({
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  operator: one(operators, {
    fields: [trips.operatorId],
    references: [operators.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
}));

export const userMilesRelations = relations(userMiles, ({ many }) => ({
  transactions: many(milesTransactions),
}));

export const milesTransactionsRelations = relations(milesTransactions, ({ one }) => ({
  userMiles: one(userMiles, {
    fields: [milesTransactions.userId],
    references: [userMiles.userId],
  }),
  booking: one(bookings, {
    fields: [milesTransactions.bookingId],
    references: [bookings.id],
  }),
}));

// Insert schemas
export const insertOperatorSchema = createInsertSchema(operators).omit({ id: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  bookingDate: true,
  milesEarned: true,
});
export const insertUserMilesSchema = createInsertSchema(userMiles).omit({ id: true });
export const insertMilesTransactionSchema = createInsertSchema(milesTransactions).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type Operator = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type UserMiles = typeof userMiles.$inferSelect;
export type InsertUserMiles = z.infer<typeof insertUserMilesSchema>;

export type MilesTransaction = typeof milesTransactions.$inferSelect;
export type InsertMilesTransaction = z.infer<typeof insertMilesTransactionSchema>;
