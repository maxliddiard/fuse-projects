import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const BEDROCK_MODELS = {
  sonnet: "us.anthropic.claude-sonnet-4-20250514-v1:0",
  haiku: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
} as const;

export type BedrockModel = keyof typeof BEDROCK_MODELS;

const DEFAULT_MODEL: BedrockModel = "sonnet";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

let bedrockClient: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        ...(process.env.AWS_SESSION_TOKEN && {
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }),
      },
    });
  }
  return bedrockClient;
}

interface InvokeClaudeParams {
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: BedrockModel;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function invokeClaudeOnBedrock({
  system,
  messages,
  maxTokens = 1024,
  temperature = 0.3,
  model = DEFAULT_MODEL,
}: InvokeClaudeParams): Promise<string> {
  const modelId = BEDROCK_MODELS[model];

  const body: Record<string, unknown> = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    messages,
    temperature,
  };

  if (system) {
    body.system = system;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await getClient().send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (responseBody.content?.[0]?.text) {
        return responseBody.content[0].text;
      }

      throw new Error("Unexpected Bedrock response format");
    } catch (error: unknown) {
      const isThrottled = error instanceof Error && error.name === "ThrottlingException";
      if (isThrottled && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`Throttled, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
