/* Subscription check + retry and redirect to /chat/ when active */
async function checkSubscriptionOnce(userId) {
  try {
    const res = await fetch(`/api/user/subscription-status?user_id=${encodeURIComponent(userId)}`, {cache: "no-store"});
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

async function checkAndRedirect(userId, attempts = 12, intervalMs = 5000) {
  for (let i=0;i<attempts;i++){
    const data = await checkSubscriptionOnce(userId);
    if (data && data.has_active_subscription) {
      try { localStorage.setItem('email_verified','true'); } catch(e){}
      // set user id values if present
      try { if (!localStorage.getItem('gtc_user_id')) localStorage.setItem('gtc_user_id', String(userId)); } catch(e){}
      console.log('Subscription active — redirecting to /chat/');
      window.location.href = '/chat/';
      return true;
    }
    // stop early if API explicitly reports no user
    if (data && data.user_found === false) return false;
    await new Promise(r=>setTimeout(r, intervalMs));
  }
  return false;
}

// auto-run on pages where user id exists in localStorage or query param
(function(){
  try {
    const uid = localStorage.getItem('gtc_user_id') || localStorage.getItem('id') || (new URLSearchParams(location.search)).get('user_id');
    if (!uid) return;
    // run in background, do not block page
    checkAndRedirect(uid, 12, 5000).then(ok=>{
      if (!ok) console.log('Subscription not active or not detected after retries');
    });
  } catch(e){ console.log('subscription-check init error', e); }
})();
