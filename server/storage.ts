import { User, InsertUser, Folder, QRCode, Scan } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Folder operations
  createFolder(name: string, userId: number): Promise<Folder>;
  getFolders(userId: number): Promise<Folder[]>;
  
  // QR Code operations
  createQRCode(data: Omit<QRCode, "id">): Promise<QRCode>;
  getQRCodes(userId: number): Promise<QRCode[]>;
  getQRCode(id: number): Promise<QRCode | undefined>;
  
  // Scan operations
  recordScan(qrId: number, device?: string, location?: string): Promise<Scan>;
  getScans(qrId: number): Promise<Scan[]>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private qrCodes: Map<number, QRCode>;
  private scans: Map<number, Scan>;
  private currentId: { [key: string]: number };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.qrCodes = new Map();
    this.scans = new Map();
    this.currentId = { users: 1, folders: 1, qrCodes: 1, scans: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFolder(name: string, userId: number): Promise<Folder> {
    const id = this.currentId.folders++;
    const folder: Folder = { id, name, userId };
    this.folders.set(id, folder);
    return folder;
  }

  async getFolders(userId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId,
    );
  }

  async createQRCode(data: Omit<QRCode, "id">): Promise<QRCode> {
    const id = this.currentId.qrCodes++;
    const qrCode: QRCode = { ...data, id };
    this.qrCodes.set(id, qrCode);
    return qrCode;
  }

  async getQRCodes(userId: number): Promise<QRCode[]> {
    return Array.from(this.qrCodes.values()).filter(
      (qr) => qr.userId === userId,
    );
  }

  async getQRCode(id: number): Promise<QRCode | undefined> {
    return this.qrCodes.get(id);
  }

  async recordScan(qrId: number, device?: string, location?: string): Promise<Scan> {
    const id = this.currentId.scans++;
    const scan: Scan = {
      id,
      qrId,
      timestamp: new Date(),
      device,
      location,
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScans(qrId: number): Promise<Scan[]> {
    return Array.from(this.scans.values()).filter(
      (scan) => scan.qrId === qrId,
    );
  }
}

export const storage = new MemStorage();
