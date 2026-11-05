// 임시 진단: 토큰 값은 출력하지 않고, 어떤 엔드포인트가 되는지만 출력한다.
const cases = [
  ['IG_TOKEN_MAIN', '17841479912616934'],
  ['IG_TOKEN_MILO', '17841455144621523'],
];
const show = (o) => JSON.stringify(o).replace(/"access_token":"[^"]+"/g, '"access_token":"***"').slice(0, 400);
for (const [env, id] of cases) {
  const tok = process.env[env];
  console.log(`\n===== ${env} (len ${tok?.length || 0}, prefix ${tok?.slice(0, 4)})`);
  if (!tok) continue;
  const t = encodeURIComponent(tok);
  const urls = {
    fb_debug: `https://graph.facebook.com/v21.0/debug_token?input_token=${t}&access_token=${t}`,
    fb_me: `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${t}`,
    fb_perms: `https://graph.facebook.com/v21.0/me/permissions?access_token=${t}`,
    fb_accounts: `https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account&access_token=${t}`,
    fb_id: `https://graph.facebook.com/v21.0/${id}?fields=id,username,followers_count&access_token=${t}`,
    ig_me: `https://graph.instagram.com/v21.0/me?fields=user_id,username,followers_count&access_token=${t}`,
    ig_id: `https://graph.instagram.com/v21.0/${id}?fields=id,username,followers_count&access_token=${t}`,
    ig_v23_id: `https://graph.instagram.com/v23.0/${id}?fields=id,username,followers_count&access_token=${t}`,
    fb_v23_id: `https://graph.facebook.com/v23.0/${id}?fields=id,username,followers_count&access_token=${t}`,
  };
  for (const [k, u] of Object.entries(urls)) {
    try { const r = await fetch(u); const j = await r.json(); console.log(k, r.status, show(j)); }
    catch (e) { console.log(k, 'ERR', e.message); }
  }
}
