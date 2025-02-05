import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
});

export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type").notNull(), // url, text, email, phone
  logo: text("logo"), // base64 encoded
  folderId: integer("folder_id"),
  userId: integer("user_id").notNull(),
});

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  qrId: integer("qr_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  device: text("device"),
  location: text("location"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
});

export const insertQRCodeSchema = createInsertSchema(qrCodes).pick({
  content: true,
  type: true,
  logo: true,
  folderId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type QRCode = typeof qrCodes.$inferSelect;
export type Scan = typeof scans.$inferSelect;
