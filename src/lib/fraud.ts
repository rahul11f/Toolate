import { queryClaude } from './claude';

export interface FraudCheckResult {
  isSuspicious: boolean;
  confidence: number;
  flags: string[];
}

export async function detectFraud(
  title: string,
  description: string,
  price: number,
  contactNumber: string
): Promise<FraudCheckResult> {
  const textToAnalyze = `${title || ''} ${description || ''}`.toLowerCase();
  const fraudFlags: string[] = [];
  let fraudScore = 0;

  // 1. Heuristic Scan
  if (textToAnalyze.includes('pay first') || textToAnalyze.includes('transfer first') || textToAnalyze.includes('deposit before visit') || textToAnalyze.includes('advance booking fee')) {
    fraudFlags.push('Requires advance deposit before visiting the property');
    fraudScore += 45;
  }

  if (textToAnalyze.includes('army') || textToAnalyze.includes('military') || textToAnalyze.includes('officer transfer') || textToAnalyze.includes('government job transfer') || textToAnalyze.includes('cisf') || textToAnalyze.includes('bsf')) {
    fraudFlags.push('Uses suspicious military/government transfer urgency excuses');
    fraudScore += 40;
  }

  if (textToAnalyze.includes('gpay code') || textToAnalyze.includes('qr code scan deposit') || textToAnalyze.includes('whatsapp deposit')) {
    fraudFlags.push('Asks for unconventional booking deposits via QR codes');
    fraudScore += 25;
  }

  if (price > 0 && price < 4000 && (textToAnalyze.includes('luxury') || textToAnalyze.includes('fully furnished') || textToAnalyze.includes('2 bhk') || textToAnalyze.includes('3 bhk'))) {
    fraudFlags.push('Rent price is unrealistically low for the size/furnishing');
    fraudScore += 30;
  }

  if (textToAnalyze.includes('urgent booking') || textToAnalyze.includes('immediate deposit') || textToAnalyze.includes('block the flat today')) {
    fraudFlags.push('Uses high-pressure tactics to force immediate deposit');
    fraudScore += 15;
  }

  fraudScore = Math.min(fraudScore, 99);

  // 2. Claude AI Scan
  const systemPrompt = `You are an online safety investigator specializing in Indian rental property scams.
Analyze the listing details and evaluate if it shows signs of common online rental scams (such as requesting deposits before visit, claiming to be an army officer transferring out, rent too cheap for the described property, high pressure urgency).
Return ONLY a valid JSON object matching this structure:
{
  "isSuspicious": boolean,
  "confidence": number (0 to 100),
  "flags": string[] (max 4 flags)
}`;

  const prompt = `Analyze listing:
Title: "${title}"
Price: ₹${price}/month
Contact: ${contactNumber || 'N/A'}
Description:
"${description}"`;

  const defaultMockResponse = JSON.stringify({
    isSuspicious: fraudScore >= 40,
    confidence: fraudScore,
    flags: fraudFlags,
  });

  const aiText = await queryClaude(prompt, systemPrompt, defaultMockResponse);

  try {
    const parsed = JSON.parse(aiText.trim());
    return {
      isSuspicious: !!parsed.isSuspicious,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : fraudScore,
      flags: Array.isArray(parsed.flags) ? parsed.flags : fraudFlags,
    };
  } catch (e) {
    console.warn('Failed to parse AI fraud evaluation response, using heuristics:', aiText);
    return {
      isSuspicious: fraudScore >= 40,
      confidence: fraudScore,
      flags: fraudFlags,
    };
  }
}
