export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey || secretKey === 'your_recaptcha_secret_key') {
    console.warn('RECAPTCHA_SECRET_KEY is not defined or is placeholder. Skipping verification.');
    return true; // Bypass verification if secret key is omitted in development
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    // Check if verification succeeded and the score is high enough (>= 0.5)
    return !!(data.success && (data.score === undefined || data.score >= 0.5));
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    return false;
  }
}
