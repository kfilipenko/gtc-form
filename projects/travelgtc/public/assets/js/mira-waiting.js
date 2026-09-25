// Cached neutral travel interludes; never synthesize while the user waits.
export function createWaitingJokes({context,onStart=()=>{},onEnd=()=>{},delay=7000,cooldown=90000,fetchAudio=async url=>(await fetch(url)).arrayBuffer()}={}){
 const urls=['/assets/audio/mira-waiting-1.wav','/assets/audio/mira-waiting-2.wav'];let timer,token=0,last=-Infinity,index=0,active=null,buffers;
 function preload(){buffers??=Promise.all(urls.map(async u=>context().decodeAudioData(await fetchAudio(u)))).catch(()=>[]);return buffers;}
 function cancel(){token++;clearTimeout(timer);if(active){const a=active;active=null;a.node.onended=null;try{a.node.stop();}catch{}onEnd();a.resolve();}}
 function arm(question){cancel();if(Date.now()-last<cooldown||/жалоб|умер|болез|больн|страх|обман|мошенн|возврат|отмен|не работает|ошибк|плат[её]ж|деньг|долг|не шути|без шут|серь[её]з/i.test(question))return;const current=token;preload();timer=setTimeout(async()=>{const loaded=await buffers;if(current!==token||!loaded.length||context().state!=='running')return;const node=context().createBufferSource();node.buffer=loaded[index++%loaded.length];node.connect(context().destination);let resolve;const done=new Promise(r=>resolve=r);active={node,done,resolve};node.onended=()=>{active=null;onEnd();resolve();};last=Date.now();onStart();node.start();},delay);}
 async function finish(){token++;clearTimeout(timer);if(active)await active.done;}
 return {arm,cancel,finish,preload};
}
