import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/email';
import { prisma } from '@/lib/db';
import { generateCheckInToken } from '@/lib/token';
import CheckInEmail from '@/components/emails/check-in';

export async function GET(request: NextRequest) {
  const userEmail = process.env.EMAIL_RECIPIENT;

  if (!userEmail) {
    return NextResponse.json(
      { error: 'No EMAIL_RECIPIENT configured in .env' },
      { status: 400 }
    );
  }

  // In production, cron jobs would map over all users.
  // Since this is a test endpoint, we just grab the first user in the DB for the payload.
  const user = await prisma.user.findFirst();

  if (!user) {
    return NextResponse.json(
      {
        error:
          'Create a user account first in the dashboard before testing emails.',
      },
      { status: 400 }
    );
  }

  const token = generateCheckInToken(user.id);

  // Since you test locally, we default to localhost. In Vercel, it uses the host environment.
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://monkeymori.vercel.app'
      : 'http://localhost:3000';

  const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Monkey Mori <onboarding@resend.dev>', // You MUST use onboarding@resend.dev if you haven't bought/verified a Custom Domain in Resend yet!
      to: [userEmail],
      subject: 'Action Required: Monkey Mori Monthly Check-In',
      react: CheckInEmail({
        userName: user.name?.split(' ')[0] || 'there',
        checkInUrl,
        baseUrl,
      }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, checkInUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
