import { 
  operators, 
  trips, 
  bookings,
  userMiles,
  milesTransactions,
  type Operator,
  type InsertOperator, 
  type Trip, 
  type InsertTrip,
  type Booking,
  type InsertBooking,
  type UserMiles,
  type MilesTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, inArray, desc, or, sql } from "drizzle-orm";

export interface IStorage {
  // Operators
  getOperators(): Promise<Operator[]>;
  createOperator(operator: InsertOperator): Promise<Operator>;
  
  // Trips
  searchTrips(params: {
    origin?: string;
    destination?: string;
    types?: string[];
    dayOfWeek?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Trip[]>;
  getTripById(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  findConnections(origin: string, destination: string, date?: string): Promise<{ legs: Trip[], totalDuration: string, totalPrice: number }[]>;
  getPricesByDateRange(origin: string, destination: string, startDate: string, endDate: string): Promise<{ date: string, lowestPrice: number }[]>;
  
  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  cancelBooking(id: string): Promise<Booking>;
  updateTripSeats(tripId: string, seatsToBook: number): Promise<void>;
  
  // Miles
  getUserMiles(userId: string): Promise<UserMiles | null>;
  getMilesTransactions(userId: string): Promise<MilesTransaction[]>;
  addMiles(userId: string, miles: number, bookingId?: string, description?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Operators
  async getOperators(): Promise<Operator[]> {
    return await db.select().from(operators);
  }

  async createOperator(insertOperator: InsertOperator): Promise<Operator> {
    const [operator] = await db
      .insert(operators)
      .values(insertOperator)
      .returning();
    return operator;
  }

  // Trips
  async searchTrips(params: {
    origin?: string;
    destination?: string;
    types?: string[];
    dayOfWeek?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Trip[]> {
    let query = db.select().from(trips);
    
    const conditions = [];
    
    if (params.origin) {
      conditions.push(eq(trips.origin, params.origin));
    }
    
    if (params.destination) {
      conditions.push(eq(trips.destination, params.destination));
    }
    
    if (params.types && params.types.length > 0) {
      conditions.push(inArray(trips.type, params.types));
    }
    
    if (params.dayOfWeek) {
      conditions.push(sql`${params.dayOfWeek} = ANY(${trips.daysOfWeek})`);
    }
    
    if (params.minPrice !== undefined) {
      conditions.push(gte(trips.price, params.minPrice));
    }
    
    if (params.maxPrice !== undefined) {
      conditions.push(lte(trips.price, params.maxPrice));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async getTripById(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db
      .insert(trips)
      .values(insertTrip)
      .returning();
    return trip;
  }

  // Bookings
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async updateTripSeats(tripId: string, seatsToBook: number): Promise<void> {
    const trip = await this.getTripById(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    
    const newSeats = trip.availableSeats - seatsToBook;
    if (newSeats < 0) {
      throw new Error("Not enough seats available");
    }
    
    await db
      .update(trips)
      .set({ availableSeats: newSeats })
      .where(eq(trips.id, tripId));
  }

  // User Bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.bookingDate));
  }

  async cancelBooking(id: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  // Miles
  async getUserMiles(userId: string): Promise<UserMiles | null> {
    const [miles] = await db.select().from(userMiles).where(eq(userMiles.userId, userId));
    
    if (!miles) {
      // Create new miles record for user
      const [newMiles] = await db
        .insert(userMiles)
        .values({ userId, totalMiles: 0, tierLevel: "bronze", lifetimeMiles: 0 })
        .returning();
      return newMiles;
    }
    
    return miles;
  }

  async getMilesTransactions(userId: string): Promise<MilesTransaction[]> {
    return await db
      .select()
      .from(milesTransactions)
      .where(eq(milesTransactions.userId, userId))
      .orderBy(desc(milesTransactions.createdAt));
  }

  async addMiles(userId: string, miles: number, bookingId?: string, description?: string): Promise<void> {
    // Get or create user miles
    let userMilesRecord = await this.getUserMiles(userId);
    
    // Update total miles
    const newTotal = (userMilesRecord?.totalMiles || 0) + miles;
    const newLifetime = (userMilesRecord?.lifetimeMiles || 0) + (miles > 0 ? miles : 0);
    
    // Determine tier level based on lifetime miles
    let tierLevel = "bronze";
    if (newLifetime >= 100000) tierLevel = "platinum";
    else if (newLifetime >= 50000) tierLevel = "gold";
    else if (newLifetime >= 20000) tierLevel = "silver";
    
    await db
      .update(userMiles)
      .set({ 
        totalMiles: newTotal, 
        lifetimeMiles: newLifetime,
        tierLevel 
      })
      .where(eq(userMiles.userId, userId));
    
    // Record transaction
    await db.insert(milesTransactions).values({
      userId,
      bookingId: bookingId || null,
      miles,
      type: miles > 0 ? "earned" : "redeemed",
      description: description || (miles > 0 ? "Millas ganadas por reserva" : "Millas canjeadas"),
    });
  }

  // Connections - find trips with one transfer
  async findConnections(origin: string, destination: string, date?: string): Promise<{ legs: Trip[], totalDuration: string, totalPrice: number }[]> {
    // Get day of week from date if provided
    let dayOfWeek: string | undefined;
    if (date) {
      const d = new Date(date + 'T12:00:00');
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      dayOfWeek = days[d.getDay()];
    }
    
    // Get all trips from origin (filtered by day if provided)
    let fromOrigin = await db.select().from(trips).where(eq(trips.origin, origin));
    if (dayOfWeek) {
      fromOrigin = fromOrigin.filter(t => t.daysOfWeek.includes(dayOfWeek!));
    }
    
    // Get all trips to destination (filtered by day if provided)
    let toDestination = await db.select().from(trips).where(eq(trips.destination, destination));
    if (dayOfWeek) {
      toDestination = toDestination.filter(t => t.daysOfWeek.includes(dayOfWeek!));
    }
    
    const connections: { legs: Trip[], totalDuration: string, totalPrice: number }[] = [];
    
    // Find matching intermediate cities
    for (const leg1 of fromOrigin) {
      const leg2Options = toDestination.filter(t => 
        t.origin === leg1.destination && 
        t.departure > leg1.arrival // Second leg departs after first arrives
      );
      
      for (const leg2 of leg2Options) {
        const totalPrice = leg1.price + leg2.price;
        
        // Calculate total duration (simplified)
        const [h1, m1] = leg1.duration.replace('h ', ':').replace('m', '').split(':').map(Number);
        const [h2, m2] = leg2.duration.replace('h ', ':').replace('m', '').split(':').map(Number);
        const totalMinutes = (h1 * 60 + m1) + (h2 * 60 + m2);
        const totalDuration = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
        
        connections.push({
          legs: [leg1, leg2],
          totalDuration,
          totalPrice,
        });
      }
    }
    
    // Sort by price
    return connections.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 10);
  }

  // Get lowest prices for date range
  async getPricesByDateRange(origin: string, destination: string, startDate: string, endDate: string): Promise<{ date: string, lowestPrice: number }[]> {
    // Get trips for this route
    const routeTrips = await db
      .select()
      .from(trips)
      .where(and(
        eq(trips.origin, origin),
        eq(trips.destination, destination)
      ));
    
    if (routeTrips.length === 0) {
      return [];
    }
    
    // Find the lowest price for this route
    const lowestPrice = Math.min(...routeTrips.map(t => t.price));
    
    // Generate dates in range with prices
    const prices: { date: string, lowestPrice: number }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
      
      // Find trips available on this day
      const availableTrips = routeTrips.filter(t => 
        t.daysOfWeek.includes(dayOfWeek)
      );
      
      if (availableTrips.length > 0) {
        const dayLowestPrice = Math.min(...availableTrips.map(t => t.price));
        prices.push({
          date: d.toISOString().split('T')[0],
          lowestPrice: dayLowestPrice,
        });
      }
    }
    
    return prices;
  }
}

export const storage = new DatabaseStorage();
