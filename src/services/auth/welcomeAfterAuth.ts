import { sendWelcomeEmail } from '@/services/email/sendWelcomeEmail';
import type { AppProfile } from '@/storage/appProfile';

export async function sendWelcomeAfterAuth(profile: AppProfile | null | undefined) {
  if (!profile?.contact || !profile.updatesOptIn || profile.provider === 'guest') return;
  await sendWelcomeEmail(profile);
}
