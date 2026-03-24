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

    // 3. Render a clean HTML success page directly from the Edge
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
            }
            h1 {
              color: #34d399; /* emerald-400 */
              font-size: 2rem;
              margin-top: 0;
              margin-bottom: 1rem;
            }
            p {
              color: #94a3b8; /* slate-400 */
              max-width: 400px;
              line-height: 1.6;
              margin: 0 auto;
            }
            a {
              display: inline-block;
              margin-top: 2.5rem;
              padding: 0.875rem 2rem;
              background: #4f46e5; /* indigo-600 */
              color: white;
              text-decoration: none;
              border-radius: 0.5rem;
              font-weight: 500;
              transition: background 0.2s;
            }
            a:hover {
              background: #4338ca; /* indigo-700 */
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="/logo/monkey-mori-300x300.png" alt="Monkey Mori Logo" style="width: 80px; height: 80px; border-radius: 16px; margin: 0 auto 1.5rem; display: block; object-fit: cover;" />
            <h1>Monkey Mori<br />✅ Check-in Saved</h1>
            <p>
              Your dead man's switch timer has been successfully reset. 
              Your private vault remains securely locked and safe.
            </p>
            <a href="/dashboard">
              Go to Dashboard
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
