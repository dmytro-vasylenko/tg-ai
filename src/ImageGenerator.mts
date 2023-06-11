import { openAI } from './shared/OpenAIApi.mjs';

export class ImageGenerator {
  async generate(prompt: string) {
    try {
      const response = await openAI.createImage({
        prompt,
        n: 1,
        size: '1024x1024',
      });

      return response.data.data[0].url;
    } catch (err: any) {
      throw err?.response?.data?.error?.message || err?.toString?.();
    }
  }
};
