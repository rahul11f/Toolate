export const disposableDomains = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'tempmail.com',
  '10minutemail.com',
  'dropmail.me',
  'throwawaymail.com',
  'fakeinbox.com',
  'temp-mail.org',
  'mohmal.com',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
  'trashmail.com',
  'tempmailaddress.com',
  'maildrop.cc',
  'mailcatch.com',
  'generator.email',
  'nada.email',
  'getnada.com',
  'mytrashmail.com',
  'mailnesia.com',
  'yandex.com', // Optional if you strictly want to block free Russian emails often used for spam, but usually just true disposable domains.
]);

/**
 * Validates if an email is not from a known disposable provider.
 * This ensures that the user is registering with a real email address (e.g., Gmail, Yahoo, corporate domains).
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return true;
  
  const domain = email.split('@')[1].toLowerCase();
  
  // Basic disposable check
  if (disposableDomains.has(domain)) {
    return true;
  }
  
  // Advanced keyword-based check for common disposable patterns
  const suspiciousKeywords = ['temp', 'throwaway', 'fake', 'trash', 'disposable', '10minute'];
  for (const keyword of suspiciousKeywords) {
    if (domain.includes(keyword)) {
      return true;
    }
  }

  return false;
}
