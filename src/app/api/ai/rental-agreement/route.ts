import { NextResponse } from 'next/server';
import { queryClaude } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const {
      landlordName,
      landlordPhone,
      landlordAddress,
      tenantName,
      tenantPhone,
      tenantAddress,
      propertyAddress,
      rentAmount,
      depositAmount,
      leaseDuration,
      startDate,
      noticePeriod,
      paymentDueDay,
      specialConditions,
    } = await req.json();

    if (
      !landlordName ||
      !tenantName ||
      !propertyAddress ||
      !rentAmount ||
      !depositAmount ||
      !leaseDuration ||
      !startDate
    ) {
      return NextResponse.json(
        { error: 'Required fields are missing.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a legal assistant specializing in rental agreements and contracts in India. 
Generate a professional, legally binding rental agreement document based on the details provided.
The agreement must follow standard legal draft conventions and include clauses for rent, security deposit, maintenance, termination, notice period, and governing law.
Do not output markdown code blocks like \`\`\` or \`\`\`text. Return the agreement directly as plain text formatted with clean headings, numbering, and paragraph breaks.`;

    const prompt = `Please generate a rental agreement with the following details:
- Landlord: ${landlordName} (Phone: ${landlordPhone || 'N/A'}, Address: ${landlordAddress || 'N/A'})
- Tenant: ${tenantName} (Phone: ${tenantPhone || 'N/A'}, Address: ${tenantAddress || 'N/A'})
- Property Leased: ${propertyAddress}
- Rent: ₹${rentAmount} per month, payable by the ${paymentDueDay || '5th'} day of each calendar month.
- Security Deposit: ₹${depositAmount} (refundable upon termination)
- Lease Term: ${leaseDuration} months starting from ${startDate}
- Notice Period: ${noticePeriod || '1'} month(s)
- Special Conditions: ${specialConditions || 'None specified'}
- Governing Law: State laws of the state where the property is located.

Include standard legal boilerplate clauses such as:
1. Rent payment terms and late fees.
2. Security deposit refund terms and deductions for damage.
3. Property maintenance and repair responsibilities.
4. Prohibition of subletting.
5. Inspection rights of the landlord.
6. Termination terms.
Ensure the tone is formal, legal, and clearly structures the duties of the Tenant and Landlord.`;

    // High quality mock response in case Claude API key is absent
    const mockResponse = `RENTAL AGREEMENT

This Rental Agreement (the "Agreement") is entered into and made effective as of ${startDate}, by and between:

LANDLORD:
${landlordName}
Residing at: ${landlordAddress || 'N/A'}
Contact Phone: ${landlordPhone || 'N/A'}
(Hereinafter referred to as the "Landlord", which expression shall unless repugnant to the context mean and include their heirs, executors, administrators, and assigns)

AND

TENANT:
${tenantName}
Residing at: ${tenantAddress || 'N/A'}
Contact Phone: ${tenantPhone || 'N/A'}
(Hereinafter referred to as the "Tenant", which expression shall unless repugnant to the context mean and include their heirs, executors, administrators, and permitted assigns)

WHEREAS, the Landlord is the absolute owner of the residential property situated at:
${propertyAddress}
(Hereinafter referred to as the "Premises")

AND WHEREAS, the Tenant has requested the Landlord to let out the Premises on rent, and the Landlord has agreed to lease the Premises to the Tenant for residential purposes only under the following mutually agreed terms:

1. LEASE TERM
The lease shall be for a fixed term of ${leaseDuration} months commencing from ${startDate}. Upon completion of the said lease term, this Agreement may be renewed only upon mutual written consent of both parties under newly negotiated terms.

2. RENT AND OTHER CHARGES
The Tenant agrees to pay the Landlord a monthly rent of ₹${rentAmount} (Rupees ${numberToWords(Number(rentAmount))} Only). The rent shall be paid in advance on or before the ${paymentDueDay || '5th'} day of each English calendar month. 

3. SECURITY DEPOSIT
The Tenant has deposited with the Landlord a interest-free security deposit of ₹${depositAmount} (Rupees ${numberToWords(Number(depositAmount))} Only). This deposit shall be refunded by the Landlord to the Tenant at the time of vacating and handing over peaceful possession of the Premises, subject to deductions for any unpaid rent, utility bills, or repairs for damages beyond normal wear and tear.

4. NOTICE PERIOD AND TERMINATION
During the lease term, either party may terminate this Agreement by giving ${noticePeriod || '1'} month(s) advance written notice to the other party. If the Tenant vacates the Premises without giving the stipulated notice, they shall forfeit rent in lieu of the notice period.

5. MAINTENANCE AND REPAIRS
- The Tenant shall keep the interior of the Premises in a clean, hygienic, and good tenantable condition.
- Major structural repairs shall be borne by the Landlord.
- Day-to-day minor maintenance and repairs (such as electrical bulb replacements, tap washer fixes, etc.) shall be the sole responsibility of the Tenant.
- The Tenant shall not make any major structural changes, alterations, or additions to the Premises without prior written permission from the Landlord.

6. SUBLETTING
The Tenant shall not sublet, assign, or transfer the Premises, in whole or in part, to any third party under any circumstances.

7. COVENANTS AND RULES
- The Tenant shall use the Premises strictly for residential purposes.
- The Tenant shall comply with all rules and bylaws of the Resident Welfare Association (RWA) or building society.
- The Tenant shall pay the electricity, water, and gas charges directly to the respective authorities in a timely manner.
- Special Conditions: ${specialConditions || 'None specified'}

8. LANDLORD'S RIGHT OF ENTRY
The Landlord or their authorized agent shall have the right to enter the Premises at reasonable times and upon prior reasonable notification to the Tenant to inspect the condition of the Premises or to exhibit the Premises to prospective tenants or purchasers.

9. GOVERNING LAW
This Agreement shall be governed by, interpreted, and enforced in accordance with the laws of India. Any disputes arising out of this Agreement shall be subject to the exclusive jurisdiction of the local courts.

IN WITNESS WHEREOF, the Landlord and Tenant have signed and executed this Agreement on the day, month, and year first written above.


___________________________                    ___________________________
Landlord: ${landlordName}                      Tenant: ${tenantName}


Witness 1: __________________                  Witness 2: __________________`;

    const agreementText = await queryClaude(prompt, systemPrompt, mockResponse);

    return NextResponse.json({ agreementText });
  } catch (error: any) {
    console.error('Rental Agreement API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate agreement.' },
      { status: 500 }
    );
  }
}

