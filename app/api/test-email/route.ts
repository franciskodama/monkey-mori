import { NextRequest, NextResponse } from 'next/server';
import { resend, EMAIL_FROM, getBaseUrl } from '@/lib/email';
import { prisma } from '@/lib/db';
import { generateCheckInToken } from '@/lib/token';
import { auth } from '@/auth';
import CheckInEmail from '@/components/emails/check-in';

export async function GET(request: NextRequest) {
  // 1. Check for logged-in session
  const session = await auth();

  // 2. Check for explicit query parameter (e.g., ?to=user@example.com or ?email=user@example.com)
  const queryParamEmail =
    request.nextUrl.searchParams.get('to') ||
    request.nextUrl.searchParams.get('email');

  // 3. Find the reference user in the database for the check-in token and payload
  let user = null;

  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
  }

  if (!user && queryParamEmail) {
    user = await prisma.user.findFirst({
      where: { email: queryParamEmail },
    });
  }

  if (!user) {
    user = await prisma.user.findFirst();
  }

  if (!user) {
    return NextResponse.json(
      {
        error:
          'Create a user account first in the dashboard before testing emails.',
      },
      { status: 400 }
    );
  }

  // 4. Resolve the recipient email dynamically
  const recipientEmail =
    queryParamEmail ||
    session?.user?.email ||
    user.email ||
    process.env.EMAIL_RECIPIENT;

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return NextResponse.json(
      {
        error:
          'No valid recipient email found. Provide ?to=your@email.com, sign in, or ensure the user has an email in the database.',
      },
      { status: 400 }
    );
  }

  const token = generateCheckInToken(user.id);
  const baseUrl = getBaseUrl();
  const checkInUrl = `${baseUrl}/api/check-in?u=${user.id}&t=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [recipientEmail],
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

    return NextResponse.json({
      success: true,
      recipient: recipientEmail,
      data,
      checkInUrl,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

