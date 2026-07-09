import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const normalizedHash = passwordHash.startsWith('$2y$') ? `$2b$${passwordHash.slice(4)}` : passwordHash;
  return bcrypt.compare(password, normalizedHash);
}
