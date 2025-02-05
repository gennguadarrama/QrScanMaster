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
      // Convert logo to grayscale and optimize for QR code
      const buffer = Buffer.from(logo.split(',')[1], 'base64');
      const processedBuffer = await sharp(buffer)
        .grayscale()
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .normalize() // Enhance contrast
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

  // Actualizar QR code
  app.patch("/api/qrcodes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const qrId = parseInt(req.params.id);
    const qrCode = await storage.getQRCode(qrId);

    if (!qrCode) return res.sendStatus(404);
    if (qrCode.userId !== req.user.id) return res.sendStatus(403);

    const updatedQR = await storage.updateQRCode(qrId, req.body);
    res.json(updatedQR);
  });

  // Scan tracking routes
  app.get("/api/qrcodes/:id/scan", async (req, res) => {
    const qrId = parseInt(req.params.id);
    const qrCode = await storage.getQRCode(qrId);
    if (!qrCode) return res.sendStatus(404);

    // Get device info from user agent
    const device = req.headers['user-agent'] || 'Unknown Device';

    // Get approximate location from IP
    const forwardedFor = req.headers['x-forwarded-for'];
    const location = forwardedFor ? `IP: ${forwardedFor}` : 'Unknown Location';

    // Record the scan
    await storage.recordScan(qrId, device, location);

    // Redirect to the QR content
    const content = req.query.content as string;
    if (!content) return res.sendStatus(400);

    // If it's a URL, redirect to it, otherwise show the content
    if (qrCode.type === 'url' && content.startsWith('http')) {
      res.redirect(content);
    } else {
      res.send(`<html><body><h1>QR Content</h1><p>${content}</p></body></html>`);
    }
  });

  app.get("/api/qrcodes/:id/scans", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const scans = await storage.getScans(parseInt(req.params.id));
    res.json(scans);
  });

  const httpServer = createServer(app);
  return httpServer;
}