import fs from 'node:fs';
import path from 'node:path';

// In-memory cache so readDatabase() does not hit disk on every request
let _dbCache: DatabaseSchema | null = null;

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  diskFileName: string;
  uploadedAt: number;
  expiresAt: number;
  durationLabel: string;
  hasPassword: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  downloadCount: number;
  maxDownloads: number | null;
  status: 'active' | 'expired' | 'exhausted';
  ownerEmail?: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
}

interface DatabaseSchema {
  files: StoredFile[];
  users: StoredUser[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = process.env.STORAGE_DIR 
  ? path.resolve(process.cwd(), process.env.STORAGE_DIR) 
  : path.join(DATA_DIR, 'uploads');
const DB_FILE = process.env.DB_PATH 
  ? path.resolve(process.cwd(), process.env.DB_PATH) 
  : path.join(DATA_DIR, 'db.json');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function initSeeds(): DatabaseSchema {
  ensureDirectories();

  // Create real mock binary files in data/uploads so they are physically downloadable
  const activeDiskFile = 'demo-active.txt';
  const lockedDiskFile = 'demo-locked.txt';
  const fastDiskFile = 'demo-fast.txt';

  fs.writeFileSync(
    path.join(UPLOADS_DIR, activeDiskFile),
    'VANISH EPHEMERAL SHARE: Confidential Project Document\n\nThis file is stored in secure temporary cloud storage and scheduled for automatic permanent deletion upon TTL expiry.'
  );

  fs.writeFileSync(
    path.join(UPLOADS_DIR, lockedDiskFile),
    'CONFIDENTIAL FINANCIAL AUDIT\nStatus: Decrypted Successfully\nRecipient authorized via secure passphrase.'
  );

  fs.writeFileSync(
    path.join(UPLOADS_DIR, fastDiskFile),
    'RAPID DEMO FILE\nThis file has a 60-second TTL and will vanish permanently from storage when the clock reaches zero.'
  );

  const initialData: DatabaseSchema = {
    files: [
      {
        id: 'demo-active',
        name: 'Confidential_Project_Document.pdf',
        size: 2457600,
        mimeType: 'application/pdf',
        diskFileName: activeDiskFile,
        uploadedAt: Date.now() - 1000 * 60 * 35,
        expiresAt: Date.now() + 1000 * 60 * 60 * 5,
        durationLabel: '6 Hours',
        hasPassword: false,
        downloadCount: 3,
        maxDownloads: 10,
        status: 'active',
        ownerEmail: 'user@vanish.dev',
      },
      {
        id: 'demo-locked',
        name: 'Encrypted_Financial_Audit.xlsx',
        size: 1548200,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        diskFileName: lockedDiskFile,
        uploadedAt: Date.now() - 1000 * 60 * 90,
        expiresAt: Date.now() + 1000 * 60 * 60 * 22,
        durationLabel: '24 Hours',
        hasPassword: true,
        // Plaintext demo password: password123
        passwordSalt: '1234567890abcdef',
        passwordHash: '8b488eb44c680adad2b2fe6f6dcfb9409b8bdfb1e3e7f415c1e95fc88f34c26359556ef382b6c165a3cffaa5e20d6f4611624641775792dff19f715878db4188',
        downloadCount: 1,
        maxDownloads: 5,
        status: 'active',
        ownerEmail: 'user@vanish.dev',
      },
      {
        id: 'demo-vanished',
        name: 'Temporary_API_Credentials.env',
        size: 840,
        mimeType: 'text/plain',
        diskFileName: 'vanished.txt',
        uploadedAt: Date.now() - 1000 * 60 * 60 * 2,
        expiresAt: Date.now() - 1000 * 60 * 30, // Expired 30 min ago
        durationLabel: '1 Hour',
        hasPassword: false,
        downloadCount: 2,
        maxDownloads: null,
        status: 'expired',
        ownerEmail: 'user@vanish.dev',
      },
      {
        id: 'demo-exhausted',
        name: 'Event_Invite_VIP.png',
        size: 4320100,
        mimeType: 'image/png',
        diskFileName: 'exhausted.png',
        uploadedAt: Date.now() - 1000 * 60 * 15,
        expiresAt: Date.now() + 1000 * 60 * 60 * 12,
        durationLabel: '24 Hours',
        hasPassword: false,
        downloadCount: 3,
        maxDownloads: 3,
        status: 'exhausted',
        ownerEmail: 'user@vanish.dev',
      },
      {
        id: 'demo-fast',
        name: 'Quick_Self_Destruct_Demo.txt',
        size: 2048,
        mimeType: 'text/plain',
        diskFileName: fastDiskFile,
        uploadedAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60,
        durationLabel: '1 Min Demo',
        hasPassword: false,
        downloadCount: 0,
        maxDownloads: 2,
        status: 'active',
        ownerEmail: 'user@vanish.dev',
      }
    ],
    users: [
      {
        id: 'user-default-1',
        name: 'Vanish User',
        email: 'user@vanish.dev',
        passwordSalt: '1234567890abcdef',
        passwordHash: '8b488eb44c680adad2b2fe6f6dcfb9409b8bdfb1e3e7f415c1e95fc88f34c26359556ef382b6c165a3cffaa5e20d6f4611624641775792dff19f715878db4188',
        createdAt: Date.now(),
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  _dbCache = initialData; // populate in-memory cache
  return initialData;
}

export function readDatabase(): DatabaseSchema {
  if (_dbCache) return _dbCache;
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    _dbCache = initSeeds();
    return _dbCache;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    _dbCache = JSON.parse(raw);
    return _dbCache!;
  } catch {
    _dbCache = initSeeds();
    return _dbCache;
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  ensureDirectories();
  _dbCache = data; // update in-memory cache immediately
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function getUploadsDirectory(): string {
  ensureDirectories();
  return UPLOADS_DIR;
}

/**
 * Cleanup daemon: Checks expiry timestamps and physically deletes expired files from disk.
 * This ensures the true "vanishing" behavior.
 */
export function purgeExpiredFiles(): { purgedCount: number; purgedIds: string[] } {
  const db = readDatabase();
  const now = Date.now();
  const purgedIds: string[] = [];

  let changed = false;

  for (const file of db.files) {
    if (file.status === 'active' && now >= file.expiresAt) {
      file.status = 'expired';
      purgedIds.push(file.id);
      changed = true;

      // Physically delete binary payload from storage
      const physicalPath = path.join(UPLOADS_DIR, file.diskFileName);
      if (fs.existsSync(physicalPath)) {
        try {
          fs.unlinkSync(physicalPath);
          console.log(`[Vanish Cleanup Worker] Purged expired binary: ${file.name} (${file.id})`);
        } catch (e) {
          console.error(`Failed to unlink expired file ${file.id}`, e);
        }
      }
    }
  }

  if (changed) {
    writeDatabase(db);
  }

  return { purgedCount: purgedIds.length, purgedIds };
}

export function resetDatabase(): DatabaseSchema {
  return initSeeds();
}
