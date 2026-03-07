// ── utils/llm.js ──────────────────────────────────────────────────────────────
// Lazy-init pattern: clients are created on first use so that dotenv has
// already run by the time we read process.env values.

const Groq = require('groq-sdk');
const OpenAI = require('openai');

let groqClient = null;
let openaiClient = null;

// ── Helper: get provider ──────────────────────────────────────────────────────
const getProvider = () => (process.env.LLM_PROVIDER || 'groq').toLowerCase();

// ── Lazy client getters ───────────────────────────────────────────────────────
const getGroqClient = () => {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
};

const getOpenAIClient = () => {
    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
};

const getGeminiClient = () => {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        });
    }
    return openaiClient;
};

// ── Validate keys at startup (called from server.js after dotenv) ──────────────
const validateKeys = () => {
    const PROVIDER = getProvider();
    if (PROVIDER === 'groq') {
        const key = process.env.GROQ_API_KEY;
        if (!key || key === 'your_groq_api_key_here' || key.trim() === '') {
            console.warn('⚠️  WARNING: GROQ_API_KEY is missing or placeholder. AI features will not work.');
            console.warn('   Get a free key at: https://console.groq.com');
            return false;
        }
    }
    if (PROVIDER === 'openai') {
        const key = process.env.OPENAI_API_KEY;
        if (!key || key === 'your_openai_api_key_here' || key.trim() === '') {
            console.warn('⚠️  WARNING: OPENAI_API_KEY is missing or placeholder.');
            return false;
        }
    }
    if (PROVIDER === 'gemini') {
        const key = process.env.GEMINI_API_KEY;
        if (!key || key === 'your_gemini_api_key_here' || key.trim() === '') {
            console.warn('⚠️  WARNING: GEMINI_API_KEY is missing or placeholder.');
            return false;
        }
    }
    return true;
};

/**
 * Send a prompt to the configured LLM.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
const llmChat = async (systemPrompt, userPrompt) => {
    const PROVIDER = getProvider();

    // ── Key guard (lazy — runs at call time, after dotenv) ────────────────────
    if (PROVIDER === 'groq') {
        const key = process.env.GROQ_API_KEY;
        if (!key || key === 'your_groq_api_key_here' || key.trim() === '') {
            throw Object.assign(
                new Error('Groq API key is not configured. Please add GROQ_API_KEY to your .env file. Get a free key at https://console.groq.com'),
                { statusCode: 503 }
            );
        }
    }
    if (PROVIDER === 'openai') {
        const key = process.env.OPENAI_API_KEY;
        if (!key || key === 'your_openai_api_key_here' || key.trim() === '') {
            throw Object.assign(
                new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.'),
                { statusCode: 503 }
            );
        }
    }
    if (PROVIDER === 'gemini') {
        const key = process.env.GEMINI_API_KEY;
        if (!key || key === 'your_gemini_api_key_here' || key.trim() === '') {
            throw Object.assign(
                new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.'),
                { statusCode: 503 }
            );
        }
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ];

    try {
        if (PROVIDER === 'groq') {
            // llama3-70b-8192 was decommissioned — default to llama-3.3-70b-versatile
            const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
            const resp = await getGroqClient().chat.completions.create({
                messages,
                model,
                temperature: 0.3,
                max_tokens: 2048,
                response_format: { type: 'json_object' },
            });
            return resp.choices[0]?.message?.content || '{}';
        }

        if (PROVIDER === 'openai') {
            const model = process.env.OPENAI_MODEL || 'gpt-4o';
            const resp = await getOpenAIClient().chat.completions.create({
                messages,
                model,
                temperature: 0.3,
                max_tokens: 2048,
                response_format: { type: 'json_object' },
            });
            return resp.choices[0]?.message?.content || '{}';
        }

        if (PROVIDER === 'gemini') {
            const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
            const resp = await getGeminiClient().chat.completions.create({
                messages,
                model,
                temperature: 0.3,
                max_tokens: 2048,
            });
            return resp.choices[0]?.message?.content || '{}';
        }

        throw new Error(`Unknown LLM_PROVIDER: ${PROVIDER}`);

    } catch (err) {
        // Re-map 401 Invalid API Key to a friendly message
        if (
            err.status === 401 ||
            err.message?.includes('invalid_api_key') ||
            err.message?.includes('Incorrect API key')
        ) {
            const providerUp = PROVIDER.toUpperCase();
            const keyLink =
                PROVIDER === 'groq' ? 'https://console.groq.com' :
                    PROVIDER === 'openai' ? 'https://platform.openai.com/api-keys' :
                        'https://aistudio.google.com/app/apikey';
            throw Object.assign(
                new Error(`Invalid ${providerUp} API key. Please update ${providerUp}_API_KEY in backend/.env. Get a key at ${keyLink}`),
                { statusCode: 503 }
            );
        }
        throw err;
    }
};

/**
 * Parse JSON from LLM response (strips markdown code fences if present)
 */
const parseLLMJson = (raw) => {
    const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    return JSON.parse(cleaned);
};

module.exports = { llmChat, parseLLMJson, validateKeys };
