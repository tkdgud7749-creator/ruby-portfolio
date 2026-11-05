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
  const F = 'https://graph.facebook.com/v23.0';
  const urls = {};
  for (const v of ['v24.0', 'v25.0', 'v26.0', 'v27.0']) urls[`ver_${v}`] = `https://graph.facebook.com/${v}/${id}?fields=id,username,followers_count&access_token=${t}`;
  Object.assign(urls, {
    me_all: `https://graph.facebook.com/v25.0/me?metadata=1&access_token=${t}`,
    assigned_ig: `https://graph.facebook.com/v25.0/me/assigned_instagram_accounts?access_token=${t}`,
    ig_users: `https://graph.facebook.com/v25.0/me/instagram_business_accounts?access_token=${t}`,
  });
  const _skip = {
    me_ig_accounts: `${F}/me/instagram_accounts?fields=id,username&access_token=${t}`,
    me_assigned_pages: `${F}/me/assigned_pages?fields=id,name,instagram_business_account&access_token=${t}`,
    me_businesses: `${F}/me/businesses?fields=id,name&access_token=${t}`,
    me_fields: `${F}/me?fields=id,name,instagram_accounts{id,username},business&access_token=${t}`,
    asset_milo: `${F}/1402000539654399?fields=id,username,followers_count&access_token=${t}`,
    asset_milo2: `${F}/1402000539654399?access_token=${t}`,
    asset_liora: `${F}/874690359071763?fields=id,username,followers_count&access_token=${t}`,
    asset_liora2: `${F}/874690359071763?access_token=${t}`,
    id_media: `${F}/${id}/media?fields=id&limit=1&access_token=${t}`,
    id_plain: `${F}/${id}?access_token=${t}`,
  };
  for (const [k, u] of Object.entries(urls)) {
    try { const r = await fetch(u); const j = await r.json(); console.log('D', k, r.status, k === 'me_all' ? JSON.stringify(Object.keys(j.metadata?.connections || {})).slice(0, 1500) : show(j)); }
    catch (e) { console.log(k, 'ERR', e.message); }
  }
}
