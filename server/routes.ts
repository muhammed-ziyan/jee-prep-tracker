import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed Syllabus on startup
  await storage.seedSyllabus();

  // Middleware to ensure user is authenticated
  // (We can apply this globally or per route. Applying per route for clarity)
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Syllabus Routes
  app.get(api.syllabus.list.path, requireAuth, async (req, res) => {
    const data = await storage.getSubjectsWithUnitsAndTopics();
    res.json(data);
  });

  app.get(api.syllabus.getProgress.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub; 
    const data = await storage.getTopicProgress(userId);
    res.json(data);
  });

  app.post(api.syllabus.updateProgress.path, requireAuth, async (req, res) => {
    try {
       // @ts-ignore
      const userId = req.user!.claims.sub;
      const input = api.syllabus.updateProgress.input.parse(req.body);
      const updated = await storage.updateTopicProgress({ ...input, userId });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Dashboard Stats
  app.get(api.dashboard.stats.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const stats = await storage.getDashboardStats(userId);
    res.json(stats);
  });

  // Study Sessions
  app.get(api.studySessions.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const sessions = await storage.getStudySessions(userId);
    res.json(sessions);
  });

  app.post(api.studySessions.create.path, requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user!.claims.sub;
      const input = api.studySessions.create.input.parse(req.body);
      const session = await storage.createStudySession({ ...input, userId });
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Revision
  app.get(api.revision.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const schedule = await storage.getRevisionSchedule(userId);
    res.json(schedule);
  });

  app.post(api.revision.create.path, requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user!.claims.sub;
      const input = api.revision.create.input.parse(req.body);
      const item = await storage.createRevisionSchedule({ ...input, userId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.revision.markComplete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.completeRevision(id);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // Backlog
  app.get(api.backlog.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const items = await storage.getBacklogItems(userId);
    res.json(items);
  });

  app.post(api.backlog.create.path, requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user!.claims.sub;
      const input = api.backlog.create.input.parse(req.body);
      const item = await storage.createBacklogItem({ ...input, userId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.backlog.update.path, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.backlog.update.input.parse(req.body);
      const updated = await storage.updateBacklogItem(id, input);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
  
  app.delete(api.backlog.delete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteBacklogItem(id);
    res.status(204).send();
  });

  // Mock Tests
  app.get(api.mockTests.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const tests = await storage.getMockTests(userId);
    res.json(tests);
  });

  app.post(api.mockTests.create.path, requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user!.claims.sub;
      const { test, subjects } = req.body; // Manual parsing for complex object
      
      const newTest = await storage.createMockTest({ ...test, userId }, subjects);
      res.status(201).json(newTest);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  return httpServer;
}
