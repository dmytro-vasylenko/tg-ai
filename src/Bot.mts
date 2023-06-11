import TelegramBot from 'node-telegram-bot-api';

import { ChatProvider } from './ChatProvider/index.mjs';
import { DecisionMaker } from './DecisionMaker/types.mjs';

import { AIChatProvider } from './ChatProvider/AIChatProvider.mjs';
import { AIDecisionMaker } from './DecisionMaker/AIDecisionMaker.mjs';
import { ImageGenerator } from './ImageGenerator.mjs';

import { TELEGRAM_BOT_USERNAME } from './constants.mjs';

type ReplyData = {
  chatId: number,
  username: string,
  data?: string,
  replyTo?: number,
  messageReplyTo?: number,
};

export class Bot {
  private bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

  private chatProvider: ChatProvider = new AIChatProvider();

  private decisionMaker: DecisionMaker = new AIDecisionMaker();

  private imageGenerator = new ImageGenerator();

  private actions = {
    text: this.replyWithText.bind(this),
    image: this.replyWithImage.bind(this),
    error: this.replyWithError.bind(this),
  };

  handleChat() {
    this.bot.onText(new RegExp(`\@${TELEGRAM_BOT_USERNAME}`, 'g'), this.handleTagging.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
  }

  private handleTagging(messageEvent: TelegramBot.Message) {
    return this.reply(messageEvent);
  }

  private handleMessage(messageEvent: TelegramBot.Message) {
    const {
      reply_to_message: {
        from: {
          username: replyUsername = 'NO_USERNAME',
        } = {},
      } = {},
    } = messageEvent;

    if (replyUsername !== TELEGRAM_BOT_USERNAME) {
      return;
    }

    return this.reply(messageEvent);
  }

  private async reply(messageEvent: TelegramBot.Message) {
    const {
      text = '',
      message_id: messageId,
      chat: {
        id: chatId,
      },
      from: {
        username = 'NO_USERNAME',
      } = {},
      reply_to_message: replyToMessage,
    } = messageEvent;

    this.handleReplyToMessage(replyToMessage);

    this.bot.sendChatAction(chatId, 'typing');

    const { decision, data } = await this.decisionMaker.decide(text);

    const replyMessage: ReplyData = {
      chatId,
      username,
      data,
      messageReplyTo: replyToMessage?.message_id,
      replyTo: messageId,
    };

    try {
      const {
        message_id: botMessageId = '',
        text: botMessageText = '',
      } = await this.actions[decision](replyMessage) || {};

      if (!botMessageId || !text) {
        return;
      }

      this.chatProvider.appendMessage(messageId, {
        username,
        content: text,
        replyTo: replyToMessage?.message_id,
      });

      this.chatProvider.appendMessage(botMessageId, {
        username: TELEGRAM_BOT_USERNAME,
        content: botMessageText,
        replyTo: messageId,
      });
    } catch (err) {
      this.replyWithError({
        ...replyMessage,
        data: err?.toString?.(),
      });
    }
  }

  handleReplyToMessage(messageEvent?: TelegramBot.Message) {
    const {
      from: {
        username: replyUsername = 'NO_USERNAME',
      } = {},
      text: replyText = '',
      caption: replyCaption = '',
      message_id: replyMessageId = 0,
      reply_to_message: {
        message_id: replyReplyMessageId = 0,
      } = {},
      forward_from_chat: {
        username: replyChatUsernameTitle = '',
      } = {},
    } = messageEvent ?? {};

    if (!replyText && !replyCaption) {
      return;
    }

    this.chatProvider.appendMessage(replyMessageId, {
      username: (replyChatUsernameTitle || replyUsername) ?? 'Unknown',
      content: replyCaption || replyText,
      replyTo: replyReplyMessageId,
    });
  }

  private async replyWithImage({
    chatId,
    data,
    replyTo,
  }: ReplyData) {
    if (!data) {
      return null;
    }

    this.bot.sendChatAction(chatId, 'upload_photo');

    const link = await this.imageGenerator.generate(data) ?? '';

    return this.bot.sendPhoto(chatId, link, {
      reply_to_message_id: replyTo,
    });
  }

  private async replyWithText({
    chatId,
    replyTo,
    username,
    messageReplyTo,
    data,
  }: ReplyData) {
    if (!data) {
      return null;
    }

    this.bot.sendChatAction(chatId, 'typing');

    const { content } = await this.chatProvider.getNext({
      content: data,
      username,
      replyTo: messageReplyTo,
    });

    return this.bot.sendMessage(chatId, content, {
      reply_to_message_id: replyTo,
    });
  }

  private async replyWithError({
    chatId,
    replyTo,
    data = 'Something went wrong...',
  }: ReplyData) {
    return this.bot.sendMessage(chatId, data, {
      reply_to_message_id: replyTo,
    });
  }
}
