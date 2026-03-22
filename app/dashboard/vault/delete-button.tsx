'use client';

import { Button } from '@/components/ui/button';

export function DeleteButton() {
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
      onClick={(e) => {
        if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
          e.preventDefault();
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2"
      >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      Delete
    </Button>
  );
}
