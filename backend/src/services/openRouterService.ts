import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface GenerationParams {
  dueDate: string;
  instructions?: string;
  subject?: string;
  className?: string;
  questionTypes: Array<{
    type: string;
    count: number;
    marks: number;
  }>;
  contextText?: string;
  imageBase64?: string;
  mimeType?: string;
}

export const generateAssessmentAI = async (params: GenerationParams): Promise<any> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in the environment variables');
  }

  // Build the list of question types we need
  const questionRequirements = params.questionTypes
    .map((q) => `- ${q.count} x "${q.type}" type questions, each carrying ${q.marks} marks.`)
    .join('\n');

  const systemPrompt = `You are an expert AI Assessment Creator and academic examiner.
Your task is to generate a highly structured exam/assessment paper.
You MUST output ONLY a valid JSON object. Do not include any markdown fences (like \`\`\`json), explanations, or pre/post text. Just return raw JSON.

The JSON schema MUST exactly match:
{
  "sections": [
    {
      "title": "Section Title (e.g., Section A: Multiple Choice Questions)",
      "instructions": "Instructions for this section (e.g., Answer all questions. Each question carries 1 mark.)",
      "questions": [
        {
          "text": "The question text",
          "difficulty": "Easy" | "Moderate" | "Challenging",
          "marks": number,
          "options": ["Option A", "Option B", "Option C", "Option D"], // Only include this array if the question type is Multiple Choice or MCQ. Otherwise, omit this field or leave it undefined.
          "correctAnswer": "Correct Option or Answer indicator" // Only include this if MCQ/Multiple Choice.
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionIndex": "String index indicating which question this answers, e.g. 'Section A, Q1'",
      "answerText": "Detailed explanation/answer key for the question"
    }
  ]
}

Ensure the generated questions are realistic, follow academic standards, and matches the requested sections exactly.
Difficulty tags MUST be strictly either "Easy", "Moderate", or "Challenging".
CRITICAL: Do not output raw newlines, carriage returns, or tab characters inside any JSON string values (like "text" or "answerText"). If you need to write multi-line text or equations, format them as single-line strings using escaped '\\n' sequences instead. Ensure all string quotes are properly closed.`;

  const userPrompt = `Generate an assessment paper based on the following criteria:
${params.subject ? `Subject: ${params.subject}\n` : ''}${params.className ? `Grade/Class: ${params.className}\n` : ''}
${params.instructions ? `Teacher's Additional Instructions:\n${params.instructions}\n` : ''}
Required Question Breakdown:
${questionRequirements}

${params.contextText ? `Use the following provided reference text/context to base the questions on:\n--- START OF TEXT ---\n${params.contextText}\n--- END OF TEXT ---\n` : 'Generate general knowledge/academic questions based on the topic or instructions provided.'}

Now generate the structured assessment and return it as the raw JSON described in the system prompt.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'VedaAI Assessment Creator'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: params.imageBase64
              ? [
                  { type: 'text', text: userPrompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${params.mimeType};base64,${params.imageBase64}`
                    }
                  }
                ]
              : userPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API returned error status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;
    const contentText = data.choices?.[0]?.message?.content?.trim();

    if (!contentText) {
      throw new Error('OpenRouter response content is empty');
    }

    // Strip markdown JSON fences if the model outputted them despite system prompt
    let cleanJSON = contentText;
    if (cleanJSON.startsWith('```')) {
      cleanJSON = cleanJSON.replace(/^```json\s*/i, '').replace(/```$/, '');
    }
    cleanJSON = cleanJSON.trim();

    const parsedAssessment = JSON.parse(cleanJSON);
    return parsedAssessment;
  } catch (error) {
    console.error('Error generating assessment via OpenRouter:', error);
    throw error;
  }
};
