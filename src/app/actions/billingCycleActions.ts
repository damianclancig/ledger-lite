
'use server';

import { getDb, mapMongoDocumentBillingCycle } from '@/lib/actions-helpers';
import { validateUserId } from '@/lib/validation-helpers';
import { handleActionError } from '@/lib/error-helpers';
import { revalidateUserTag, revalidateUserTags, CacheTag, TagGroups } from '@/lib/cache-helpers';
import { getAuthenticatedUser } from '@/lib/auth-server';
import type { BillingCycle } from '@/types';

export async function getBillingCycles(): Promise<BillingCycle[]> {
  const { id: userId } = await getAuthenticatedUser();
  if (!userId) return [];
  try {
    const { billingCyclesCollection } = await getDb();
    const cycles = await billingCyclesCollection.find({ userId }).sort({ startDate: -1 }).toArray();
    return cycles.map(mapMongoDocumentBillingCycle);
  } catch (error) {
    console.error('Error fetching billing cycles:', error);
    return [];
  }
}


export async function getCurrentBillingCycle(): Promise<BillingCycle | null> {
  const { id } = await getAuthenticatedUser();
  return getInternalCurrentBillingCycle(id);
}

export async function getInternalCurrentBillingCycle(userId: string): Promise<BillingCycle | null> {
  if (!userId) return null;
  try {
    const { billingCyclesCollection } = await getDb();

    const activeCycles = await billingCyclesCollection.find({
      userId,
      $or: [{ endDate: { $exists: false } }, { endDate: null }]
    }).sort({ startDate: -1 }).toArray();

    if (activeCycles.length > 1) {
      const mostRecentCycle = activeCycles[0];
      const cyclesToCloseIds = activeCycles.slice(1).map(c => c._id);

      const newStartDate = new Date(mostRecentCycle.startDate);
      const endDateForOldCycle = new Date(newStartDate.getTime() - 1);

      await billingCyclesCollection.updateMany(
        { _id: { $in: cyclesToCloseIds } },
        { $set: { endDate: endDateForOldCycle } }
      );

      revalidateUserTag(userId, CacheTag.BILLING_CYCLES);
      return mapMongoDocumentBillingCycle(mostRecentCycle);

    } else if (activeCycles.length === 1) {
      return mapMongoDocumentBillingCycle(activeCycles[0]);
    }

    const totalCyclesCount = await billingCyclesCollection.countDocuments({ userId });
    if (totalCyclesCount === 0) {
      return null;
    }

    const lastClosedCycle = await billingCyclesCollection.findOne({ userId }, { sort: { endDate: -1 } });
    return lastClosedCycle ? mapMongoDocumentBillingCycle(lastClosedCycle) : null;

  } catch (error) {
    console.error('Error fetching current billing cycle:', error);
    return null;
  }
}

export async function startNewCycle(startDate: Date): Promise<BillingCycle | { error: string }> {
  try {
    const { id: userId } = await getAuthenticatedUser();
    const newCycleStartDate = startDate;
    const endDateForOldCycles = new Date(newCycleStartDate.getTime() - 1);
    const { billingCyclesCollection } = await getDb();

    const activeCycles = await billingCyclesCollection.find({
      userId,
      $or: [{ endDate: { $exists: false } }, { endDate: null }]
    }).toArray();

    if (activeCycles.length > 0) {
      const mostRecentActiveCycle = activeCycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      if (new Date(mostRecentActiveCycle.startDate) >= newCycleStartDate) {
        return { error: 'The new cycle start date must be after the previous cycle\'s start date.' };
      }

      const activeCycleIds = activeCycles.map(c => c._id);
      await billingCyclesCollection.updateMany(
        { _id: { $in: activeCycleIds } },
        { $set: { endDate: endDateForOldCycles } }
      );
    }

    const newCycleDocument = {
      userId,
      startDate: newCycleStartDate,
    };

    const result = await billingCyclesCollection.insertOne(newCycleDocument);
    if (!result.insertedId) {
      throw new Error('Failed to insert new billing cycle.');
    }

    revalidateUserTags(userId, TagGroups.BILLING_CYCLE_MUTATION);

    const newCycle = await billingCyclesCollection.findOne({ _id: result.insertedId });
    if (!newCycle) {
      throw new Error('Could not find the newly created billing cycle.');
    }

    return mapMongoDocumentBillingCycle(newCycle);

  } catch (error) {
    return handleActionError(error, 'add billing cycle');
  }
}
