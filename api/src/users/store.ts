import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// process.cwd() (no __dirname): el proyecto corre tanto con tsx (ESM loader,
// sin __dirname) como compilado a dist/ con CommonJS — cwd siempre es api/
// tanto en `npm run dev` como en `npm start`.

export type AccountType = "person" | "business";

export interface User {
  id: string;
  accountType: AccountType;
  name: string;
  email: string;
  password: string;
  privyId?: string;
  walletAddress: `0x${string}`;
  documentId?: string;
  businessName?: string;
  taxId?: string;
  contactName?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

function readUsers(): User[] {
  if (!existsSync(DATA_FILE)) return [];
  const raw = readFileSync(DATA_FILE, "utf8").trim();
  return raw ? (JSON.parse(raw) as User[]) : [];
}

function writeUsers(users: User[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): User | undefined {
  const key = email.trim().toLowerCase();
  return readUsers().find((user) => user.email.toLowerCase() === key);
}

export function findUserByPrivyId(privyId: string): User | undefined {
  return readUsers().find((user) => user.privyId === privyId);
}

export function getUserById(id: string): User | undefined {
  return readUsers().find((user) => user.id === id);
}

export function linkPrivyId(userId: string, privyId: string): User | undefined {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return undefined;
  users[index] = { ...users[index], privyId };
  writeUsers(users);
  return users[index];
}

export interface CreateUserInput {
  accountType: AccountType;
  name: string;
  email: string;
  password: string;
  privyId?: string;
  walletAddress: `0x${string}`;
  documentId?: string;
  businessName?: string;
  taxId?: string;
  contactName?: string;
}

/// Demo: contraseña en texto plano y JSON como "DB" — suficiente para el
/// hackathon, no usar tal cual en producción.
export function createUser(input: CreateUserInput): User {
  const users = readUsers();
  const user: User = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  users.push(user);
  writeUsers(users);
  return user;
}
