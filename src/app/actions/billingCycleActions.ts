
'use server';

import { revalidateTag } from 'next/cache';
import { getDb, mapMongoDocumentBillingCycle } from '@/lib/actions-helpers';
import type { BillingCycle } from '@/types';
import { subSeconds, startOfDay, endOfDay, subDays } from 'date-fns';

export async function getBillingCycles(userId: string): Promise<BillingCycle[]> {
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

export async function getCurrentBillingCycle(userId: string): Promise<BillingCycle | null> {
    if (!userId) return null;
    try {
      const { billingCyclesCollection } = await getDb();
      
      const activeCycles = await billingCyclesCollection.find({ userId, endDate: { $exists: false } }).sort({ startDate: -1 }).toArray();

      if (activeCycles.length > 1) {
        const mostRecentCycle = activeCycles[0];
        const cyclesToClose = activeCycles.slice(1);

        for (const cycleToClose of cyclesToClose) {
          const endDateForOldCycle = subSeconds(new Date(mostRecentCycle.startDate), 1);
          await billingCyclesCollection.updateOne(
            { _id: cycleToClose._id },
            { $set: { endDate: endDateForOldCycle } }
          );
        }
        revalidateTag(`billingCycles_${userId}`);
        // The most recent cycle is still active, return it
        return mapMongoDocumentBillingCycle(mostRecentCycle);

      } else if (activeCycles.length === 1) {
        return mapMongoDocumentBillingCycle(activeCycles[0]);
      }

      // No active cycles found.
      const totalCyclesCount = await billingCyclesCollection.countDocuments({ userId });
      if (totalCyclesCount === 0) {
        // If the user has no cycles at all, return null so the UI can show an onboarding screen.
        return null;
      }
      
      // User has past cycles but no active one. Return the most recently closed one.
      const lastClosedCycle = await billingCyclesCollection.findOne({ userId }, { sort: { endDate: -1 } });
      return lastClosedCycle ? mapMongoDocumentBillingCycle(lastClosedCycle) : null;

    } catch (error) {
      console.error('Error fetching current billing cycle:', error);
      return null;
    }
}

export async function startNewCycle(userId: string, startDate?: Date): Promise<BillingCycle | { error: string }> {
    if (!userId) return { error: 'User not authenticated.' };
    
    const newCycleDate = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date());

    try {
        const { billingCyclesCollection } = await getDb();

        // Find the current active cycle (the one without an end date)
        const currentActiveCycle = await billingCyclesCollection.findOne({ userId, endDate: { $exists: false } });

        if (currentActiveCycle) {
            const endDateForOldCycle = endOfDay(subDays(newCycleDate, 1));
            if (new Date(currentActiveCycle.startDate) >= endDateForOldCycle) {
                return { error: 'The new cycle start date must be after the previous cycle\'s start date.' };
            }
            // Close the previous cycle
            await billingCyclesCollection.updateOne(
                { _id: currentActiveCycle._id },
                { $set: { endDate: endDateForOldCycle } }
            );
        }

        const newCycleDocument = {
            userId,
            startDate: newCycleDate,
            endDate: undefined,
        };

        const result = await billingCyclesCollection.insertOne(newCycleDocument);
        if (!result.insertedId) {
            throw new Error('Failed to insert new billing cycle.');
        }

        revalidateTag(`billingCycles_${userId}`);
        revalidateTag(`transactions_${userId}`);

        const newCycle = await billingCyclesCollection.findOne({ _id: result.insertedId });
        if (!newCycle) {
            throw new Error('Could not find the newly created billing cycle.');
        }

        return mapMongoDocumentBillingCycle(newCycle);

    } catch (error) {
        console.error('Error starting new billing cycle:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { error: `Failed to start new billing cycle. ${errorMessage}` };
    }
}
