import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCheckInToken } from '@/lib/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('u');
  const token = searchParams.get('t');

  if (!userId || !token) {
    return NextResponse.json(
      { error: 'Missing security parameters' },
      { status: 400 }
    );
  }

  // 1. Verify token authenticity
  const expectedToken = generateCheckInToken(userId);
  if (token !== expectedToken) {
    return NextResponse.json(
      { error: 'Invalid or forged check-in token' },
      { status: 403 }
    );
  }

  try {
    // 2. Update the user's database record
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastCheckInAt: new Date(),
        switchStatus: 'ACTIVE', // Reset any ongoing escalations
      },
    });

    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Check-In Successful</title>
          <style>
            body {
              background: #020617; /* slate-950 */
              color: #f8fafc; /* slate-50 */
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              text-align: center;
              border: 1px solid #1e293b; /* slate-800 */
              padding: 3rem;
              border-radius: 1.5rem;
              background: #0f172a; /* slate-900 */
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              max-width: 450px;
              width: 100%;
            }
            h1 {
              color: #34d399; /* emerald-400 */
              font-size: 2rem;
              margin-top: 0;
              margin-bottom: 1rem;
            }
            p {
              color: #94a3b8; /* slate-400 */
              line-height: 1.6;
              margin: 0 auto;
            }
            .btn-primary {
              display: block;
              margin-top: 1.25rem;
              padding: 0.875rem 2rem;
              background: #10b981; /* emerald-500 */
              color: #020617;
              text-decoration: none;
              border-radius: 0.5rem;
              font-weight: 600;
              transition: background 0.2s, transform 0.1s;
              text-align: center;
            }
            .btn-primary:hover {
              background: #059669; /* emerald-600 */
              transform: translateY(-1px);
            }
            .link-secondary {
              display: inline-block;
              margin-top: 1.5rem;
              color: #64748b;
              font-size: 0.9rem;
              text-decoration: none;
              transition: color 0.2s;
            }
            .link-secondary:hover {
              color: #94a3b8;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="/logo/monkey-mori-300x300.png" alt="Monkey Mori Logo" style="width: 80px; height: 80px; border-radius: 16px; margin: 0 auto 1.5rem; display: block; object-fit: cover;" />
            <h1>Monkey Mori<br />Check-in Saved</h1>
            <br /> 
           
            <p style="margin-bottom: 2rem; width: 80%; margin-bottom: 2rem;">
              Your dead man's switch timer has been successfully reset. 
              Your private vault remains securely locked and safe.
            </p>
            <p style="margin-bottom: 4rem; text-align: center; font-size: 3rem;">
            ✅
            </p>
            <div style="padding: 1.5rem; border-radius: 1rem; background: rgba(52, 211, 153, 0.05); border: 1px dashed rgba(52, 211, 153, 0.3); text-align: left;">
              <h2 style="color: #34d399; font-size: 1.1rem; margin-top: 0; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                💡 Time for a quick update?
              </h2>
              <p style="font-size: 0.95rem; margin: 0; line-height: 1.5; color: #94a3b8;">
                Did you open a new bank account, get a new credit card, or change an important password recently? Secure them now!
              </p>
              
              <a href="/dashboard/vault" class="btn-primary">
                Review & Update My Vault
              </a>
            </div>

            <a href="/dashboard" class="link-secondary">
              No thanks, just take me to the Dashboard
            </a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(successHtml, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
