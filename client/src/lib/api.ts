import type { Trip, Operator, Booking, InsertBooking, UserMiles, MilesTransaction } from "@shared/schema";

const API_BASE = "/api";

export interface SearchTripsParams {
  origin?: string;
  destination?: string;
  types?: string[];
  date?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface Connection {
  legs: Trip[];
  totalDuration: string;
  totalPrice: number;
}

export interface DatePrice {
  date: string;
  lowestPrice: number;
}

export const api = {
  // Trips
  async searchTrips(params: SearchTripsParams): Promise<Trip[]> {
    const searchParams = new URLSearchParams();
    
    if (params.origin) searchParams.append("origin", params.origin);
    if (params.destination) searchParams.append("destination", params.destination);
    if (params.types && params.types.length > 0) {
      searchParams.append("types", params.types.join(","));
    }
    if (params.date) {
      searchParams.append("date", params.date);
    }
    if (params.minPrice !== undefined) {
      searchParams.append("minPrice", params.minPrice.toString());
    }
    if (params.maxPrice !== undefined) {
      searchParams.append("maxPrice", params.maxPrice.toString());
    }
    
    const response = await fetch(`${API_BASE}/trips?${searchParams}`);
    if (!response.ok) {
      throw new Error("Failed to search trips");
    }
    return response.json();
  },

  async getTripById(id: string): Promise<Trip> {
    const response = await fetch(`${API_BASE}/trips/${id}`);
    if (!response.ok) {
      throw new Error("Failed to get trip");
    }
    return response.json();
  },

  async findConnections(origin: string, destination: string, date?: string): Promise<Connection[]> {
    const searchParams = new URLSearchParams({ origin, destination });
    if (date) searchParams.append("date", date);
    
    const response = await fetch(`${API_BASE}/trips/connections?${searchParams}`);
    if (!response.ok) {
      throw new Error("Failed to find connections");
    }
    return response.json();
  },

  async getPricesByDateRange(origin: string, destination: string, startDate: string, endDate: string): Promise<DatePrice[]> {
    const searchParams = new URLSearchParams({ origin, destination, startDate, endDate });
    
    const response = await fetch(`${API_BASE}/trips/prices-by-date?${searchParams}`);
    if (!response.ok) {
      throw new Error("Failed to get prices");
    }
    return response.json();
  },

  // Operators
  async getOperators(): Promise<Operator[]> {
    const response = await fetch(`${API_BASE}/operators`);
    if (!response.ok) {
      throw new Error("Failed to get operators");
    }
    return response.json();
  },

  // Bookings
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(booking),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create booking");
    }
    
    return response.json();
  },

  async getBookingById(id: string): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings/${id}`);
    if (!response.ok) {
      throw new Error("Failed to get booking");
    }
    return response.json();
  },

  async getMyBookings(): Promise<Booking[]> {
    const response = await fetch(`${API_BASE}/my-bookings`, { credentials: "include" });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("401: Unauthorized");
      }
      throw new Error("Failed to get bookings");
    }
    return response.json();
  },

  async cancelBooking(id: string): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: "PUT",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to cancel booking");
    }
    return response.json();
  },

  // Miles
  async getMyMiles(): Promise<UserMiles> {
    const response = await fetch(`${API_BASE}/my-miles`, { credentials: "include" });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("401: Unauthorized");
      }
      throw new Error("Failed to get miles");
    }
    return response.json();
  },

  async getMilesTransactions(): Promise<MilesTransaction[]> {
    const response = await fetch(`${API_BASE}/my-miles/transactions`, { credentials: "include" });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("401: Unauthorized");
      }
      throw new Error("Failed to get transactions");
    }
    return response.json();
  },
};

// Helper to format price from cents to pesos
export function formatPrice(cents: number): string {
  const pesos = cents / 100;
  return `$U ${pesos.toLocaleString('es-UY')}`;
}

// Format short price (e.g., $78K)
export function formatShortPrice(cents: number): string {
  const pesos = cents / 100;
  if (pesos >= 1000) {
    return `$${Math.round(pesos / 1000)}K`;
  }
  return `$${pesos}`;
}
