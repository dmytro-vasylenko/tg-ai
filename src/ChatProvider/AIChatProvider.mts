import { ChatCompletionRequestMessage } from 'openai';

import { ChatGPT } from '../ChatGPT/ChatGPT.mjs';
import { MessageHistory } from '../ChatGPT/MessageHistory.mjs';

import { ChatProvider, Message } from './types.mjs';

export class AIChatProvider implements ChatProvider {
  private systemPrompts: ReadonlyArray<ChatCompletionRequestMessage> = [
    {
      role: 'system',
      content: [
        'Поводь себе як звичайний участник чату, придумай собі імʼя, але не поводь себе як бот чи як компʼютерна программа, бо ти є людина',
        `Твій юзернейм "@${process.env.TELEGRAM_BOT_USERNAME}"`,
        'Будь доброзичливим, використовуй емодзі коли це можливо',
        'Ти не повинен використовувати російську мову',
        'Відповідай стисло, але зрозуміло',
      ].join('. '),
    },
  ];

  service = new ChatGPT(this.systemPrompts);

  messageHistory = new MessageHistory();

  async getNext(message: Message) {
    const userPrompt: ChatCompletionRequestMessage = {
      content: message.content,
      role: 'user',
      name: message.username,
    };

    const previousMessages = this.getPreviousMessages(message.replyTo);

    const prompts = [
      ...previousMessages,
      userPrompt,
    ];

    const { content, error } = await this.service.perform(prompts);

    return {
      content: (error || content) ?? '',
    };
  }

  getPreviousMessages(replyTo?: number) {
    return this.messageHistory.getMessagesChain(replyTo).map(({ content, username }): ChatCompletionRequestMessage => {
      return {
        role: process.env.TELEGRAM_BOT_USERNAME === username ? 'assistant' : 'user',
        content,
        name: username,
      };
    });
  }

  appendMessage(messageId: string, message: Message) {
    this.messageHistory.appendMessage(messageId, message);
  }
}
