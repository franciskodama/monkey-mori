import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/email';
import { generateCheckInToken } from '@/lib/token';
import CheckInEmail from '@/components/emails/check-in';

// This endpoint is automatically triggered by Vercel Cron and secured via a secret header.
export async function GET(request: Request) {
  // 1. Security check: Ensure only Vercel (or us manually with the secret) can execute this
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany();
    const now = new Date();
    
    // Arrays to track our cron logs
    const triggeredUsers: string[] = [];
    const remindedUsers: string[] = [];

    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://monkeymori.vercel.app'
      : 'http://localhost:3000';

    for (const user of users) {
      if (!user.lastCheckInAt) continue;

      const deltaMs = now.getTime() - user.lastCheckInAt.getTime();
      const deltaDays = deltaMs / (1000 * 3600 * 24);

      // ----------------------------------------------------------------------
      // NEW ROBUST ESCALATION PROTOCOL (44 Days Total)
      // ----------------------------------------------------------------------
      
      // FINAL TRIGGER: Over 44 days (2 weeks past the original 30-day check-in)
      if (deltaDays >= 44 && user.switchStatus !== 'TRIGGERED') {
        await prisma.user.update({
          where: { id: user.id },
          data: { switchStatus: 'TRIGGERED' },
        });
        triggeredUsers.push(user.email || user.id);
      } 
      // WARNING 3: FINAL 48-HOUR URGENT WARNING (Day 42 - Day 43)
      else if (deltaDays >= 42 && deltaDays < 43 && user.switchStatus === 'ACTIVE') {
        if (user.email) {
          const token = generateCheckInToken(user.id);
          const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;
          await resend.emails.send({
            from: 'Monkey Mori <onboarding@resend.dev>',
            to: [user.email],
            subject: '🚨 URGENT: Monkey Mori trigger in 48 hours!',
            react: CheckInEmail({ userName: user.name?.split(' ')[0] || 'there', checkInUrl, baseUrl }),
          });
          remindedUsers.push(`URGENT_WARNING_3_${user.email}`);
        }
      }
      // WARNING 2: SEVEN DAYS OVERDUE (Day 37 - Day 38)
      else if (deltaDays >= 37 && deltaDays < 38 && user.switchStatus === 'ACTIVE') {
        if (user.email) {
          const token = generateCheckInToken(user.id);
          const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;
          await resend.emails.send({
            from: 'Monkey Mori <onboarding@resend.dev>',
            to: [user.email],
            subject: '⚠️ Monkey Mori: You missed your check-in!',
            react: CheckInEmail({ userName: user.name?.split(' ')[0] || 'there', checkInUrl, baseUrl }),
          });
          remindedUsers.push(`WARNING_2_${user.email}`);
        }
      }
      // WARNING 1: STANDARD MONTHLY REMINDER (Day 30 - Day 31)
      else if (deltaDays >= 30 && deltaDays < 31 && user.switchStatus === 'ACTIVE') {
        if (user.email) {
          const token = generateCheckInToken(user.id);
          const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;
          await resend.emails.send({
            from: 'Monkey Mori <onboarding@resend.dev>',
            to: [user.email],
            subject: 'Action Required: Your Monkey Mori Check-In',
            react: CheckInEmail({ userName: user.name?.split(' ')[0] || 'there', checkInUrl, baseUrl }),
          });
          remindedUsers.push(`REMINDER_1_${user.email}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      evaluated: users.length,
      triggered: triggeredUsers,
      reminded: remindedUsers 
    });

  } catch (error) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
