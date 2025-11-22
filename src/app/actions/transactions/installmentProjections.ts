'use server';

import { getDb } from '@/lib/actions-helpers';
import { validateUserId } from '@/lib/validation-helpers';
import type { InstallmentProjection } from '@/types';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export async function getInstallmentProjections(userId: string): Promise<InstallmentProjection[]> {
  if (!userId) return [];
  try {
    const { transactionsCollection } = await getDb();
    const now = new Date();
    
    // Calculate range: 6 months back and 6 months forward from current month
    const rangeStart = startOfMonth(addMonths(now, -6));
    const rangeEnd = endOfMonth(addMonths(now, 6));

    const query = {
      userId,
      type: 'expense',
      groupId: { $exists: true },
      date: {
        $gte: rangeStart,
        $lte: rangeEnd
      }
    };

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", total: "$total" } }
    ];

    const result = await transactionsCollection.aggregate(pipeline).toArray() as unknown as InstallmentProjection[];

    const projectionMap = new Map(result.map((item: any) => [item.month, item.total]));
    const finalProjection: InstallmentProjection[] = [];

    // Generate 12 months: from -6 to +5 months relative to current month
    for (let i = -6; i <= 5; i++) {
      const monthDate = addMonths(startOfMonth(now), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      finalProjection.push({
        month: monthKey,
        total: projectionMap.get(monthKey) || 0
      });
    }
    return finalProjection;
  } catch (error) {
    console.error('Error fetching installment projections:', error);
    return [];
  }
}
