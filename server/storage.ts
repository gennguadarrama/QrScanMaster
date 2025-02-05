import { User, InsertUser, Folder, QRCode, Scan } from "@shared/schema";
import { users, folders, qrCodes, scans } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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
  recordScan(qrId: number, device?: string | null, location?: string | null): Promise<Scan>;
  getScans(qrId: number): Promise<Scan[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createFolder(name: string, userId: number): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values({ name, userId })
      .returning();
    return folder;
  }

  async getFolders(userId: number): Promise<Folder[]> {
    return await db.select().from(folders).where(eq(folders.userId, userId));
  }

  async createQRCode(data: Omit<QRCode, "id">): Promise<QRCode> {
    const [qrCode] = await db.insert(qrCodes).values(data).returning();
    return qrCode;
  }

  async getQRCodes(userId: number): Promise<QRCode[]> {
    return await db.select().from(qrCodes).where(eq(qrCodes.userId, userId));
  }

  async getQRCode(id: number): Promise<QRCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode;
  }

  async recordScan(qrId: number, device?: string | null, location?: string | null): Promise<Scan> {
    const [scan] = await db
      .insert(scans)
      .values({
        qrId,
        timestamp: new Date(),
        device: device || null,
        location: location || null,
      })
      .returning();
    return scan;
  }

  async getScans(qrId: number): Promise<Scan[]> {
    return await db.select().from(scans).where(eq(scans.qrId, qrId));
  }
}

export const storage = new DatabaseStorage();