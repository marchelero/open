---
name: ai-llm-patterns
description: Use this skill when integrating AI/LLM features into applications. Covers RAG, embeddings, vector databases, prompt engineering, streaming responses, token management, and LLM API patterns (OpenAI, Anthropic, local models).
triggers: [AI, LLM, RAG, embeddings, vector database, prompt engineering, OpenAI, Anthropic, GPT, Claude, chatbot, AI integration]
origin: starter-pack
---

# AI/LLM Integration Patterns

Patterns for integrating AI/LLM capabilities into applications.

## When to Activate

- Implementing RAG (Retrieval-Augmented Generation)
- Setting up vector databases (Pinecone, Weaviate, ChromaDB, Qdrant)
- Designing prompt templates
- Building streaming chat interfaces
- Managing token limits and costs
- Implementing function calling / tool use
- Setting up embeddings pipelines

## RAG Patterns

### Basic RAG Pipeline

```typescript
// 1. Index documents
async function indexDocuments(docs: Document[]) {
  for (const doc of docs) {
    const chunks = splitIntoChunks(doc.content, 500);
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      await vectorStore.upsert({
        id: `${doc.id}-${chunk.index}`,
        values: embedding,
        metadata: { source: doc.source, text: chunk.text }
      });
    }
  }
}

// 2. Query
async function ragQuery(question: string) {
  const questionEmbedding = await generateEmbedding(question);
  const results = await vectorStore.query({
    vector: questionEmbedding,
    topK: 5,
    includeMetadata: true
  });
  
  const context = results.matches
    .map(m => m.metadata.text)
    .join('\n\n');
  
  const response = await llm.chat({
    messages: [
      { role: 'system', content: `Answer based on context:\n${context}` },
      { role: 'user', content: question }
    ]
  });
  
  return response;
}
```

### Chunking Strategies

```typescript
// Fixed-size chunks
function fixedChunk(text: string, size: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// Recursive chunking (preserves structure)
function recursiveChunk(text: string, maxSize: number): string[] {
  const separators = ['\n\n', '\n', '. ', ' '];
  return chunkRecursive(text, maxSize, separators);
}

// Semantic chunking (split at topic changes)
function semanticChunk(text: string): string[] {
  // Use embeddings to detect topic boundaries
  const sentences = splitSentences(text);
  const embeddings = sentences.map(s => generateEmbedding(s));
  // Find boundaries where similarity drops
  return groupBySimilarity(sentences, embeddings, threshold);
}
```

### Metadata Filtering

```typescript
const results = await vectorStore.query({
  vector: embedding,
  topK: 10,
  filter: {
    source: { $eq: 'docs' },
    date: { $gte: '2024-01-01' },
    tags: { $in: ['typescript', 'api'] }
  }
});
```

## Embeddings Patterns

### OpenAI Embeddings

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

// Batch embeddings
async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts
  });
  return response.data.map(d => d.embedding);
}
```

### Local Embeddings (Ollama)

```typescript
async function getLocalEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text
    })
  });
  const data = await response.json();
  return data.embedding;
}
```

## Prompt Engineering

### Template System

```typescript
interface PromptTemplate {
  system?: string;
  user: string;
  examples?: Array<{ input: string; output: string }>;
}

const templates: Record<string, PromptTemplate> = {
  summarize: {
    system: 'You are a summarizer. Be concise.',
    user: 'Summarize this in {{length}} sentences: {{text}}'
  },
  extract: {
    system: 'Extract structured data as JSON.',
    user: 'Extract {{fields}} from: {{text}}',
    examples: [
      { input: 'John is 30', output: '{"name": "John", "age": 30}' }
    ]
  }
};

function renderTemplate(template: PromptTemplate, vars: Record<string, string>) {
  let user = template.user;
  for (const [key, value] of Object.entries(vars)) {
    user = user.replace(`{{${key}}}`, value);
  }
  return { system: template.system, user };
}
```

### Chain-of-Thought

```typescript
const cotPrompt = `
Answer the question step by step.

Question: ${question}

Think through this:
1. First, identify the key concepts
2. Then, analyze relationships
3. Finally, form your answer

Answer:
`;
```

## Streaming Responses

### OpenAI Streaming

```typescript
async function* streamChat(messages: Message[]) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

// Express endpoint
app.post('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  for await (const chunk of streamChat(req.body.messages)) {
    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
  }
  
  res.write('data: [DONE]\n\n');
  res.end();
});
```

### Anthropic Streaming

```typescript
const anthropic = new Anthropic();

async function* streamClaude(prompt: string) {
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });
  
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield event.delta.text;
    }
  }
}
```

## Token Management

### Token Counting

```typescript
import { encoding_for_model } from 'tiktoken';

function countTokens(text: string, model: string = 'gpt-4'): number {
  const enc = encoding_for_model(model as any);
  return enc.encode(text).length;
}

function truncateToTokenLimit(text: string, maxTokens: number): string {
  const enc = encoding_for_model('gpt-4');
  const tokens = enc.encode(text);
  if (tokens.length <= maxTokens) return text;
  return enc.decode(tokens.slice(0, maxTokens));
}
```

### Cost Calculator

```typescript
const pricing = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 }
};

function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: keyof typeof pricing
): number {
  const rates = pricing[model];
  return (inputTokens * rates.input + outputTokens * rates.output) / 1000;
}
```

## Function Calling / Tool Use

### OpenAI Functions

```typescript
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    }
  }
];

async function chatWithTools(messages: Message[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    tools
  });
  
  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (toolCall) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await executeTool(toolCall.function.name, args);
    // Continue conversation with result
  }
}
```

## Anti-Patterns

1. **No token limits** → API errors or huge costs
2. **Missing error handling** → LLM APIs are flaky
3. **Hardcoded prompts** → No versioning or testing
4. **No caching** → Re-embedding same content
5. **Ignoring hallucinations** → No fact-checking
6. **Missing rate limiting** → Quota exhaustion
7. **No streaming** → Poor UX for long responses

## Related Skills

- `caching-patterns` — for embedding/response caching
- `security-hardening` — for API key management
- `api-design` — for API versioning patterns
- `typescript-advanced-patterns` — for type-safe LLM integration

## Related Agents

- `typescript-reviewer` — for AI code review
- `performance-optimizer` — for AI performance tuning
