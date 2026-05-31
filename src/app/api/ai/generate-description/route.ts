import { NextRequest, NextResponse } from 'next/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { title, category, price, city, area, amenities, roommateGender, roommateType } = await req.json();

    const systemPrompt = `You are a professional real estate copywriter. Write a compelling, detailed, and attractive listing description for a rental platform. 
Keep the tone premium, warm, and inviting. Highlight key details like location, price, and amenities. Keep the response to 2 paragraphs (max 150 words). 
Only output the description itself. Do not include introductory text like "Here is your description" or any quotes.`;

    const prompt = `Write a description for:
Title: "${title || 'Cozy Home'}"
Category: "${category || 'Flat'}"
Rent: "₹${price || 'N/A'}/month"
Location: "${area || ''}, ${city || ''}"
Amenities: "${amenities ? (Array.isArray(amenities) ? amenities.join(', ') : amenities) : 'None specified'}"
${category === 'ROOMMATE' ? `Roommate Type: ${roommateType === 'HAVE_ROOM' ? 'Has a room, looking for a roommate' : 'Needs a room, looking for a flatmate'}\nGender Preference: ${roommateGender || 'Any'}` : ''}`;

    const mockResponse = `Welcome to this premium ${category?.toLowerCase() || 'property'} located in the prime area of ${area || 'Local Area'}, ${city || 'City'}. Priced at a competitive rate of ₹${(price || 15000).toLocaleString('en-IN')}/month, this listing is perfect for anyone seeking comfort and convenience. The property features a spacious layout with excellent natural lighting and ventilation. It comes equipped with key amenities including ${amenities && amenities.length > 0 ? (Array.isArray(amenities) ? amenities.join(', ') : amenities) : 'essential fittings, proper water supply, and secure access'}.

Positioned in a highly accessible neighborhood, you'll find local shops, public transit options, and dining hubs just a short walk away. This represents an incredible, zero-brokerage opportunity to secure a high-quality living space. Contact today to schedule a viewing!`;

    // If Anthropic is not initialized, return the mock response as a stream
    if (!anthropic) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const words = mockResponse.split(' ');
          for (const word of words) {
            controller.enqueue(encoder.encode(word + ' '));
            await new Promise((resolve) => setTimeout(resolve, 40)); // Simulate streaming speed
          }
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Call Anthropic API with streaming
    const stream = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (err) {
          console.error('Error during Claude streaming:', err);
          controller.enqueue(encoder.encode('\n(Streaming error occurred. Fallback description used below)\n' + mockResponse));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error in description generator API:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
