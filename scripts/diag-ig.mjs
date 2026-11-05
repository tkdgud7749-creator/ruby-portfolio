// 임시 진단: 토큰 값은 출력하지 않고, 어떤 엔드포인트가 되는지만 출력한다.
const tok = process.env.IG_TOKEN_MAIN;
const t = encodeURIComponent(tok);
const F = 'https://graph.facebook.com/v21.0';
const show = (o) => JSON.stringify(o).replace(/"fbtrace_id":"[^"]+"/g, '').slice(0, 600);
const urls = {
  me: `${F}/me?fields=id,name&access_token=${t}`,
  perms: `${F}/me/permissions?access_token=${t}`,
  assigned_ig: `${F}/me/assigned_instagram_accounts?fields=id,username&access_token=${t}`,
  assigned_pages: `${F}/me/assigned_pages?fields=id,name,instagram_business_account{id,username}&access_token=${t}`,
  accounts: `${F}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${t}`,
  liora_id: `${F}/17841479912616934?fields=id,username,followers_count&access_token=${t}`,
  liora_asset: `${F}/874690359071763?fields=id,username&access_token=${t}`,
  milo_id: `${F}/17841455144621523?fields=id,username,followers_count&access_token=${t}`,
};
for (const [k, u] of Object.entries(urls)) {
  try { const r = await fetch(u); const j = await r.json(); console.log('D', k, r.status, show(j)); }
  catch (e) { console.log('D', k, 'ERR', e.message); }
}
