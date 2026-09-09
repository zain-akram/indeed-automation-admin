export interface Job {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  notes?: string;
  createdAt: string;
}

export type TemplateVariableSource = 'contact' | 'job' | 'manual';

export interface TemplateVariableDef {
  name: string;
  label: string;
  source: TemplateVariableSource;
}

export interface TemplateDef {
  key: string;
  label: string;
  language: string;
  body: string;
  variables: TemplateVariableDef[];
}

export type SubmissionStatus = 'sent' | 'failed';

export interface Submission {
  _id: string;
  job: string;
  contact: string;
  templateKey: string;
  variables: Record<string, string>;
  renderedMessage: string;
  status: SubmissionStatus;
  whatsappMessageId?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface CreateSubmissionResult {
  duplicate: boolean;
  existingSubmissions?: Submission[];
  submission?: Submission;
}

export interface PopulatedSubmission extends Omit<Submission, 'job' | 'contact'> {
  job: Job | null;
  contact: Contact | null;
}

export interface Setting {
  _id: string;
  defaultInterviewLink: string;
  whatsappBusinessId: string;
  whatsappPhoneNumberId: string;
  whatsappApiToken: string;
  geminiApiKey: string;
}

export interface ContactFile {
  _id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  url: string;
}
