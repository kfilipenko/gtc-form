# Telegram Text Processing Utilities

This module provides utility functions for processing text to be sent via Telegram, including MarkdownV2 character escaping, message chunking, and data formatting.

## Overview

When working with Telegram's Bot API, especially with MarkdownV2 formatting, certain characters need to be escaped. This utility module handles that escaping automatically, along with other common text processing needs.

## Installation

No installation required - just include the module:

```javascript
// In Node.js
const {
  escapeMarkdownV2,
  chunkText,
  sanitizeStageNumber,
  prepareTelegramText,
  createTelegramOutput
} = require('./utils/telegram-text.js');

// In browser
<script src="/utils/telegram-text.js"></script>
<script>
  const { escapeMarkdownV2 } = window.TelegramTextUtils;
</script>
```

## Functions

### escapeMarkdownV2(text)

Escapes special characters for Telegram MarkdownV2 format.

**Parameters:**
- `text` (string) - The text to escape

**Returns:** (string) - The escaped text safe for Telegram MarkdownV2

**Example:**
```javascript
const text = "Hello! This is a test. (Important)";
const escaped = escapeMarkdownV2(text);
// Result: "Hello\\! This is a test\\. \\(Important\\)"
```

**Special characters escaped:** `_ * [ ] ( ) ~ \` > # + - = | { } . !`

### chunkText(text, maxLength = 4000)

Chunks text into segments suitable for Telegram messages. Telegram has a limit of 4096 characters per message.

**Parameters:**
- `text` (string) - The text to chunk
- `maxLength` (number) - Maximum length per chunk (default: 4000)

**Returns:** (string[]) - Array of text chunks

**Example:**
```javascript
const longText = "A".repeat(5000);
const chunks = chunkText(longText, 4000);
// Result: Array with 2 chunks: ["AAAA..." (4000 chars), "AAA..." (1000 chars)]
```

### sanitizeStageNumber(stage)

Sanitizes and validates a stage number to ensure it's a valid integer.

**Parameters:**
- `stage` (*) - The stage value to sanitize (can be number, string, etc.)

**Returns:** (number|null) - The validated integer stage number, or null if invalid

**Example:**
```javascript
sanitizeStageNumber(1);        // 1
sanitizeStageNumber("2");      // 2
sanitizeStageNumber(" 3 ");    // 3
sanitizeStageNumber(4.7);      // 4
sanitizeStageNumber("abc");    // null
```

### prepareTelegramText(text, escape = true, chunk = false, maxLength = 4000)

Prepares text for Telegram by escaping and optionally chunking.

**Parameters:**
- `text` (string) - The text to prepare
- `escape` (boolean) - Whether to escape MarkdownV2 characters (default: true)
- `chunk` (boolean) - Whether to chunk the text (default: false)
- `maxLength` (number) - Maximum chunk length if chunking is enabled (default: 4000)

**Returns:** (string|string[]) - Escaped text or array of chunks if chunking is enabled

**Example:**
```javascript
// Just escape
const escaped = prepareTelegramText("Hello (world)!", true, false);
// Result: "Hello \\(world\\)\\!"

// Escape and chunk
const chunks = prepareTelegramText("A".repeat(5000), true, true, 4000);
// Result: Array of escaped chunks
```

### createTelegramOutput(text, chatId, stage)

Creates a formatted output object for Telegram messages, matching the n8n workflow output format.

**Parameters:**
- `text` (string) - The original text
- `chatId` (string|number) - The Telegram chat ID
- `stage` (number) - The conversation stage number

**Returns:** (Object) - Formatted object with:
  - `tg_text` - Escaped text for Telegram
  - `chat_id` - String chat ID
  - `stage` - Integer stage number
  - `full_output` - Original unescaped text

**Throws:** Error if stage number is invalid

**Example:**
```javascript
const output = createTelegramOutput(
  "Какую сферу работы ума хотите улучшить? (память, внимание)",
  "427079313",
  1
);

// Result:
// {
//   "tg_text": "Какую сферу работы ума хотите улучшить? \\(память, внимание\\)",
//   "chat_id": "427079313",
//   "stage": 1,
//   "full_output": "Какую сферу работы ума хотите улучшить? (память, внимание)"
// }
```

## Usage in n8n Workflows

This module is designed to be used in n8n workflows for processing Telegram bot responses.

### Example n8n Code Node:

```javascript
// Load the utility functions
const {
  createTelegramOutput,
  chunkText
} = require('/path/to/utils/telegram-text.js');

// Get input data
const chatId = $input.item.json.chat_id;
const stage = $input.item.json.stage;
const botResponse = $input.item.json.bot_response;

// Create properly formatted output
const output = createTelegramOutput(botResponse, chatId, stage);

// If the text is very long, you might want to chunk it
const chunks = chunkText(output.tg_text, 4000);

// Return the first chunk or all chunks
if (chunks.length === 1) {
  return [output];
} else {
  // Return multiple outputs for each chunk
  return chunks.map((chunk, index) => ({
    ...output,
    tg_text: chunk,
    chunk_number: index + 1,
    total_chunks: chunks.length
  }));
}
```

## Testing

Run the test suite:

```bash
node utils/telegram-text.test.js
```

## Common Issues

### Database Error: "invalid input syntax for type integer"

If you encounter this error when saving to a database, ensure you're using `sanitizeStageNumber()` to properly format the stage value:

```javascript
const stage = sanitizeStageNumber($input.item.json.stage);
if (stage === null) {
  throw new Error('Invalid stage number');
}
// Now use `stage` in your SQL query
```

### Text Not Displaying Correctly in Telegram

Make sure you're:
1. Using `escapeMarkdownV2()` on all text sent with MarkdownV2 parse mode
2. Not double-escaping (escape only once)
3. Using the correct parse mode in your Telegram API call: `parse_mode: 'MarkdownV2'`

## License

Part of the gtc-form project.
