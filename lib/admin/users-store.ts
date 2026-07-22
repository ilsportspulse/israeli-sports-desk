import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { AdminRole } from "@/lib/admin/session";
import { readData, writeData } from "@/lib/admin/persist";

// Multi-user store for the backoffice (data/admin-users.json). Passwords are
// scrypt-hashed with a per-user salt; plain passwords never touch disk. The
// env-based root account (ADMIN_USERNAME/ADMIN_PASSWORD) keeps working as a
// break-glass login and is not stored here — but a store entry with the same
// username takes a password of its own (both then sign in, env stays recovery).

const USERS_REL = "data/admin-users.json";

export type StoredUser = {
  username: string;
  role: AdminRole;
  salt: string; // hex
  hash: string; // hex scrypt(password, salt)
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Pick<StoredUser, "username" | "role" | "createdAt" | "updatedAt">;

type UsersFile = { users: StoredUser[] };

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,30}$/;

function hashPassword(password: string, saltHex: string): string {
  return scryptSync(password, Buffer.from(saltHex, "hex"), 64).toString("hex");
}

export function generatePassword(): string {
  // 20 chars, unambiguous alphabet — shown once at creation/reset.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function readUsers(): Promise<UsersFile> {
  return readData<UsersFile>(USERS_REL, { users: [] });
}

async function writeUsers(file: UsersFile, actor: string): Promise<void> {
  await writeData(USERS_REL, file, { actor, message: `chore(backoffice): admin-users update by ${actor}` });
}

function toPublic(u: StoredUser): PublicUser {
  return { username: u.username, role: u.role, createdAt: u.createdAt, updatedAt: u.updatedAt };
}

export async function listUsers(): Promise<PublicUser[]> {
  const { users } = await readUsers();
  return users.map(toPublic).sort((a, b) => a.username.localeCompare(b.username));
}

export function validUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export async function createUser(
  username: string,
  role: AdminRole,
  password: string,
  actor: string,
): Promise<PublicUser> {
  const file = await readUsers();
  if (file.users.some((u) => u.username === username)) {
    throw new Error(`User "${username}" already exists.`);
  }
  const now = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const user: StoredUser = { username, role, salt, hash: hashPassword(password, salt), createdAt: now, updatedAt: now };
  file.users.push(user);
  await writeUsers(file, actor);
  return toPublic(user);
}

export async function setRole(username: string, role: AdminRole, actor: string): Promise<PublicUser | null> {
  const file = await readUsers();
  const user = file.users.find((u) => u.username === username);
  if (!user) return null;
  user.role = role;
  user.updatedAt = new Date().toISOString();
  await writeUsers(file, actor);
  return toPublic(user);
}

// Set (reset) a user's password. Creates the store entry when the username is
// the env root account being given a store-managed password for the first time.
export async function setPassword(
  username: string,
  password: string,
  actor: string,
  opts: { createRole?: AdminRole } = {},
): Promise<PublicUser | null> {
  const file = await readUsers();
  let user = file.users.find((u) => u.username === username);
  const now = new Date().toISOString();
  if (!user) {
    if (!opts.createRole) return null;
    const salt = randomBytes(16).toString("hex");
    user = { username, role: opts.createRole, salt, hash: "", createdAt: now, updatedAt: now };
    file.users.push(user);
  }
  user.salt = randomBytes(16).toString("hex");
  user.hash = hashPassword(password, user.salt);
  user.updatedAt = now;
  await writeUsers(file, actor);
  return toPublic(user);
}

export async function deleteUser(username: string, actor: string): Promise<boolean> {
  const file = await readUsers();
  const before = file.users.length;
  file.users = file.users.filter((u) => u.username !== username);
  if (file.users.length === before) return false;
  await writeUsers(file, actor);
  return true;
}

// Password check against the store. Returns the role on success, null otherwise.
export async function verifyStoredUser(username: string, password: string): Promise<AdminRole | null> {
  const { users } = await readUsers();
  const user = users.find((u) => u.username === username);
  if (!user || !user.hash) return null;
  const expected = Buffer.from(user.hash, "hex");
  const actual = Buffer.from(hashPassword(password, user.salt), "hex");
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? user.role : null;
}
