import { BreadcrumbLabel } from '@/components/breadcrumb-label';
import { ContactForm } from '@/components/contact-form';
import { getContact, updateContactAction } from '@/lib/actions/contacts';

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbLabel path={`/contacts/${id}`} label={`${contact.firstName} ${contact.lastName}`} />
      <h1 className="text-xl font-semibold">Edit Contact</h1>
      <ContactForm action={updateContactAction.bind(null, id)} initial={contact} submitLabel="Save Changes" />
    </div>
  );
}
