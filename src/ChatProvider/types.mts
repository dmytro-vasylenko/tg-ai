export type Message = {
  username: string,
  content: string,
  replyTo?: number,
};

export interface ChatProvider {
  getNext(messageEvent: Message): Promise<{ content: string }>,
  appendMessage(messageId: string | number, message: Message): void,
}
