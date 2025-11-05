/**
 * Tests for Telegram Text Processing Utilities
 */

const {
  escapeMarkdownV2,
  chunkText,
  sanitizeStageNumber,
  prepareTelegramText,
  createTelegramOutput
} = require('./telegram-text.js');

// Test data from the problem statement
const testText = `Это важный вопрос, который затрагивает множество сфер жизни. Если вы хотите, могу порекомендовать книги, курсы или гаджеты для улучшения концентрации, памяти и когнитивных способностей. Возможно, стоит начать с уточнения:

1. Какую сферу работы ума хотите улучшить? (память, внимание, креативность, скорость мышления)
2. Какие методы вам интересны? (упражнения, техника, книги, приложения)
3. Есть ли бюджет на покупку гаджетов или материалов?

Если вы хотите просто рекомендации без покупок, дайте знать, и я составлю список практических советов.`;

console.log('=== Test 1: escapeMarkdownV2 ===');
const escaped = escapeMarkdownV2(testText);
console.log('Original length:', testText.length);
console.log('Escaped length:', escaped.length);
console.log('Contains escaped dots:', escaped.includes('\\.'));
console.log('Contains escaped parentheses:', escaped.includes('\\('));
console.log('Sample escaped text (first 200 chars):');
console.log(escaped.substring(0, 200));
console.log();

console.log('=== Test 2: sanitizeStageNumber ===');
console.log('Stage from number 1:', sanitizeStageNumber(1));
console.log('Stage from string "1":', sanitizeStageNumber("1"));
console.log('Stage from string " 2 ":', sanitizeStageNumber(" 2 "));
console.log('Stage from float 3.7:', sanitizeStageNumber(3.7));
console.log('Stage from invalid "abc":', sanitizeStageNumber("abc"));
console.log('Stage from null:', sanitizeStageNumber(null));
console.log();

console.log('=== Test 3: chunkText ===');
const longText = 'A'.repeat(5000) + '\n' + 'B'.repeat(5000);
const chunks = chunkText(longText, 4000);
console.log('Number of chunks:', chunks.length);
console.log('Chunk 1 length:', chunks[0].length);
console.log('Chunk 2 length:', chunks[1].length);
console.log('All chunks within limit:', chunks.every(c => c.length <= 4000));
console.log();

console.log('=== Test 4: prepareTelegramText ===');
const prepared = prepareTelegramText(testText, true, false);
console.log('Prepared text length:', prepared.length);
console.log('Is escaped:', prepared.includes('\\.'));
console.log();

console.log('=== Test 5: createTelegramOutput ===');
try {
  const output = createTelegramOutput(testText, '427079313', 1);
  console.log('Output structure:');
  console.log('- Has tg_text:', typeof output.tg_text === 'string');
  console.log('- Has chat_id:', typeof output.chat_id === 'string');
  console.log('- Has stage:', typeof output.stage === 'number');
  console.log('- Has full_output:', typeof output.full_output === 'string');
  console.log('- Stage value:', output.stage);
  console.log('- Chat ID:', output.chat_id);
  console.log('- tg_text is escaped:', output.tg_text.includes('\\.'));
  console.log('- full_output is original:', output.full_output === testText);
  console.log();
  
  // This matches the expected output from the problem statement
  console.log('Sample output (matches problem statement format):');
  console.log(JSON.stringify([output], null, 2));
} catch (error) {
  console.error('Error creating output:', error.message);
}
console.log();

console.log('=== Test 6: Error handling for invalid stage ===');
try {
  createTelegramOutput(testText, '427079313', 'invalid');
  console.log('ERROR: Should have thrown an exception');
} catch (error) {
  console.log('Correctly threw error:', error.message);
}
console.log();

console.log('=== All tests completed ===');
