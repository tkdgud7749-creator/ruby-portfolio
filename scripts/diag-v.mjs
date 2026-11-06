// 임시 진단: 공개 조회수(view_count)와 인사이트 조회수 비교
const t = encodeURIComponent(process.env.IG_TOKEN_MAIN);
const F = 'https://graph.facebook.com/v21.0';
const j = async (u) => (await fetch(u)).json();
const ids = { milo_lunaworld: '17841455144621523', liorasolveil: '17841479912616934' };
for (const [user, self] of Object.entries(ids)) {
  const bd = await j(`${F}/${self}?fields=business_discovery.username(${user}){media.limit(6){id,caption,view_count}}&access_token=${t}`);
  console.log('D', user, 'bd_err', JSON.stringify(bd.error || null));
  for (const m of bd.business_discovery?.media?.data || []) {
    const ins = await j(`${F}/${m.id}/insights?metric=views&access_token=${t}`);
    const direct = await j(`${F}/${m.id}?fields=view_count&access_token=${t}`);
    const d = ins.data?.[0];
    console.log('D', user, (m.caption || '').split('\n')[0].slice(0, 25), 'public', m.view_count, 'insights', d?.total_value?.value ?? d?.values?.[0]?.value, 'direct', JSON.stringify(direct).slice(0, 120));
  }
}
