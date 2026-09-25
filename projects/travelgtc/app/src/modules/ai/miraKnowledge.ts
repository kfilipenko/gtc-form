import net from 'node:net';
export type KnowledgeResult={status:string;id?:string;title?:string;source_url?:string;modified_at?:string;checked_at?:string;text?:string;truncated?:boolean};
export const needsKnowledge=(q:string)=>/баз[а-яё]*\s+знани|knowledge\s*base|loyalty\s*unlocked/iu.test(q)||(/(?:найди|проверь|поищи).{0,70}(?:стать|правил|балл|guest|mall)/iu.test(q))||(/(?:12|двенадцат).{0,20}месяц/iu.test(q)&&/балл|LP|100\s*%/iu.test(q));
export const knowledgeQueryAllowed=(q:unknown):q is string=>typeof q==='string'&&q.length>=2&&q.length<=120&&/^[\p{L}\p{N}®™%? '’().,-]+$/u.test(q)&&!/[0-9]{7,}/.test(q);
export function sanitizeKnowledge(v:any):KnowledgeResult{
 try{const u=new URL(v.source_url);if(v.status!=='KNOWLEDGE_ARTICLE_READ'||typeof v.id!=='string'||!/^\d{10,22}$/.test(v.id)||u.origin!=='https://mwrlife.zohodesk.com'||!/^\/portal\/en\/kb\/articles\/[a-z0-9-]+$/.test(u.pathname)||u.search||u.hash||u.username||u.password||typeof v.text!=='string'||!v.text.trim()||typeof v.title!=='string'||!Number.isFinite(Date.parse(v.checked_at))||Math.abs(Date.now()-Date.parse(v.checked_at))>60000)return {status:'KNOWLEDGE_UNAVAILABLE'};
 return {status:v.status,id:v.id,title:v.title.slice(0,180),source_url:u.href,checked_at:v.checked_at,modified_at:typeof v.modified_at==='string'?v.modified_at.slice(0,40):undefined,text:v.text.slice(0,14000),truncated:Boolean(v.truncated)||v.text.length>14000};}catch{return {status:'KNOWLEDGE_UNAVAILABLE'};}
}
export function readKnowledge(query:string,socket='/run/mira-reader/read.sock'):Promise<KnowledgeResult>{
 if(!knowledgeQueryAllowed(query))return Promise.resolve({status:'DENIED'});
 return new Promise(resolve=>{const c=net.createConnection(socket);c.setEncoding('utf8');let data='',done=false;
 const finish=(r:KnowledgeResult)=>{if(done)return;done=true;c.destroy();resolve(r);};c.setTimeout(37000,()=>finish({status:'KNOWLEDGE_UNAVAILABLE'}));c.on('error',()=>finish({status:'KNOWLEDGE_UNAVAILABLE'}));c.on('connect',()=>c.write(JSON.stringify({op:'search-knowledge',query})+'\n'));
 c.on('data',b=>{data+=b;if(data.length>22000)return finish({status:'KNOWLEDGE_UNAVAILABLE'});if(data.includes('\n')){try{finish(sanitizeKnowledge(JSON.parse(data.split('\n')[0])));}catch{finish({status:'KNOWLEDGE_UNAVAILABLE'});}}});c.on('end',()=>finish({status:'KNOWLEDGE_UNAVAILABLE'}));});
}
export function knowledgeGroundingErrors(text:string):string[]{
 const errors:string[]=[];
 if(/приостанов|suspend/iu.test(text)&&/90/.test(text)&&!/(?:более|свыше|превыш)[^.!?\n]{0,12}90|90[^.!?\n]{0,12}(?:превыш|более)/iu.test(text))errors.push('LOYALTY_TOTAL_SUSPENSION_RESETS_ONLY_ABOVE_90: сброс при более90днях суммарно, не при ровно90');
 if(/(?:не\s+более|(?:не\s+)?превыш[а-яё]*|больше|свыше)\s*30\s*дн/iu.test(text)&&/приостанов/iu.test(text))errors.push('LOYALTY_CONSECUTIVE_SUSPENSION_RESETS_AT_30: поOfficialTerms при30днях подряд и более счетчик сбрасывается');
 return errors;
}
