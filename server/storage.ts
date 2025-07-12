// Simple in-memory storage for standalone DevToolNest
// All data is stored client-side in localStorage via the frontend

export interface IStorage {
  // No server-side storage needed for standalone version
  ping(): Promise<string>;
}

export class MemStorage implements IStorage {
  async ping(): Promise<string> {
    return "DevToolNest server is running";
  }
}

export const storage = new MemStorage();