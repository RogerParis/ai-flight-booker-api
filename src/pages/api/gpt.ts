import type { NextApiRequest, NextApiResponse } from 'next';

type MCPContext = {
  intent: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  passenger_count?: number | string;
  status?: string;
};

type GPTResponse = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GPTResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const mcp: MCPContext = req.body;

  try {
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel booking assistant. Use the given MCP context.',
          },
          {
            role: 'user',
            content: `MCP Context:\n${JSON.stringify(mcp, null, 2)}`,
          },
        ],
      }),
    });

    const data = await openRouterResponse.json();

    const message = data?.choices?.[0]?.message?.content ?? 'No response from GPT';
    res.status(200).json({ message });
  } catch (err: unknown) {
    console.error('GPT API Error:', err);
    res.status(500).json({ error: 'Something went wrong with GPT request' });
  }
}
