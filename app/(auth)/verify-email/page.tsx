import { VerifyEmailForm } from "./verify-email-form";

/**
 * The address is passed in the query string (`?email=`) so the copy survives a
 * reload. Reading it on the server keeps the address in the first paint.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  return <VerifyEmailForm email={email?.trim() ?? ""} />;
}
