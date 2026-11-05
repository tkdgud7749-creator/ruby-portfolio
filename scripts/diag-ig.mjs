// 임시 진단: 토큰 값은 출력하지 않고, 어떤 엔드포인트가 되는지만 출력한다.
const t = encodeURIComponent(process.env.IG_TOKEN_MAIN);
const F = 'https://graph.facebook.com/v21.0';
const MILO = '17841455144621523';
const show = (o) => JSON.stringify(o).replace(/"fbtrace_id":"[^"]+"/g, '').slice(0, 900);
const urls = {
  bd_views: `${F}/${MILO}?fields=business_discovery.username(liorasolveil){media.limit(2){id,view_count,like_count,comments_count}}&access_token=${t}`,
  bd_plays: `${F}/${MILO}?fields=business_discovery.username(liorasolveil){media.limit(2){id,play_count}}&access_token=${t}`,
  bd_url: `${F}/${MILO}?fields=business_discovery.username(liorasolveil){media.limit(2){id,caption,timestamp}}&access_token=${t}`,
  bd_hasurl: `${F}/${MILO}?fields=business_discovery.username(liorasolveil){media.limit(3){media_url}}&access_token=${t}`,
};
for (const [k, u] of Object.entries(urls)) {
  try { const r = await fetch(u); const j = await r.json(); console.log('D', k, r.status, k === 'bd_hasurl' ? JSON.stringify((j.business_discovery?.media?.data || []).map((m) => !!m.media_url)) + show(j.error || {}) : show(j)); }
  catch (e) { console.log('D', k, 'ERR', e.message); }
}
