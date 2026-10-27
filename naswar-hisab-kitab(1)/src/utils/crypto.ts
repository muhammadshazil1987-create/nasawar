/**
 * Generates a SHA-256 hash of a string using Web Crypto API
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a candidate PIN against stored SHA-256 hash
 */
export async function verifyPin(candidatePin: string, storedHash: string): Promise<boolean> {
  if (!candidatePin || !storedHash) return false;
  const candidateHash = await hashPin(candidatePin);
  return candidateHash === storedHash;
}
