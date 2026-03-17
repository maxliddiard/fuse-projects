import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0";
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
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function invokeClaudeOnBedrock({
  system,
  messages,
  maxTokens = 1024,
  temperature = 0.3,
}: InvokeClaudeParams): Promise<string> {
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
    modelId: MODEL_ID,
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
