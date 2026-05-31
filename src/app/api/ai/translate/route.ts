import { NextResponse } from 'next/server';
import { queryClaude } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required.' },
        { status: 400 }
      );
    }

    const langNameMap: Record<string, string> = {
      HI: 'Hindi',
      KA: 'Kannada',
      TA: 'Tamil',
      TE: 'Telugu',
      MR: 'Marathi',
    };

    const targetLangName = langNameMap[targetLanguage] || targetLanguage;

    const systemPrompt = `You are a professional translator fluent in English and all major Indian languages. 
Translate the provided property listing text accurately into ${targetLangName}. 
Translate the meaning, tone, and listings context (like room amenities, landlord conditions, etc.) naturally so it makes sense to a native speaker. 
Do not include any extra text, warnings, or markdown. Only return the translated text directly.`;

    const prompt = `Translate this text into ${targetLangName}:
"${text}"`;

    // High quality mock translations for major Indian languages in case Claude API key is absent
    const mockTranslations: Record<string, string> = {
      HI: `[अनुवाद - हिन्दी]
शानदार घर किराए पर उपलब्ध है। सभी आधुनिक सुख-सुविधाओं से सुसज्जित, जैसे कि २४ घंटे पानी, पावर बैकअप, और पास में मेट्रो स्टेशन। अधिक जानकारी के लिए तुरंत संपर्क करें।`,
      KA: `[ಅನುವಾದ - ಕನ್ನಡ]
ಬಾಡಿಗೆಗೆ ಅತ್ಯುತ್ತಮ ಮನೆ ಲಭ್ಯವಿದೆ. 24 ಗಂಟೆ ನೀರು, ವಿದ್ಯುತ್ ಬ್ಯಾಕಪ್ ಮತ್ತು ಮೆಟ್ರೋ ನಿಲ್ದಾಣದ ಸಾಮೀಪ್ಯದಂತಹ ಎಲ್ಲಾ ಆಧುನಿಕ ಸೌಲಭ್ಯಗಳೊಂದಿಗೆ ಸಜ್ಜುಗೊಂಡಿದೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಇಂದೇ ಸಂಪರ್ಕಿಸಿ.`,
      TA: `[மொழிபெயர்ப்பு - தமிழ்]
வாடகைக்கு சிறந்த வீடு கிடைக்கிறது. 24 மணி நேர ತಣ್ಣீர், மின்சார காப்புப்பிரதி மற்றும் மெட்ரோ ரயில் நிலையத்தின் அருகாமை போன்ற அனைத்து நவீன வசதிகளுடன் கூடியது. ಹೆಚ್ಚಿನ விவரங்களுக்கு இன்று தொடர்பு கொள்ளவும்.`,
      TE: `[అనువాదం - తెలుగు]
అద్దెకు అద్భుతమైన ఇల్లు అందుబాటులో ఉంది. 24 గంటల నీటి సౌకర్యం, పవర్ బ్యాకప్ మరియు మెట్రో స్టేషన్ సామీప్యత వంటి అన్ని ఆధునిక సౌకర్యాలతో అమర్చబడి ఉంది. మరిన్ని వివరాల కోసం ఈరోజు సంప్రదించండి.`,
      MR: `[भाषांतर - मराठी]
भाड्याने देण्यासाठी उत्तम घर उपलब्ध आहे. २४ तास पाणी, वीज बॅकअप आणि मेट्रो स्टेशन जवळील अंतर यांसारख्या सर्व आधुनिक सोयी-सुविधांनी सुसज्जित. अधिक तपशीलांसाठी आजच संपर्क साधा.`,
    };

    const mockResponse = mockTranslations[targetLanguage] || `[${targetLangName} Translation of]: ${text}`;

    const translatedText = await queryClaude(prompt, systemPrompt, mockResponse);

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Translation API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate text.' },
      { status: 500 }
    );
  }
}
