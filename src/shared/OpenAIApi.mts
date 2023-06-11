import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.CHATGPT_TOKEN,
});

export const openAI = new OpenAIApi(configuration);
