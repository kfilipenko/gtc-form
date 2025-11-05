/**
 * Example n8n Code Node Implementation
 * 
 * This file demonstrates how to use the Telegram text processing utilities
 * in an n8n workflow, particularly for handling bot responses that need to
 * be sent to Telegram with proper formatting.
 */

// In an n8n Code Node, you would require the module like this:
// const utils = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');

// For this example, we'll simulate the n8n environment
const utils = require('./telegram-text.js');
const {
  createTelegramOutput,
  chunkText,
  sanitizeStageNumber,
  escapeMarkdownV2
} = utils;

console.log('=== Example 1: Basic n8n Code Node ===');
console.log('Purpose: Process a bot response and prepare it for Telegram\n');

// Simulate input from previous n8n node
const inputData = {
  chat_id: "427079313",
  stage: 1,
  bot_response: "Это важный вопрос, который затрагивает множество сфер жизни. Если вы хотите, могу порекомендовать книги, курсы или гаджеты для улучшения концентрации, памяти и когнитивных способностей. Возможно, стоит начать с уточнения:\n\n1. Какую сферу работы ума хотите улучшить? (память, внимание, креативность, скорость мышления)\n2. Какие методы вам интересны? (упражнения, техника, книги, приложения)\n3. Есть ли бюджет на покупку гаджетов или материалов?\n\nЕсли вы хотите просто рекомендации без покупок, дайте знать, и я составлю список практических советов."
};

// Process the data
const output = createTelegramOutput(
  inputData.bot_response,
  inputData.chat_id,
  inputData.stage
);

console.log('Input:', JSON.stringify(inputData, null, 2));
console.log('\nOutput:', JSON.stringify([output], null, 2));
console.log('\n');

console.log('=== Example 2: Handling Long Messages ===');
console.log('Purpose: Split long messages into multiple Telegram messages\n');

// Create a very long message
const longMessage = `Это длинное сообщение. ` + `Повторяющийся текст. `.repeat(500);

// Create output and chunk it
const longOutput = createTelegramOutput(longMessage, "123456789", 2);
const chunks = chunkText(longOutput.tg_text, 4000);

console.log(`Original length: ${longMessage.length} characters`);
console.log(`Escaped length: ${longOutput.tg_text.length} characters`);
console.log(`Number of chunks needed: ${chunks.length}`);
console.log(`Chunk lengths: ${chunks.map(c => c.length).join(', ')}`);
console.log('\n');

console.log('=== Example 3: Error Handling for Invalid Stage ===');
console.log('Purpose: Demonstrate proper error handling\n');

// Simulate various stage inputs
const testStages = [1, "2", " 3 ", 4.5, "invalid", null, undefined];

testStages.forEach(stage => {
  try {
    const sanitized = sanitizeStageNumber(stage);
    if (sanitized === null) {
      console.log(`❌ Stage "${stage}" is invalid - would cause database error`);
    } else {
      console.log(`✓ Stage "${stage}" sanitized to: ${sanitized}`);
    }
  } catch (error) {
    console.log(`❌ Error processing stage "${stage}": ${error.message}`);
  }
});
console.log('\n');

console.log('=== Example 4: n8n Code Node Template ===');
console.log('Copy this code into your n8n Code Node:\n');

const n8nTemplate = `
// Load the Telegram text utilities
const {
  createTelegramOutput,
  chunkText,
  sanitizeStageNumber
} = require('/home/runner/work/gtc-form/gtc-form/utils/telegram-text.js');

// Get input from previous node
// In n8n, use: $input.item.json
const chatId = $input.item.json.chat_id;
const stageInput = $input.item.json.stage;
const botResponse = $input.item.json.bot_response;

// Validate stage number
const stage = sanitizeStageNumber(stageInput);
if (stage === null) {
  throw new Error(\`Invalid stage number: \${stageInput}\`);
}

// Create properly formatted output
const output = createTelegramOutput(botResponse, chatId, stage);

// Check if message needs to be chunked
const chunks = chunkText(output.tg_text, 4000);

// Return output(s)
if (chunks.length === 1) {
  // Single message
  return [output];
} else {
  // Multiple messages - create one output per chunk
  return chunks.map((chunk, index) => ({
    tg_text: chunk,
    chat_id: output.chat_id,
    stage: output.stage,
    full_output: output.full_output,
    chunk_number: index + 1,
    total_chunks: chunks.length
  }));
}
`;

console.log(n8nTemplate);
console.log('\n');

console.log('=== Example 5: Database Query Preparation ===');
console.log('Purpose: Prepare data for PostgreSQL INSERT/UPDATE\n');

// Simulate preparing data for database
const dbData = {
  chat_id: "427079313",
  stage: "1", // Note: this is a string from input
  message: output.full_output,
  tg_formatted: output.tg_text,
  timestamp: new Date().toISOString()
};

// Sanitize stage for database
const dbStage = sanitizeStageNumber(dbData.stage);

console.log('SQL Query Example:');
console.log(`INSERT INTO chat_logs (chat_id, stage, message, tg_formatted, created_at)`);
console.log(`VALUES ($1, $2, $3, $4, $5)`);
console.log('\nParameters:', {
  $1: dbData.chat_id,
  $2: dbStage,  // Now guaranteed to be an integer
  $3: dbData.message,
  $4: dbData.tg_formatted.substring(0, 50) + '...',
  $5: dbData.timestamp
});
console.log('\n');

console.log('=== All Examples Completed ===');
console.log('\nKey Takeaways:');
console.log('1. Always use createTelegramOutput() to format messages');
console.log('2. Use sanitizeStageNumber() before database operations');
console.log('3. Check for long messages and chunk if needed');
console.log('4. Handle errors gracefully with try-catch blocks');
console.log('5. The tg_text field is escaped, full_output is original');
