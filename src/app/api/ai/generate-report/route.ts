import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { activities, weather, specialEvents, briefNotes } = await req.json();

    const prompt = `
      Bitte schreibe einen warmen, professionellen und übersichtlichen Tagesbericht für Eltern eines Kindergartens. 
      Hier sind die Stichpunkte von heute:
      ${activities && activities.length ? `- Aktivitäten: ${activities.join(', ')}` : ''}
      ${weather ? `- Wetter: ${weather}` : ''}
      ${specialEvents ? `- Besondere Ereignisse: ${specialEvents}` : ''}
      ${briefNotes ? `- Lehrernotizen: ${briefNotes}` : ''}
      
      Der Bericht sollte flüssig lesbar sein, etwa 3-5 Sätze lang, und eine sehr positive und liebevolle Stimmung vermitteln. (Schreibe auf Deutsch).
      Schreibe nur den Inhalt des Berichts, ohne Grußformeln am Anfang oder Ende (wie "Liebe Eltern" oder "Viele Grüße"), da diese eventuell vom System hinzugefügt werden.
    `;

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error('AI Report Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate report. Make sure OPENAI_API_KEY is set.' }, { status: 500 });
  }
}

