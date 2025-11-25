import { NextRequest, NextResponse } from 'next/server';
import { createLinkingCode } from '@/lib/telegram/userMapping';

/**
 * API endpoint to generate a Telegram linking code
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const code = await createLinkingCode(userId);

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error generating linking code:', error);
    return NextResponse.json(
      { error: 'Failed to generate linking code' },
      { status: 500 }
    );
  }
}
