export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("email rate") ||
    lower.includes("too many requests")
  ) {
    return (
      "Email sending is rate-limited on this Supabase project (about 2 emails/hour with the built-in mailer). " +
      "For local dev, add SUPABASE_SERVICE_ROLE_KEY to .env.local (Settings → API in Supabase) and restart the dev server so signup skips email. " +
      "Or wait up to an hour, log in if you already signed up, or add a user in the Dashboard with “Auto Confirm User”."
    );
  }
  return message;
}
