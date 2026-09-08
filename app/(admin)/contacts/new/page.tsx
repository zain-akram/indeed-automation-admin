import { ContactForm } from '@/components/contact-form';

export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Contact</h1>
      <ContactForm />
    </div>
  );
}
