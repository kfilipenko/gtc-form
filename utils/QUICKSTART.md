/**
 * Quick Reference Guide for Telegram Text Processing
 * 
 * This is a simplified guide for common use cases in n8n workflows.
 */

// ============================================================================
// QUICK START - Most Common Use Case
// ============================================================================

// In your n8n Code Node:
const { createTelegramOutput, sanitizeStageNumber } = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');

// Get your data (example)
const chatId = $input.item.json.chat_id;
const stage = $input.item.json.stage;
const botResponse = $input.item.json.bot_response;

// Create output - this handles ALL escaping automatically
const output = createTelegramOutput(botResponse, chatId, stage);

// Return to next node
return [output];

// Output format:
// {
//   "tg_text": "Escaped text ready for Telegram",
//   "chat_id": "123456789",
//   "stage": 1,
//   "full_output": "Original unescaped text"
// }

// ============================================================================
// FIX: Database Error - "invalid input syntax for type integer"
// ============================================================================

// BEFORE (causes error):
const stage = $input.item.json.stage; // might be "1" (string)
// INSERT INTO table (stage) VALUES ($stage) -- ERROR!

// AFTER (works correctly):
const { sanitizeStageNumber } = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');
const stage = sanitizeStageNumber($input.item.json.stage); // now it's 1 (integer)
if (stage === null) {
  throw new Error('Invalid stage number');
}
// INSERT INTO table (stage) VALUES ($stage) -- SUCCESS!

// ============================================================================
// HANDLING LONG MESSAGES (over 4096 characters)
// ============================================================================

const { createTelegramOutput, chunkText } = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');

const output = createTelegramOutput(longText, chatId, stage);
const chunks = chunkText(output.tg_text, 4000);

if (chunks.length === 1) {
  return [output];
} else {
  // Return multiple items - one per chunk
  return chunks.map((chunk, i) => ({
    tg_text: chunk,
    chat_id: output.chat_id,
    stage: output.stage,
    full_output: output.full_output,
    part: i + 1,
    total: chunks.length
  }));
}

// ============================================================================
// MANUAL ESCAPING (if you need it)
// ============================================================================

const { escapeMarkdownV2 } = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');

const text = "Hello! (This is a test.)";
const escaped = escapeMarkdownV2(text);
// Result: "Hello\\! \\(This is a test\\.\\)"

// ============================================================================
// COMMON MISTAKES TO AVOID
// ============================================================================

// ❌ DON'T: Double escape
const escaped = escapeMarkdownV2(text);
const doubleEscaped = escapeMarkdownV2(escaped); // WRONG!

// ✅ DO: Escape only once
const escaped = escapeMarkdownV2(text); // Correct

// ❌ DON'T: Use stage without validation
// const query = `UPDATE table SET stage = ${stage}`; // Might fail!

// ✅ DO: Always sanitize stage and use parameterized queries
const validStage = sanitizeStageNumber(stage);
if (validStage === null) throw new Error('Invalid stage');
// Use parameterized query (example for pg):
// await client.query('UPDATE table SET stage = $1 WHERE id = $2', [validStage, id]);

// ❌ DON'T: Send unescaped text to Telegram with MarkdownV2
// Will fail if text contains special characters like . ( ) !

// ✅ DO: Use createTelegramOutput or escapeMarkdownV2
const output = createTelegramOutput(text, chatId, stage);
// Now output.tg_text is safe to send

// ============================================================================
// TELEGRAM API USAGE
// ============================================================================

// When sending to Telegram, use the tg_text field:
// 
// POST https://api.telegram.org/bot<TOKEN>/sendMessage
// {
//   "chat_id": output.chat_id,
//   "text": output.tg_text,        // Use this field!
//   "parse_mode": "MarkdownV2"      // Important!
// }

// ============================================================================
// COMPLETE WORKFLOW EXAMPLE
// ============================================================================

// Node 1: Get bot response from AI
// → Outputs: { bot_response: "...", chat_id: "...", stage: "1" }

// Node 2: Format for Telegram (Code Node)
const { createTelegramOutput } = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');

const chatId = $input.item.json.chat_id;
const stage = $input.item.json.stage;
const botResponse = $input.item.json.bot_response;

const output = createTelegramOutput(botResponse, chatId, stage);
return [output];

// Node 3: Save to Database (Postgres Node)
// Use parameterized query to prevent SQL injection:
// INSERT INTO chat_logs (chat_id, stage, message, tg_formatted, created_at)
// VALUES ($1, $2, $3, $4, NOW())
// Parameters: {{ $json.chat_id }}, {{ $json.stage }}, {{ $json.full_output }}, {{ $json.tg_text }}

// Node 4: Send to Telegram (HTTP Request Node)
// POST https://api.telegram.org/bot<TOKEN>/sendMessage
// Body: {
//   "chat_id": "{{ $json.chat_id }}",
//   "text": "{{ $json.tg_text }}",
//   "parse_mode": "MarkdownV2"
// }

console.log('✓ Quick reference guide loaded');
console.log('For full documentation, see: /home/runner/work/gtc-form/gtc-form/utils/README.md');
