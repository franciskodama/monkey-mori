import Image from 'next/image';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db';
import { auth, signOut } from '@/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Server, Heart, HouseHeart, Fingerprint } from 'lucide-react';
import { ManageHouseholdClient } from './manage-household';

function getStatusConfig(status: string | undefined, lastCheckInAt: Date | null) {
  if (status === 'TRIGGERED') {
    return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      dot: 'bg-red-500',
      shadow: 'shadow-[0_0_10px_0_var(--color-red-500)]',
      text: 'text-red-400',
      label: 'Vault Unlocked',
      pulse: 'animate-pulse'
    };
  }

  const daysSince = lastCheckInAt 
    ? Math.floor((Date.now() - lastCheckInAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (status === 'REMINDER_1' || status === 'REMINDER_2' || daysSince > 30) {
    return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      dot: 'bg-amber-500',
      shadow: 'shadow-[0_0_10px_0_var(--color-amber-500)]',
      text: 'text-amber-400',
      label: 'Action Required',
      pulse: 'animate-pulse'
    };
  }

  return {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
    shadow: 'shadow-[0_0_10px_0_var(--color-emerald-500)]',
    text: 'text-emerald-400',
    label: 'All Good',
    pulse: 'animate-pulse'
  };
}

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { household: true },
  });

  if (!dbUser) {
    redirect('/');
  }

  // --- AUTO CHECK-IN ---
  // If the user hasn't checked in for over 24 hours, or isn't ACTIVE, count this dashboard visit as a check-in!
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (
    !dbUser.lastCheckInAt ||
    dbUser.lastCheckInAt < oneDayAgo ||
    dbUser.switchStatus !== 'ACTIVE'
  ) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        lastCheckInAt: new Date(),
        switchStatus: 'ACTIVE', // Reset any warnings/triggers because they are clearly alive
      },
    });

    // Optimistically update the UI to show the reset immediately
    dbUser.lastCheckInAt = new Date();
    dbUser.switchStatus = 'ACTIVE';
  }

  let partner = null;
  if (dbUser.householdId) {
    partner = await prisma.user.findFirst({
      where: {
        householdId: dbUser.householdId,
        id: { not: dbUser.id },
      },
    });
  }

  const firstName = dbUser.name?.split(' ')[0];

  async function createHousehold(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    if (!name || name.trim() === '') return;

    await prisma.household.create({
      data: {
        name,
        users: {
          connect: { id: session!.user!.id },
        },
      },
    });

    revalidatePath('/dashboard');
  }

  async function joinHousehold(formData: FormData) {
    'use server';
    const inviteCode = formData.get('inviteCode') as string;
    if (!inviteCode || inviteCode.trim() === '') return;

    try {
      await prisma.user.update({
        where: { id: session!.user!.id },
        data: { householdId: inviteCode },
      });
      revalidatePath('/dashboard');
    } catch (e) {
      console.error('Invalid invite code');
    }
  }

  async function leaveHousehold() {
    'use server';
    await prisma.user.update({
      where: { id: session!.user!.id },
      data: { householdId: null },
    });
    revalidatePath('/dashboard');
  }

  // --- ONBOARDING VIEW ---
  if (!dbUser.householdId) {
    return (
      <div className='min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden'>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none' />

        <div className='max-w-md w-full z-10'>
          <div className='bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl mb-8'>
            <h1 className='text-2xl font-bold mb-2'>Welcome, {firstName}!</h1>
            <p className='text-slate-400 mb-8 leading-relaxed'>
              Before we begin, you need to set up your Household. This is how
              you and your partner will be securely linked together.
            </p>

            <form action={createHousehold} className='space-y-4 mb-8'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-slate-300'>
                  Create a New Household
                </Label>
                <Input
                  id='name'
                  name='name'
                  required
                  placeholder='e.g. The Kennedys'
                  className='bg-slate-950 border-slate-800 focus-visible:ring-emerald-500 h-12'
                />
              </div>
              <Button
                type='submit'
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12'
              >
                Create Household
              </Button>
            </form>

            <div className='relative mb-8'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-slate-800' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-slate-900 px-2 text-slate-500'>
                  or join an existing one
                </span>
              </div>
            </div>

            <form action={joinHousehold} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='inviteCode' className='text-slate-300'>
                  Have an invite code?
                </Label>
                <Input
                  id='inviteCode'
                  name='inviteCode'
                  required
                  placeholder="Paste your partner's code here"
                  className='bg-slate-950 border-slate-800 focus-visible:ring-indigo-500 h-12'
                />
              </div>
              <Button
                type='submit'
                variant='outline'
                className='w-full border-slate-800 hover:bg-slate-800 h-12 text-slate-300'
              >
                Join Household
              </Button>
            </form>
          </div>

          <div className='text-center'>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <Button
                type='submit'
                variant='ghost'
                className='text-xs text-slate-800 hover:text-white'
              >
                Log Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const myStatus = getStatusConfig(dbUser.switchStatus, dbUser.lastCheckInAt);
  const partnerStatus = partner ? getStatusConfig(partner.switchStatus, partner.lastCheckInAt) : null;

  // --- STANDARD DASHBOARD VIEW ---
  return (
    <div className='min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden'>
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none' />

      <div className='max-w-4xl mx-auto relative z-10 flex items-center justify-between border-b border-slate-800 pb-8 mb-8 mt-4'>
        <div className='flex items-center gap-4'>
          <Image
            src='/logo/monkey-mori-300x300.png'
            alt='Monkey Mori Logo'
            width={100}
            height={100}
            className='object-cover'
          />
          <div>
            <h1 className='text-3xl font-bold tracking-tight mb-2'>
              Household Dashboard
            </h1>
            <p className='text-slate-400'>Welcome back, {firstName}! 🙌</p>
          </div>
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <Button
            type='submit'
            variant='outline'
            className='border-slate-800 text-slate-800 text-xs hover:text-white hover:bg-slate-900'
          >
            Log Out
          </Button>
        </form>
      </div>

      <div className='max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10'>
        <div className='bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl'>
          <h2 className='text-xl font-semibold mb-2 text-white flex items-center gap-2'>
            <Clock className='text-indigo-400 w-5 h-5' />
            Switch Status
          </h2>
          <p className='text-slate-400 mb-6 text-sm'>
            Your dead man's switch is active.
          </p>

          <div className={`flex items-center justify-between p-4 ${myStatus.bg} border ${myStatus.border} rounded-xl mb-4 transition-colors`}>
            <div>
              <p className={`font-md ${myStatus.text}`}>Your Status: {myStatus.label}</p>
              <p className='text-sm text-slate-400 mt-1'>
                Last check-in: {dbUser.lastCheckInAt ? dbUser.lastCheckInAt.toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${myStatus.dot} ${myStatus.pulse} ${myStatus.shadow}`} />
          </div>

          {partner && partnerStatus && (
            <div className={`flex items-center justify-between p-4 ${partnerStatus.bg} border ${partnerStatus.border} rounded-xl transition-colors`}>
              <div>
                <p className={`font-md ${partnerStatus.text}`}>
                  {partner.name?.split(' ')[0] || 'Partner'}'s Status: {partnerStatus.label}
                </p>
                <p className='text-sm text-slate-400 mt-1'>
                  Last check-in: {partner.lastCheckInAt ? partner.lastCheckInAt.toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${partnerStatus.dot} ${partnerStatus.pulse} ${partnerStatus.shadow}`}
              />
            </div>
          )}
        </div>

        <div className='bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl min-w-0'>
          <h2 className='text-xl font-semibold mb-2 text-white flex items-center gap-2'>
            <HouseHeart className='text-emerald-500 w-5 h-5 shrink-0' />
            <span className='truncate'>{dbUser.household?.name}</span>
          </h2>
          <p className='text-slate-400 mb-6 text-sm'>
            You are linked to this household.
          </p>

          <ManageHouseholdClient
            householdId={dbUser.household?.id || ''}
            onLeave={leaveHousehold}
          />
        </div>
      </div>

      <div className='max-w-4xl mx-auto mt-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8'>
        <div className='bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between gap-6'>
          <div>
            <h2 className='text-xl font-semibold mb-2 text-white flex items-center gap-2'>
              <Fingerprint className='text-indigo-400 w-5 h-5' />
              Your Secret Vault
            </h2>
            <p className='text-slate-400 text-sm'>
              Store your essential directions, emergency contacts, financial
              details, and instructions here.
            </p>
          </div>

          <a href='/dashboard/vault' className='w-full'>
            <Button className='w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-md shadow-indigo-900/20'>
              Manage Your Vault
            </Button>
          </a>
        </div>

        <div className='bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none' />
          <div className='relative z-10'>
            <h2 className='text-xl font-semibold mb-2 text-white flex items-center gap-2'>
              <Heart className='text-emerald-400 w-5 h-5' />
              Partner Vault
            </h2>
            <p className='text-slate-400 text-sm'>
              View the notes your partner has shared with you, and automatically
              access their private directions if their switch is triggered.
            </p>
          </div>

          <a href='/dashboard/partner-vault' className='w-full relative z-10'>
            <Button
              variant='outline'
              className='w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-12 bg-slate-950'
            >
              Access Partner Vault
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
