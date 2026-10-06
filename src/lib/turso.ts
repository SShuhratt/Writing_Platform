import { createClient, Client } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL || '';
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || '';

/**
 * Checks whether Turso environment variables are configured.
 */
export const isTursoConfigured = (): boolean => {
  return Boolean(
    tursoUrl &&
    (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://')) &&
    tursoAuthToken &&
    tursoAuthToken.length > 10
  );
};

let tursoClientInstance: Client | null = null;

/**
 * Returns a singleton instance of the Turso LibSQL client.
 */
export const getTursoClient = (): Client | null => {
  if (!isTursoConfigured()) {
    return null;
  }

  if (!tursoClientInstance) {
    tursoClientInstance = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
  }

  return tursoClientInstance;
};
