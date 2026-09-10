export interface Job {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
  indeedJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  email?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface TemplateDef {
  key: string;
  label: string;
  language: string;
  body: string;
  /** Raw parameter names/positions from the approved WhatsApp template body, e.g. ["name", "role_name"] or ["1", "2"]. */
  variables: string[];
  status?: string;
  category?: string;
}

export type SubmissionStatus = 'sent' | 'failed' | 'skipped';

export interface Submission {
  _id: string;
  job: string;
  contact: string;
  templateKey?: string;
  variables: Record<string, string>;
  renderedMessage?: string;
  status: SubmissionStatus;
  whatsappMessageId?: string;
  errorMessage?: string;
  whatsappAccountId?: string;
  emailStatus?: SubmissionStatus;
  emailMessageId?: string;
  emailError?: string;
  emailTemplateId?: string;
  emailDeliveredAt?: string;
  emailOpenedAt?: string;
  emailClickedAt?: string;
  emailBouncedAt?: string;
  emailComplainedAt?: string;
  indeedSubmissionUuid?: string;
  resumeUrl?: string;
  appliedAt?: string;
  milestone?: string;
  interestLevel?: string;
  createdAt: string;
}

export interface CreateSubmissionResult {
  duplicate: boolean;
  existingSubmissions?: Submission[];
  submission?: Submission;
  error?: string;
}

export interface PopulatedSubmission extends Omit<
  Submission,
  'job' | 'contact' | 'whatsappAccountId' | 'emailTemplateId'
> {
  job: Job | null;
  contact: Contact | null;
  whatsappAccountId?: WhatsappAccount | null;
  emailTemplateId?: EmailTemplate | null;
}

export type PopulatedEmailSubmission = PopulatedSubmission;

export interface Setting {
  _id: string;
  defaultInterviewLink: string;
  defaultJobId: string;
  geminiApiKey: string;
  resendApiKey: string;
  resendWebhookSecret: string;
  emailFromAddress: string;
  emailFromName: string;
  defaultReplyTo: string;
  defaultEmailWhatsappNumber: string;
  defaultDeliveryChannel: DeliveryChannel;
}

export type DeliveryChannel = 'whatsapp' | 'email' | 'both';

export interface EmailTemplate {
  _id: string;
  label: string;
  description?: string;
  subject: string;
  body: string;
  replyTo?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

export interface WhatsappAccount {
  _id: string;
  label: string;
  whatsappBusinessId: string;
  whatsappPhoneNumberId: string;
  whatsappApiToken: string;
  isActive: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  defaultTemplateKey?: string;
  messagingLimitTier?: string;
  messagingLimitCap?: number;
  templates?: TemplateDef[];
  templatesSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFile {
  _id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  url: string;
}
