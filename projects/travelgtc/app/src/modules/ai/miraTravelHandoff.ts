// Shared voice/text guard. Offers access; never allocates a Guest Pass.
type Turn = {role: string; content: string};
const project = /travel\s*advantage|travelgtc|mwr|life\s*experience|лай[фв].*эксп|гостев|приглашен|приложен|платформ|тариф|членств|membership|ambassador|амбассад|регистрац|авторизац|войти|вход|не могу|не получается|ошибк|не работает|оплат|плат[её]ж|балл|поинт|loyalty|турбо|turbo|elite|комисси|партн[её]р|зарабат|подписк|условия|отмен|возврат|поддержк|код/iu;
const travel = /путешеств|поездк|отпуск|отел|гостиниц|маршрут|курорт|пляж|море|погода|виз[аыуе]|перел[её]т|авиабилет|дайв|трансфер|экскурс|достопримеч|ресторан|брониров|жиль[еёя]|жилья|страховк|круиз|вилл|чемодан|багаж|дахаб|египет|шарм/iu;
const followup = /^(а |и |ещ[её]|что |как |где |когда |како|сколько |посоветуй|подскажи|помоги|подбери|расскажи|найди|выбери)/iu;
export function travelHandoff(question: string, history: Turn[]): string | null {
 if(project.test(question))return null;
 let completed=0,pending=false,context=false;
 for(const turn of history){
  if(turn.role==='user'){
   const related: boolean=!project.test(turn.content)&&(travel.test(turn.content)||(context&&followup.test(turn.content)));
   pending=related;context=related;
  }else if(turn.role==='assistant'&&pending){completed++;pending=false;}
 }
 if(completed<4||!(travel.test(question)||(context&&followup.test(question))))return null;
 const alreadyGuest=history.some(t=>t.role==='assistant'&&/guestmember\.com|ваш гостевой код|ваше приглашение/iu.test(t.content));
 return alreadyGuest
 ? 'Основные ориентиры поездки мы уже обсудили. Следующий шаг — самостоятельно посмотреть отели и доступные варианты в приложении Travel Advantage по вашему гостевому приглашению. Сравните даты, полную стоимость и условия выбранного предложения. Если возникнут сложности со входом, поиском или условиями участия, возвращайтесь — я помогу разобраться.'
 : 'Основные ориентиры поездки мы уже обсудили. Предлагаю теперь посмотреть приложение Travel Advantage через гостевой доступ и самостоятельно подобрать варианты для вашей поездки. Доступ позволяет познакомиться с возможностями платформы; доступность и условия конкретных предложений нужно проверить в приложении. Напишите «Хочу гостевой доступ», и я помогу получить приглашение. Если возникнут сложности со входом, поиском или условиями участия, возвращайтесь в чат — я помогу.';
}
