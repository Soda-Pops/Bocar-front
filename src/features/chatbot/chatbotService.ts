import { z } from 'zod';
import { http } from '@shared/http/httpClient';

export type HistorialItem = {
  role: 'user' | 'assistant';
  content: string;
};

const chatbotResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional().default([]),
});

export type ChatbotResponse = z.infer<typeof chatbotResponseSchema>;

export function queryChatbot(
  pregunta: string,
  historial: HistorialItem[],
  signal?: AbortSignal,
): Promise<ChatbotResponse> {
  return http.post('/api_chatbot/v1/query/', { pregunta, historial }, {
    schema: chatbotResponseSchema,
    signal,
  });
}
