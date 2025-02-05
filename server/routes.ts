import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import sharp from "sharp";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Folder routes
  app.post("/api/folders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const folder = await storage.createFolder(req.body.name, req.user.id);
    res.json(folder);
  });

  app.get("/api/folders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const folders = await storage.getFolders(req.user.id);
    res.json(folders);
  });

  // QR Code routes
  app.post("/api/qrcodes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let logo = req.body.logo;
    if (logo) {
      // Convert logo to grayscale
      const buffer = Buffer.from(logo.split(',')[1], 'base64');
      const processedBuffer = await sharp(buffer)
        .grayscale()
        .toBuffer();
      logo = `data:image/png;base64,${processedBuffer.toString('base64')}`;
    }

    const qrCode = await storage.createQRCode({
      ...req.body,
      logo,
      userId: req.user.id,
    });
    res.json(qrCode);
  });

  app.get("/api/qrcodes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const qrCodes = await storage.getQRCodes(req.user.id);
    res.json(qrCodes);
  });

  app.get("/api/qrcodes/:id", async (req, res) => {
    const qrCode = await storage.getQRCode(parseInt(req.params.id));
    if (!qrCode) return res.sendStatus(404);
    res.json(qrCode);
  });

  // Scan tracking routes
  app.post("/api/qrcodes/:id/scan", async (req, res) => {
    const scan = await storage.recordScan(
      parseInt(req.params.id),
      req.body.device,
      req.body.location
    );
    res.json(scan);
  });

  app.get("/api/qrcodes/:id/scans", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const scans = await storage.getScans(parseInt(req.params.id));
    res.json(scans);
  });

  const httpServer = createServer(app);
  return httpServer;
}
