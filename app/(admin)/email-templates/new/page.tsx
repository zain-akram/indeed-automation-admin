import { EmailTemplateForm } from '@/components/email-template-form';
import { createEmailTemplateAction } from '@/lib/actions/email-templates';

export default function NewEmailTemplatePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Email Template</h1>
      <EmailTemplateForm action={createEmailTemplateAction} submitLabel="Create Template" />
    </div>
  );
}
