import crypto from 'crypto';

export function generateCheckInToken(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not defined');
  }

  // Create a fast, stateless HMAC hash tied uniquely to this User ID
  return crypto.createHmac('sha256', secret).update(userId).digest('hex');
}
