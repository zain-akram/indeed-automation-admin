'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resendSubmissionAction } from '@/lib/actions/submissions';

export function ResendSubmissionButton({ submissionId }: { submissionId: string }) {
  const [pending, startTransition] = useTransition();

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
    <Button type="button" variant="outline" size="sm" onClick={handleResend} disabled={pending}>
      {pending ? 'Resending…' : 'Resend'}
    </Button>
  );
}
