import { Decisions, Decision, DecisionMaker } from './types.mjs';

import { ChatGPT } from '../ChatGPT/ChatGPT.mjs';

export class AIDecisionMaker implements DecisionMaker {
  private decisions = [
    Decisions.text,
    Decisions.image,
  ];

  ai = new ChatGPT([
    {
      role: 'system',
      content: `You're a decision-making machine.
      You have to do decisions based on a user message.
      Your answer MUST contain only a decision with metadata in JSON format.
      Do not anwser in any other way.

      Example #1:
      Input: 'Yeah, I can agree with your idea. Let's take it offline.'
      Output: { "decision": "text", "data": "Yeah, I can agree with your idea. Let's take it offline." }
      Comment: It's a regular text, pass it as it is. Don't change or modify the original text.

      Example #2:
      Input: 'Generate a funny image with cats'
      Output: { "decision": "image", "data": "Funny image with cats" }
      Comment: A user wants an image based on his description

      Example #2:
      Input: 'Please, generate any image you want'
      Output: { "decision": "image", "data": "Carpathian Mountains" }
      Comment: A user wants you to generate an image with your preferences

      Do not return 'Output:' or any other extra text expect the decribed JSON object.
      Do not answer on user's questions. Just classify their message.

      The possible decicions are: ${this.decisions.join(', ')}.`,
    },
  ]);

  async decide(message: string) {
    const {
      content = '',
      error,
    } = await this.ai.perform([
      {
        role: 'user',
        content: `Process the following text: ${message}`,
      },
    ]);

    if (error) {
      return this.failureDecision(error);
    }

    try {
      const { decision, data } = JSON.parse(content) || {};

      if (!decision) {
        return this.failureDecision();
      }

      return {
        decision,
        data,
      } as Decision;
    } catch (err) {
      return this.failureDecision(err?.toString?.());
    }
  }

  private failureDecision(error: string = 'Undefined') {
    return {
      decision: 'error',
      data: error,
    } as Decision;
  }
}
