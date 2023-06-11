import { ChatCompletionRequestMessage } from 'openai';

import { openAI } from '../shared/OpenAIApi.mjs';

export class ChatGPT {
  private systemPrompts: ReadonlyArray<ChatCompletionRequestMessage> = [];

  constructor(prompts: ReadonlyArray<ChatCompletionRequestMessage> = []) {
    this.systemPrompts = prompts;
  }

  async perform(prompts: ReadonlyArray<ChatCompletionRequestMessage>) {
    try {
      const response = await openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          ...this.systemPrompts,
          ...prompts,
        ],
      });

      const {
        content = '',
      } = response.data.choices[0].message ?? {};

      return {
        content,
      };
    } catch (err: any) {
      const errorMessage: string = err?.response?.data?.error?.message ?? 'Unknown';

      return {
        error: errorMessage,
      };
    }
  }
}
