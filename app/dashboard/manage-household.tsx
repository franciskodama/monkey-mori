'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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

export function ManageHouseholdClient({
  householdId,
  onLeave,
}: {
  householdId: string;
  onLeave: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='mt-6 border-t border-slate-800/50 pt-4'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors w-full justify-between focus:outline-none'
      >
        Manage Household
        {isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
      </button>

      {isOpen && (
        <div className='mt-6 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200'>
          <div className='bg-slate-950 p-4 rounded-xl border border-slate-800'>
            <Label className='text-md text-slate-500 uppercase tracking-wider mb-2 block'>
              Partner Invite Code
            </Label>
            <div className='flex gap-2'>
              <Input
                readOnly
                value={householdId}
                className='bg-transparent border-slate-800 text-emerald-400 font-mono text-xs focus-visible:ring-0'
              />
            </div>
            <p className='text-sm text-slate-500 mt-2'>
              Send this code to your partner so they can join this household when they log in.
            </p>
          </div>

          <div className='pt-4 border-t border-slate-800/50'>
            <p className='text-xs text-slate-500 mb-3'>
              Need to connect with a different partner or code?
            </p>

            <AlertDialog>
              <AlertDialogTrigger 
                render={
                  <Button
                    variant='outline'
                    className='w-full border-red-900/30 bg-red-950/30 text-red-500 hover:bg-red-950/60 hover:text-red-400 hover:border-red-900/50 h-10 text-xs transition-colors'
                  />
                }
              >
                Disconnect from Household
              </AlertDialogTrigger>
              <AlertDialogContent className='bg-slate-950 border border-slate-800 text-white sm:max-w-md'>
                <AlertDialogHeader>
                  <AlertDialogTitle className='flex items-center gap-2 text-red-500 text-xl'>
                    <AlertTriangle className='w-5 h-5' />
                    Disconnect Household?
                  </AlertDialogTitle>
                  <AlertDialogDescription className='text-slate-400 text-sm mt-2'>
                    Are you sure you want to disconnect from this household? You will no longer be linked to your partner, but you will safely retain all your personal notes, status, and vaults.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className='mt-6 sm:justify-start flex-row-reverse sm:flex-row gap-2'>
                  <AlertDialogAction
                    onClick={() => {
                      onLeave();
                    }}
                    className='w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 focus:ring-red-600'
                  >
                    Yes, Disconnect
                  </AlertDialogAction>
                  <AlertDialogCancel className='w-full sm:w-auto mt-0 border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white'>
                    Cancel
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
