import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const result = await storage.ping();
      res.json({ 
        status: 'ok', 
        message: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: 'error', 
        message: "Server error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // All tools work client-side with localStorage
  // No server-side routes needed for standalone version

  const httpServer = createServer(app);
  return httpServer;
}