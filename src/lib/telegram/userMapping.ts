import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { TelegramUser } from '@/types';
import { generateLinkingCode } from './bot';

/**
 * User mapping between Telegram and Firebase
 * Manages the linking of Telegram accounts to FinanClan accounts
 */

interface LinkingCode {
  code: string;
  firebaseUid: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

/**
 * Get Telegram user by Telegram ID
 */
export async function getTelegramUser(telegramId: string): Promise<TelegramUser | null> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('telegramUsers');

    const user = await collection.findOne({ telegramId, isActive: true });
    
    if (!user) return null;

    return {
      id: user._id.toString(),
      telegramId: user.telegramId,
      firebaseUid: user.firebaseUid,
      username: user.username,
      firstName: user.firstName,
      linkedAt: user.linkedAt,
      isActive: user.isActive,
      preferences: user.preferences,
    };
  } catch (error) {
    console.error('Error getting Telegram user:', error);
    return null;
  }
}

/**
 * Create a linking code for a Firebase user
 */
export async function createLinkingCode(firebaseUid: string): Promise<string> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('telegramLinkingCodes');

    // Invalidate any existing codes for this user
    await collection.updateMany(
      { firebaseUid, used: false },
      { $set: { used: true } }
    );

    const code = generateLinkingCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const linkingCode: LinkingCode = {
      code,
      firebaseUid,
      createdAt: now,
      expiresAt,
      used: false,
    };

    await collection.insertOne(linkingCode);

    return code;
  } catch (error) {
    console.error('Error creating linking code:', error);
    throw new Error('Failed to create linking code');
  }
}

/**
 * Link a Telegram account to a Firebase account using a code
 */
export async function linkTelegramAccount(
  code: string,
  telegramId: string,
  username?: string,
  firstName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const codesCollection = db.collection('telegramLinkingCodes');
    const usersCollection = db.collection('telegramUsers');

    // Find the linking code
    const linkingCode = await codesCollection.findOne({ code, used: false });

    if (!linkingCode) {
      return { success: false, error: 'Código inválido o expirado' };
    }

    // Check if code is expired
    if (new Date() > linkingCode.expiresAt) {
      return { success: false, error: 'El código ha expirado' };
    }

    // Check if this Telegram account is already linked
    const existingUser = await usersCollection.findOne({ telegramId });
    if (existingUser) {
      return { success: false, error: 'Esta cuenta de Telegram ya está vinculada' };
    }

    // Create the Telegram user
    const telegramUser: Omit<TelegramUser, 'id'> = {
      telegramId,
      firebaseUid: linkingCode.firebaseUid,
      username,
      firstName,
      linkedAt: new Date().toISOString(),
      isActive: true,
      preferences: {
        language: 'es',
      },
    };

    await usersCollection.insertOne(telegramUser);

    // Mark the code as used
    await codesCollection.updateOne(
      { code },
      { $set: { used: true } }
    );

    return { success: true };
  } catch (error) {
    console.error('Error linking Telegram account:', error);
    return { success: false, error: 'Error al vincular la cuenta' };
  }
}

/**
 * Unlink a Telegram account
 */
export async function unlinkTelegramAccount(
  telegramId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('telegramUsers');

    const result = await collection.updateOne(
      { telegramId },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Cuenta no encontrada' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unlinking Telegram account:', error);
    return { success: false, error: 'Error al desvincular la cuenta' };
  }
}

/**
 * Get Firebase UID from Telegram ID
 */
export async function getFirebaseUidFromTelegram(
  telegramId: string
): Promise<string | null> {
  const user = await getTelegramUser(telegramId);
  return user?.firebaseUid || null;
}

/**
 * Update Telegram user preferences
 */
export async function updateTelegramUserPreferences(
  telegramId: string,
  preferences: Partial<TelegramUser['preferences']>
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('telegramUsers');

    const result = await collection.updateOne(
      { telegramId, isActive: true },
      { $set: { preferences } }
    );

    return result.matchedCount > 0;
  } catch (error) {
    console.error('Error updating Telegram user preferences:', error);
    return false;
  }
}
