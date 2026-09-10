import { BreadcrumbLabel } from '@/components/breadcrumb-label';
import { EmailTemplateForm } from '@/components/email-template-form';
import { getEmailTemplate, updateEmailTemplateAction } from '@/lib/actions/email-templates';

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getEmailTemplate(id);

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbLabel path={`/email-templates/${id}`} label={template.label} />
      <h1 className="text-xl font-semibold">Edit Email Template</h1>
      <EmailTemplateForm
        action={updateEmailTemplateAction.bind(null, id)}
        initial={template}
        submitLabel="Save Changes"
      />
    </div>
  );
}
