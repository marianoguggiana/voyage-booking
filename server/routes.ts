import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication BEFORE other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  // GET /api/trips - Search trips with filters
  app.get("/api/trips", async (req, res) => {
    try {
      const { origin, destination, types, date, minPrice, maxPrice } = req.query;
      
      const typesArray = types 
        ? (typeof types === 'string' ? types.split(',') : types as string[])
        : undefined;
      
      // Convert date string to day of week abbreviation for filtering (matches DB format)
      let dayOfWeek: string | undefined;
      if (date && typeof date === 'string') {
        const d = new Date(date + 'T12:00:00');
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        dayOfWeek = days[d.getDay()];
      }
      
      const trips = await storage.searchTrips({
        origin: origin as string | undefined,
        destination: destination as string | undefined,
        types: typesArray,
        dayOfWeek,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      });
      
      res.json(trips);
    } catch (error) {
      console.error("Error searching trips:", error);
      res.status(500).json({ error: "Failed to search trips" });
    }
  });

  // GET /api/trips/:id - Get trip by ID
  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTripById(req.params.id);
      
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error getting trip:", error);
      res.status(500).json({ error: "Failed to get trip" });
    }
  });

  // GET /api/operators - Get all operators
  app.get("/api/operators", async (req, res) => {
    try {
      const operators = await storage.getOperators();
      res.json(operators);
    } catch (error) {
      console.error("Error getting operators:", error);
      res.status(500).json({ error: "Failed to get operators" });
    }
  });

  // POST /api/bookings - Create a booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const passengers = validatedData.passengers || 1;
      
      // Check if trip exists and has enough seats
      const trip = await storage.getTripById(validatedData.tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      if (trip.availableSeats < passengers) {
        return res.status(400).json({ 
          error: "Not enough seats available",
          availableSeats: trip.availableSeats 
        });
      }
      
      // Create booking with passengers set
      const booking = await storage.createBooking({
        ...validatedData,
        passengers,
      });
      
      // Update available seats
      await storage.updateTripSeats(validatedData.tripId, passengers);
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create booking" });
      }
    }
  });

  // GET /api/bookings/:id - Get booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error getting booking:", error);
      res.status(500).json({ error: "Failed to get booking" });
    }
  });

  // GET /api/my-bookings - Get bookings for authenticated user
  app.get("/api/my-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error getting user bookings:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });

  // PUT /api/bookings/:id/cancel - Cancel a booking
  app.put("/api/bookings/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const booking = await storage.getBookingById(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to cancel this booking" });
      }
      
      const updatedBooking = await storage.cancelBooking(req.params.id);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  });

  // GET /api/my-miles - Get user miles balance
  app.get("/api/my-miles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const miles = await storage.getUserMiles(userId);
      res.json(miles);
    } catch (error) {
      console.error("Error getting user miles:", error);
      res.status(500).json({ error: "Failed to get miles" });
    }
  });

  // GET /api/my-miles/transactions - Get miles transaction history
  app.get("/api/my-miles/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const transactions = await storage.getMilesTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting miles transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // GET /api/trips/connections - Find connections between two cities
  app.get("/api/trips/connections", async (req, res) => {
    try {
      const { origin, destination, date } = req.query;
      
      if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }
      
      const connections = await storage.findConnections(
        origin as string, 
        destination as string,
        date as string | undefined
      );
      res.json(connections);
    } catch (error) {
      console.error("Error finding connections:", error);
      res.status(500).json({ error: "Failed to find connections" });
    }
  });

  // GET /api/trips/prices-by-date - Get lowest prices for date range
  app.get("/api/trips/prices-by-date", async (req, res) => {
    try {
      const { origin, destination, startDate, endDate } = req.query;
      
      if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }
      
      const prices = await storage.getPricesByDateRange(
        origin as string,
        destination as string,
        startDate as string,
        endDate as string
      );
      res.json(prices);
    } catch (error) {
      console.error("Error getting prices by date:", error);
      res.status(500).json({ error: "Failed to get prices" });
    }
  });

  return httpServer;
}
