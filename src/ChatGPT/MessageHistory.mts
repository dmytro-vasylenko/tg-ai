import { SerializableData } from '../shared/SerializableData.mjs';

import { Message } from '../ChatProvider/types.mjs';

export class MessageHistory {
  messages = new SerializableData<Record<string, Message>>('messages_history', {});

  appendMessage(messageId: string, message: Message) {
    if (!messageId) {
      return;
    }

    this.messages.setValue((messages) => {
      if (messages[messageId]) {
        return messages;
      }

      return {
        ...messages,
        [messageId]: message,
      };
    });
  }

  getMessagesChain(messageId?: number): ReadonlyArray<Message> {
    const message = this.getMessage(messageId);
    const reply = this.getReply(message);

    if (!message) {
      return [];
    }

    if (!reply) {
      return [
        message,
      ];
    }

    return [
      ...this.getMessagesChain(reply.replyTo),
      reply,
      message,
    ];
  }

  getMessage(messageId?: string | number) {
    if (!messageId) {
      return null;
    }

    return this.messages.getValue()[messageId] ?? null;
  }

  getReply(message?: Message | null) {
    if (!message || !message.replyTo) {
      return null;
    }

    return this.getMessage(message.replyTo);
  }
}
