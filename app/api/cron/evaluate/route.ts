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

        // Notify the partner immediately that the vault is unlocked!
        if (user.householdId) {
          const partner = await prisma.user.findFirst({
            where: {
              householdId: user.householdId,
              id: { not: user.id },
            },
          });

          if (partner?.email) {
            const { error: partnerEmailError } = await resend.emails.send({
              from: 'Monkey Mori <onboarding@resend.dev>',
              to: [partner.email],
              subject: `🚨 CRITICAL ALERT: ${user.name?.split(' ')[0] || 'Your partner'}'s Vault Unlocked`,
              html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                  <h1 style="color: #ef4444; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">Monkey Mori Emergency Alert</h1>
                  <p><strong>URGENT:</strong> Your partner, <strong>${user.name || 'your household member'}</strong>, has failed to complete their Monkey Mori check-in for over 44 days.</p>
                  <p>Their dead man's switch has officially triggered.</p>
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 24px 0;">
                    <p style="margin: 0; color: #b91c1c; font-weight: bold;">
                      All of their inherently PRIVATE notes and instructions have now been automatically unlocked and are fully readable to you.
                    </p>
                  </div>
                  <p>Please log in immediately to review their emergency instructions, banking details, or final notes.</p>
                  <a href="${baseUrl}/dashboard/partner-vault" style="display:inline-block; margin-top: 16px; padding: 14px 28px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Access Partner Vault Now</a>
                </div>
              `
            });
            if (partnerEmailError) {
              console.error(`Failed to send partner vault alert email to ${partner.email}:`, partnerEmailError);
            }
          }
        }
      } 
      // WARNING 3: FINAL 48-HOUR URGENT WARNING (Day 42+)
      else if (deltaDays >= 42 && user.switchStatus !== 'TRIGGERED') {
        // Only send if we haven't already sent REMINDER_2 or if status is still in an earlier reminder stage
        if (user.email && user.switchStatus !== 'REMINDER_2') {
          const token = generateCheckInToken(user.id);
          const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;
          const { error: sendError } = await resend.emails.send({
            from: 'Monkey Mori <onboarding@resend.dev>',
            to: [user.email],
            subject: '🚨 URGENT: Monkey Mori trigger in 48 hours!',
            react: CheckInEmail({ userName: user.name?.split(' ')[0] || 'there', checkInUrl, baseUrl }),
          });
          if (sendError) {
            console.error(`Resend error sending URGENT_WARNING_3 to ${user.email}:`, sendError);
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { switchStatus: 'REMINDER_2' },
            });
            remindedUsers.push(`URGENT_WARNING_3_${user.email}`);
          }
        }
      }
      // WARNING 2: SEVEN DAYS OVERDUE (Day 37+)
      else if (deltaDays >= 37 && user.switchStatus !== 'TRIGGERED') {
        if (user.email && (user.switchStatus === 'ACTIVE' || user.switchStatus === 'REMINDER_1')) {
          const token = generateCheckInToken(user.id);
          const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;
          const { error: sendError } = await resend.emails.send({
            from: 'Monkey Mori <onboarding@resend.dev>',
            to: [user.email],
            subject: '⚠️ Monkey Mori: You missed your check-in!',
            react: CheckInEmail({ userName: user.name?.split(' ')[0] || 'there', checkInUrl, baseUrl }),
          });
          if (sendError) {
            console.error(`Resend error sending WARNING_2 to ${user.email}:`, sendError);
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { switchStatus: 'REMINDER_2' },
            });
            remindedUsers.push(`WARNING_2_${user.email}`);
          }
        }
      }
      // WARNING 1: STANDARD MONTHLY REMINDER (Day 30+)
      else if (deltaDays >= 30 && user.switchStatus === 'ACTIVE') {
        if (user.email) {
          const token = generateCheckInToken(user.id);
          const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;
          const { error: sendError } = await resend.emails.send({
            from: 'Monkey Mori <onboarding@resend.dev>',
            to: [user.email],
            subject: 'Action Required: Your Monkey Mori Check-In',
            react: CheckInEmail({ userName: user.name?.split(' ')[0] || 'there', checkInUrl, baseUrl }),
          });
          if (sendError) {
            console.error(`Resend error sending REMINDER_1 to ${user.email}:`, sendError);
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { switchStatus: 'REMINDER_1' },
            });
            remindedUsers.push(`REMINDER_1_${user.email}`);
          }
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