// Simple helper to convert number to words for Indian Rupees
function numberToWords(num: number): string {
  if (isNaN(num)) return '';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const g = ['', 'Thousand', 'Lakh', 'Crore'];

  const makeGroup = (n: number) => {
    let s = '';
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += a[n] + ' ';
    }
    return s.trim();
  };

  if (num === 0) return 'Zero';

  let word = '';
  // Handle Indian numbering format (Lakhs, Crores)
  const parts = [];
  
  // Crore (1,00,00,000)
  if (num >= 10000000) {
    parts.push({ val: Math.floor(num / 10000000), unit: 'Crore' });
    num %= 10000000;
  }
  // Lakh (1,00,00)
  if (num >= 100000) {
    parts.push({ val: Math.floor(num / 100000), unit: 'Lakh' });
    num %= 100000;
  }
  // Thousand (1,000)
  if (num >= 1000) {
    parts.push({ val: Math.floor(num / 1000), unit: 'Thousand' });
    num %= 1000;
  }
  // Hundreds & units
  if (num > 0) {
    parts.push({ val: num, unit: '' });
  }

  for (let i = 0; i < parts.length; i++) {
    const chunk = makeGroup(parts[i].val);
    if (chunk) {
      word += chunk + ' ' + parts[i].unit + ' ';
    }
  }

  return word.trim();
}
