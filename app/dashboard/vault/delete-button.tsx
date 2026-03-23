'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DeleteButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='mr-2'
            >
              <polyline points='3 6 5 6 21 6'></polyline>
              <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>
            </svg>
            Delete
          </Button>
        }
      />
      <AlertDialogContent className='bg-slate-950 text-white border border-slate-200'>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className='text-slate-400'>
            This action cannot be undone. This will permanently delete your
            entry from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='bg-slate-950'>
          <AlertDialogCancel className='border-slate-800 text-slate-800 hover:bg-slate-900 hover:text-white'>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className='bg-red-600 hover:bg-red-700 text-white'
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById(
                'delete-note-form'
              ) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
