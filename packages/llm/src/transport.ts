import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageCreateParamsNonStreaming,
  MessageTokensCount,
} from "@anthropic-ai/sdk/resources/messages";

export type { Message, MessageCreateParamsNonStreaming };

/**
 * The slice of the Anthropic SDK the wrapper uses. Narrow on purpose: it is what
 * the record/replay layer and the test fakes have to implement.
 */
export interface Transport {
  create(
    params: MessageCreateParamsNonStreaming,
    options?: { timeout?: number },
  ): Promise<Message>;
  countTokens(params: MessageCreateParamsNonStreaming): Promise<number>;
}

export function anthropicTransport(client: Anthropic): Transport {
  return {
    async create(params, options) {
      // maxRetries 0: retries are our own, so that `retry-after` handling and
      // the `llm_calls` accounting see every attempt.
      return client.messages.create(params, { ...options, maxRetries: 0 });
    },
    async countTokens(params) {
      const counted: MessageTokensCount = await client.messages.countTokens({
        model: params.model,
        messages: params.messages,
        ...(params.system === undefined ? {} : { system: params.system }),
        ...(params.tools === undefined ? {} : { tools: params.tools }),
      });
      return counted.input_tokens;
    },
  };
}

export function createAnthropic(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, maxRetries: 0 });
}
