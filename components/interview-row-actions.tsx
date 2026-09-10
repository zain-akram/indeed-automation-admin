'use client';

import { MessageSquareTextIcon, MoreHorizontalIcon, SendIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { resendSubmissionAction } from '@/lib/actions/submissions';

interface InterviewRowActionsProps {
  submissionId: string;
  message: string;
  title: string;
}

export function InterviewRowActions({ submissionId, message, title }: InterviewRowActionsProps) {
  const [pending, startTransition] = useTransition();
  const [messageOpen, setMessageOpen] = useState(false);

  function handleResend() {
    startTransition(async () => {
      const result = await resendSubmissionAction(submissionId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.submission?.status === 'sent') {
        toast.success('Message resent');
      } else {
        toast.error(result.submission?.errorMessage ?? 'Message failed to send');
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />} disabled={pending}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setMessageOpen(true)}>
            <MessageSquareTextIcon />
            View Message
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResend}>
            <SendIcon />
            {pending ? 'Resending…' : 'Resend'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-left text-sm whitespace-pre-wrap text-foreground">
              {message}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
