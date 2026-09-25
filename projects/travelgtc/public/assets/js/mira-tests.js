(async () => {
 const status=document.querySelector('[data-test-status]');const target=document.querySelector('[data-test-dialogues]');
 try {
  const response=await fetch('/api/travelgtc/v1/crm/mira-evaluation',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error(response.status===401||response.status===403?'Войдите под аккаунтом владельца или команды CRM.':'Не удалось загрузить результаты. Обновите страницу позже.');
  const {report}=await response.json();
  status.textContent=`${report.title}. Проверено ответов: ${report.results.length}. ${report.summary || ''}`;
  for(const row of report.results){
   const panel=document.createElement('section');panel.className='crm-conversation';
   const title=document.createElement('h2');title.textContent=row.id+' · '+(row.review||'Ожидает оценки');panel.append(title);
   for(const [label,text] of [['Тестовый клиент',row.question],['Мира',row.answer]]){
    const article=document.createElement('article');article.className='crm-message '+(label==='Мира'?'from-mira':'from-customer');
    const heading=document.createElement('strong');heading.textContent=label;
    const body=document.createElement('div');body.className='crm-message-body';renderAiMarkdown(body,text);article.append(heading,body);panel.append(article);
   }
   if(row.note){const note=document.createElement('p');note.textContent='Оценка: '+row.note;panel.append(note);}
   target.append(panel);
  }
 }catch(error){status.textContent=error.message;}
})();
