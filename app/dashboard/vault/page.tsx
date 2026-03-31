import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DeleteButton } from './delete-button';

export default async function VaultPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const noteId = searchParams?.id as string | undefined;
  console.log('---  🚀 ---> | searchParams:', searchParams);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/');
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch the selected note if editing
  const selectedNote =
    noteId && noteId !== 'new' ? notes.find((n) => n.id === noteId) : null;

  // Compute stats or general dashboard info
  const isEditMode = searchParams?.edit === 'true';
  const isCreating = noteId === 'new';
  const isEditing = !!selectedNote && isEditMode;
  const isViewing = !!selectedNote && !isEditMode;

  // -- SERVER ACTIONS --
  async function saveNote(formData: FormData) {
    'use server';
    const authSession = await auth();
    if (!authSession?.user?.id) return;

    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const visibility = formData.get('visibility') as 'SHARED' | 'PRIVATE';

    if (!title || !content) return;

    if (id && id !== 'new') {
      // Safely check ownership before upserting
      const existing = await prisma.note.findUnique({ where: { id } });
      if (existing && existing.userId !== authSession.user.id) return;

      await prisma.note.upsert({
        where: { id },
        update: { title, content, visibility },
        create: {
          id,
          title,
          content,
          visibility: visibility || 'SHARED',
          userId: authSession.user.id,
        },
      });
    } else {
      // Create
      await prisma.note.create({
        data: {
          title,
          content,
          visibility: visibility || 'SHARED',
          userId: authSession.user.id,
        },
      });
    }
    revalidatePath('/dashboard/vault');
    redirect('/dashboard/vault');
  }

  async function deleteNote(formData: FormData) {
    'use server';
    const authSession = await auth();
    if (!authSession?.user?.id) return;
    const id = formData.get('id') as string;
    if (!id) return;

    await prisma.note.deleteMany({
      where: { id, userId: authSession.user.id },
    });
    revalidatePath('/dashboard/vault');
    redirect('/dashboard/vault');
  }

  return (
    <div className='min-h-screen bg-slate-950 text-white p-8 relative overflow-hidden flex flex-col'>
      {/* Background glow effect */}
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none' />

      <div className='max-w-6xl mx-auto w-full relative z-10 flex flex-col md:flex-row gap-8 flex-1'>
        {/* Left pane: Notes List */}
        <div className='w-full md:w-1/3 flex flex-col bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[calc(100vh-4rem)]'>
          <div className='p-6 border-b border-slate-800 flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-white'>Your Vault</h2>
              <p className='text-sm text-slate-400 mt-1'>
                {notes.length} saved notes
              </p>
            </div>
            <Link href='/dashboard'>
              <Button
                variant='ghost'
                size='icon'
                className='text-slate-400 hover:text-white'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
                  <polyline points='9 22 9 12 15 12 15 22'></polyline>
                </svg>
              </Button>
            </Link>
          </div>

          <div className='p-6 flex-1 overflow-y-auto space-y-4'>
            <Link href='/dashboard/vault?id=new'>
              <Button className='w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-md shadow-indigo-900/20'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='mr-2'
                >
                  <line x1='12' y1='5' x2='12' y2='19'></line>
                  <line x1='5' y1='12' x2='19' y2='12'></line>
                </svg>
                Create New Entry
              </Button>
            </Link>

            <div className='mt-6 space-y-3'>
              {notes.length === 0 && (
                <div className='text-center p-8 border border-dashed border-slate-800 rounded-xl'>
                  <p className='text-sm text-slate-500'>Your vault is empty.</p>
                </div>
              )}
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/dashboard/vault?id=${note.id}`}
                  className='block'
                >
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      noteId === note.id
                        ? 'bg-indigo-500/10 border-indigo-500/30'
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
                          note.visibility === 'SHARED'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        {note.visibility}
                      </span>
                      <span className='text-xs text-slate-600'>
                        {note.updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Form Editor */}
        <div className='flex-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl h-[calc(100vh-4rem)] flex flex-col'>
          {isViewing && selectedNote ? (
            <div className='flex-1 flex flex-col overflow-y-auto'>
              <div className='p-8 border-b border-slate-800 flex items-center justify-between'>
                <h2 className='text-2xl font-bold text-white'>
                  {selectedNote.title}
                </h2>
                <Link href={`/dashboard/vault?id=${selectedNote.id}&edit=true`}>
                  <Button
                    variant='outline'
                    className='border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 bg-slate-950/50'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                    Edit Entry
                  </Button>
                </Link>
              </div>
              <div className='p-8 flex-1 flex flex-col gap-6'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      selectedNote.visibility === 'SHARED'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}
                  >
                    {selectedNote.visibility}
                  </span>
                  <span className='text-xs text-slate-500'>
                    Last updated: {selectedNote.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <div className='prose prose-invert max-w-none mt-4'>
                  <p className='whitespace-pre-wrap text-slate-300 leading-relaxed'>{selectedNote.content}</p>
                </div>
              </div>
            </div>
          ) : !isCreating && !isEditing ? (
            <div className='flex-1 flex flex-col items-center justify-center p-8 text-center'>
              <div className='w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-800'>
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
                  <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
                  <line x1='9' y1='9' x2='15' y2='9'></line>
                  <line x1='9' y1='13' x2='15' y2='13'></line>
                  <line x1='9' y1='17' x2='15' y2='17'></line>
                </svg>
              </div>
              <h3 className='text-xl font-medium text-slate-300'>
                Select an entry
              </h3>
              <p className='text-sm text-slate-500 mt-2 max-w-sm'>
                Choose an existing note from the list or create a new one to
                store your important household directions.
              </p>
            </div>
          ) : (
            <div className='flex-1 flex flex-col overflow-y-auto'>
              <div className='p-8 border-b border-slate-800 flex items-center justify-between'>
                <h2 className='text-2xl font-bold text-white'>
                  {isCreating ? 'Create New Entry' : 'Edit Entry'}
                </h2>
                {isEditing && (
                  <form id="delete-note-form" action={deleteNote}>
                    <input type='hidden' name='id' defaultValue={selectedNote?.id} />
                    <DeleteButton />
                  </form>
                )}
              </div>

              <form
                action={saveNote}
                className='p-8 flex-1 flex flex-col gap-6'
              >
                <input
                  type='hidden'
                  name='id'
                  defaultValue={selectedNote?.id || 'new'}
                />

                <div className='space-y-2'>
                  <Label htmlFor='title' className='text-slate-300'>
                    Title
                  </Label>
                  <Input
                    id='title'
                    name='title'
                    required
                    defaultValue={selectedNote?.title || ''}
                    placeholder='e.g. Life Insurance Details, Pet Routine...'
                    className='bg-slate-950 border-slate-800 focus-visible:ring-indigo-500 h-12 text-lg'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='visibility' className='text-slate-300'>
                    Visibility level
                  </Label>
                  <select
                    id='visibility'
                    name='visibility'
                    defaultValue={selectedNote?.visibility || 'SHARED'}
                    className='flex h-12 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500'
                  >
                    <option value='SHARED'>
                      Shared (Visible to partner immediately)
                    </option>
                    <option value='PRIVATE'>
                      Private (Revealed only if switch triggers) - Coming Soon
                    </option>
                  </select>
                </div>

                <div className='space-y-2 flex-1 flex flex-col'>
                  <Label htmlFor='content' className='text-slate-300'>
                    Directions & Details
                  </Label>
                  <Textarea
                    id='content'
                    name='content'
                    required
                    defaultValue={selectedNote?.content || ''}
                    placeholder='Write your detailed instructions here. Take your time, these will be stored securely...'
                    className='bg-slate-950 border-slate-800 focus-visible:ring-indigo-500 flex-1 min-h-[300px] resize-none p-4'
                  />
                </div>

                <div className='pt-4 flex justify-end gap-4'>
                  <Link href={isCreating ? '/dashboard/vault' : `/dashboard/vault?id=${selectedNote?.id}`}>
                    <Button
                      type='button'
                      variant='ghost'
                      className='text-slate-400 hover:text-white'
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type='submit'
                    className='bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]'
                  >
                    Save Entry
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
