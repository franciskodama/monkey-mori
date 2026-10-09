import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Monkey Mori <onboarding@resend.dev>';

export function getBaseUrl(): string {
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}
