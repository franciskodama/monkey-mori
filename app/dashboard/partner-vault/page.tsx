import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { auth } from '@/auth';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default async function PartnerVaultPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const noteId = searchParams?.id as string | undefined;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser?.householdId) {
    redirect('/dashboard');
  }

  const partner = await prisma.user.findFirst({
    where: {
      householdId: dbUser.householdId,
      id: { not: dbUser.id },
    },
  });

  // If no partner is linked yet or found, we handle it accordingly
  let partnerNotes: Array<{
    id: string;
    title: string;
    content: string;
    visibility: 'SHARED' | 'PRIVATE';
    updatedAt: Date;
  }> = [];

  if (partner) {
    // If partner's switch is triggered, show all notes. Otherwise, only show SHARED notes.
    const isTriggered = partner.switchStatus === 'TRIGGERED';

    const rawPartnerNotes = await prisma.note.findMany({
      where: {
        userId: partner.id,
        ...(isTriggered ? {} : { visibility: 'SHARED' }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Decrypt partner notes for display
    partnerNotes = rawPartnerNotes.map((note) => {
      try {
        return { ...note, content: decrypt(note.content) };
      } catch (e) {
        // Fallback for existing plain text notes or decryption errors
        return note;
      }
    });
  }

  const selectedNote = noteId
    ? partnerNotes.find((n) => n.id === noteId)
    : null;

  return (
    <div className='min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden flex flex-col'>
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none' />
      <div className='max-w-6xl mx-auto w-full relative z-10 flex flex-col md:flex-row gap-8 flex-1'>
        <div className='w-full md:w-1/3 flex flex-col bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[calc(100vh-4rem)]'>
          <div className='p-6 border-b border-slate-800 flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-white truncate'>
                {partner ? `${partner.name}'s Vault` : 'Partner Vault'}
              </h2>
              <p className='text-sm text-slate-400 mt-1'>
                {partnerNotes.length} accessible notes
              </p>
            </div>
            <Link href='/dashboard'>
              <Button
                variant='ghost'
                size='icon'
                className='text-slate-400 hover:text-white'
              >
                <Home />
              </Button>
            </Link>
          </div>

          <div className='p-6 flex-1 overflow-y-auto space-y-4'>
            {!partner ? (
              <div className='text-center p-8 border border-dashed border-slate-800 rounded-xl'>
                <p className='text-sm text-slate-500'>
                  Nobody has joined your household yet. Share your invite code
                  with them!
                </p>
              </div>
            ) : partnerNotes.length === 0 ? (
              <div className='text-center p-8 border border-dashed border-slate-800 rounded-xl'>
                <p className='text-sm text-slate-500'>
                  Your partner hasn't shared any notes with you yet.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {partnerNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/dashboard/partner-vault?id=${note.id}`}
                    className='block'
                  >
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        noteId === note.id
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <h3 className='uppercase font-bold text-slate-200 line-clamp-1'>
                        {note.title}
                      </h3>
                      <p className='text-sm text-slate-500 mt-1 line-clamp-2'>
                        {note.content}
                      </p>
                      <div className='flex items-center gap-2 mt-3'>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            note.visibility === 'PRIVATE'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {note.visibility === 'PRIVATE'
                            ? 'UNLOCKED (TRIGGERED)'
                            : note.visibility}
                        </span>
                        <span className='text-xs text-slate-600'>
                          {note.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: View Note (Read Only) */}
        <div className='flex-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl h-[calc(100vh-4rem)] flex flex-col'>
          {!selectedNote ? (
            <div className='flex-1 flex flex-col items-center justify-center p-8 text-center'>
              <div className='w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-800'>
                {/* <Home className='w-12 h-12' /> */}
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='32'
                  height='32'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='text-slate-700'
                >
                  <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'></path>
                  <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'></path>
                </svg>
              </div>
              <h3 className='text-xl font-medium text-slate-300'>
                Select an entry
              </h3>
              <p className='text-sm text-slate-500 mt-2 max-w-sm'>
                Choose a note from the left to read the detailed instructions
                and information provided by your partner.
              </p>
            </div>
          ) : (
            <div className='flex-1 flex flex-col overflow-y-auto p-8'>
              <div className='border-b border-slate-800 pb-6 mb-6 flex flex-col gap-2'>
                <div className='flex items-center gap-3'>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      selectedNote.visibility === 'PRIVATE'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {selectedNote.visibility}
                  </span>
                  <span className='text-sm text-slate-500'>
                    Last updated: {selectedNote.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <h2 className='text-3xl font-bold text-white mt-2'>
                  {selectedNote.title}
                </h2>
              </div>

              <div className='flex-1 text-lg text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50'>
                {selectedNote.content}
              </div>

              <div className='pt-6 flex justify-end gap-4'>
                <Link href='/dashboard/partner-vault'>
                  <Button
                    type='button'
                    variant='ghost'
                    className='text-slate-400 hover:text-white'
                  >
                    Close Entry
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
