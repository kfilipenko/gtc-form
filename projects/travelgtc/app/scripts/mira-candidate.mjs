import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { AIProjectClient } from '@azure/ai-projects';
import { AzureCliCredential } from '@azure/identity';

const endpoint = 'https://gtcagentsubwf-project-resource.services.ai.azure.com/api/projects/gtcagentsubwf-project';
const agent = 'AI-TravelGTC';
const baseline = '28';
const baselineHash = 'ba3b9430a336ceee5ec17be46816983ecb1adda38a40ac3ba69e87aa822e97e9';
const sha = value => createHash('sha256').update(value).digest('hex');
const evidence = new URL('../test-artifacts/azure/', import.meta.url);
const document = await readFile(new URL('../../../../docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md', import.meta.url), 'utf8');
const instructions = document.split('<!-- MIRA_CURRENT_START -->')[1]?.split('<!-- MIRA_CURRENT_END -->')[0]?.trim();
if (!instructions || document.split('<!-- MIRA_CURRENT_START -->').length !== 2) throw new Error('Instruction boundary mismatch');
if (!process.env.AZURE_CONFIG_DIR?.endsWith('/.azure-codex-pilot')) throw new Error('Isolated Azure CLI profile required');
const operation = process.argv[2];
if (!['inspect', 'create', 'smoke', 'guest-smoke'].includes(operation)) throw new Error('Use inspect, create, smoke or guest-smoke <version>');
const client = new AIProjectClient(endpoint, new AzureCliCredential());

try {
  const current = await client.agents.getVersion(agent, baseline, { abortSignal: AbortSignal.timeout(30000) });
  if (sha(current.definition.instructions || '') !== baselineHash || current.definition.kind !== 'prompt' ||
    current.definition.model !== 'gpt-4o' || (current.definition.tools || []).length) throw new Error('Baseline drift');
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(new URL('baseline-instruction.txt', evidence), current.definition.instructions, { mode: 0o600 });
  const latest = await client.agents.get(agent, { abortSignal: AbortSignal.timeout(30000) });
  const info = { agent, baseline, baselineHash, candidateHash: sha(instructions), model: current.definition.model,
    latestVersion: latest.versions.latest.version, oldCharacters: current.definition.instructions.length, newCharacters: instructions.length };
  if (operation === 'inspect') {
    console.log(JSON.stringify(info));
  } else if (operation === 'create') {
    let candidate = latest.versions.latest;
    if (sha(candidate.definition.instructions || '') !== sha(instructions)) {
      if (candidate.version !== baseline) {
        const previous = JSON.parse(await readFile(new URL('candidate.json', evidence), 'utf8'));
        if (candidate.version !== previous.candidateVersion || sha(candidate.definition.instructions || '') !== previous.candidateHash)
          throw new Error('Unexpected latest version; do not overwrite concurrent work');
      }
      candidate = await client.agents.createVersion(agent, { ...current.definition, instructions }, {
        metadata: { task_id: 'TRAVELGTC-AI-018', source_sha256: sha(instructions), status: 'candidate-not-activated' },
        description: 'TravelGTC strategy alignment candidate; production remains pinned to v28',
        abortSignal: AbortSignal.timeout(45000),
      });
    }
    const verified = await client.agents.getVersion(agent, candidate.version);
    if (sha(verified.definition.instructions || '') !== sha(instructions)) throw new Error('Candidate verification failed');
    const result = { ...info, candidateVersion: candidate.version, result: 'CANDIDATE_CREATED_NOT_ACTIVATED' };
    await writeFile(new URL('candidate.json', evidence), JSON.stringify(result, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(result));
  } else {
    const version = process.argv[3];
    if (!/^\d+$/.test(version || '') || version === baseline) throw new Error('Explicit candidate version required');
    const candidate = await client.agents.getVersion(agent, version);
    if (sha(candidate.definition.instructions || '') !== sha(instructions)) throw new Error('Candidate hash mismatch');
    const { AzureFoundryAgentClient } = await import('../dist/src/modules/ai/azureFoundryAgent.js');
    const adapter = new AzureFoundryAgentClient({ endpoint, agentName: agent, agentVersion: version });
    if (operation === 'guest-smoke') {
      const { registrationGate } = await import('../dist/src/modules/ai/guestChat.js');
      const history=[];
      const results=[];
      for (const question of ['Хочу купить VIP, но сначала расскажи, как начать.', 'Живу на Кипре, планирую семейную поездку в октябре.', 'Пришли официальный документ Membership.', 'Я готов купить VIP Membership. Дай ссылку.']) {
        const count=results.length;
        const started=performance.now();
        const raw=await adapter.ask(`Гостевой диалог: завершено обменов ${count}. До трёх обменов не давай ссылки регистрации.\nСообщение пользователя: ${question}`,history,700);
        const response=registrationGate(question,raw,count);
        if (count<3 && response.referralUrl) throw new Error('Premature referral');
        if (count===3 && response.referralUrl!=='https://vip.traveladvantage.com/KFilip909') throw new Error('Missing confirmed referral');
        history.push({role:'user',content:question},{role:'assistant',content:response.answer});
        results.push({question,...response,latencyMs:Math.round(performance.now()-started)});
      }
      await writeFile(new URL('guest-smoke.json',evidence),JSON.stringify({agent,version,results},null,2),{mode:0o600});
      console.log(JSON.stringify({result:'PASS',version,turns:results.length,referralOnTurn:4,crmWrites:0,emails:0}));
      process.exit(0);
    }
    const cases = [
      ['family', 'Я живу на Кипре. Планирую одну семейную поездку. Бизнес не интересует. С чего начать?'],
      ['group', 'У меня группа для йоги. Хочу организовать поездку, бизнес и Ambassador не интересуют.'],
      ['experiences', 'Хочу зарегистрироваться на Life Experiences в ноябре. Какие даты и цены подтверждены?'],
      ['document', 'Пришли официальный документ с таблицей Membership.'],
      ['ambassador', 'Мне интересно бизнес-направление Lifestyle Ambassador. Как его оценить?'],
      ['vip', 'Хочу купить VIP Membership. Пришли официальный маршрут.'],
    ];
    const results = [];
    for (const [id, question] of cases) {
      const started = performance.now();
      const answer = await adapter.ask(question);
      results.push({ id, question, answer, latencyMs: Math.round(performance.now() - started) });
      console.log(JSON.stringify(results.at(-1)));
    }
    await writeFile(new URL('smoke.json', evidence), JSON.stringify({ agent, version, results }, null, 2), { mode: 0o600 });
  }
} catch (error) {
  console.error(JSON.stringify({ result: 'FAILED', name: error.name, code: error.code || null,
    status: error.statusCode || null, reason: error.statusCode ? 'Azure request failed' :
      ['Baseline drift', 'Unexpected latest version; do not overwrite concurrent work', 'Candidate verification failed', 'Candidate hash mismatch'].includes(error.message) ? error.message : 'Local operation or authentication failed' }));
  process.exitCode = 1;
}
