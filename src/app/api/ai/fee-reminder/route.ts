import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { childName, amount, dueDate, feeType, tone } = await req.json();

    let toneInstruction = "freundlich und höflich";
    if (tone === 'urgent') toneInstruction = "dringend, aber professionell";
    if (tone === 'standard') toneInstruction = "sachlich und klar";

    const prompt = `
      Schreibe eine ${toneInstruction}e E-Mail / Nachricht an die Eltern von ${childName} bezüglich einer überfälligen Kindergartengebühr.
      
      Details:
      - Gebührenart: ${feeType}
      - Ausstehender Betrag: €${amount.toFixed(2)}
      - Ursprüngliches Fälligkeitsdatum: ${new Date(dueDate).toLocaleDateString('de-DE')}
      
      Die Nachricht sollte professionell, mitfühlend, aber bestimmt sein. (Schreibe auf Deutsch).
      Schreibe nur den Text der E-Mail (mit Betreffzeile), ohne zusätzliche Erklärungen. Setze Platzhalter für Namen wie [Name der Eltern] ein.
    `;

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error('AI Fee Reminder Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate reminder. Make sure OPENAI_API_KEY is set.' }, { status: 500 });
  }
}
