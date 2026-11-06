// 임시 진단: 페이스북 페이지 릴스 조회수를 가져올 수 있는지 확인 (토큰 값은 출력하지 않음)
const t = encodeURIComponent(process.env.IG_TOKEN_MAIN);
const F = 'https://graph.facebook.com/v21.0';
const j = async (u) => { const r = await fetch(u); return [r.status, await r.json()]; };
const short = (o) => JSON.stringify(o).replace(/"access_token":"[^"]+"/g, '"access_token":"***"').replace(/"fbtrace_id":"[^"]+"/g, '').slice(0, 700);
const [s, acc] = await j(`${F}/me/accounts?fields=id,name,access_token&access_token=${t}`);
console.log('D accounts', s, (acc.data || []).map((p) => p.name + ':' + p.id).join(', '), short(acc.error || {}));
for (const p of acc.data || []) {
  const pt = encodeURIComponent(p.access_token);
  for (const [k, u] of Object.entries({
    reels: `${F}/${p.id}/video_reels?fields=id,description,created_time,permalink_url&limit=3&access_token=${pt}`,
    videos: `${F}/${p.id}/videos?fields=id,description,created_time,permalink_url,views&limit=3&access_token=${pt}`,
  })) {
    const [st, d] = await j(u);
    console.log('D', p.name, k, st, short(d));
    const first = d.data?.[0];
    if (first) {
      for (const m of ['blue_reels_play_count', 'fb_reels_total_plays', 'post_video_views', 'total_video_views']) {
        const [s2, ins] = await j(`${F}/${first.id}/video_insights?metric=${m}&access_token=${pt}`);
        console.log('D', p.name, k, 'ins', m, s2, short(ins));
      }
    }
  }
}
