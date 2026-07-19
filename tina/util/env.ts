/**
 * Throws one combined error listing every missing var, instead of letting
 * the first `undefined` reach a downstream library as a cryptic failure.
 */
export function requireEnv<Name extends string>(
  names: readonly Name[]
): Record<Name, string> {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `For local development, set TINA_PUBLIC_IS_LOCAL=true instead ` +
        `(no credentials needed). For a production-style build/deploy, ` +
        `provide all of: ${names.join(", ")}.`
    );
  }
  return Object.fromEntries(
    names.map((name) => [name, process.env[name] as string])
  ) as Record<Name, string>;
}
