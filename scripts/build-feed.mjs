// 채널(계정)별 인스타 + 구글 시트(X 링크·수동 분류)를 모아 site/data/feed.json 을 만든다.
// 채널 추가는 config.json 의 channels 에 한 덩어리를 더 넣으면 된다.
// GitHub Actions 에서 1시간마다 실행된다. 로컬 실행: node scripts/build-feed.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const FEED = path.join(SITE, 'data', 'feed.json');
const THUMBS = path.join(SITE, 'thumbs');
const IG = 'https://graph.instagram.com/v21.0';
const FB = 'https://graph.facebook.com/v21.0';

const cfg = JSON.parse(await fs.readFile(path.join(ROOT, 'config.json'), 'utf8'));
const loaded = await fs.readFile(FEED, 'utf8').then(JSON.parse).catch(() => null);
const prev = loaded && !loaded.demo && loaded.channels ? loaded : { items: [], channels: [] }; // 샘플·옛 형식은 이어받지 않는다
const prevItems = prev.items || [];
// 캡션에 적힌 제작 플랫폼(예: "Made with higgsfield.ai", "#DomoAI")을 배지로.
// 생성 모델(Seedance·Kling 등)은 플랫폼이 아니라서 넣지 않는다 — 모델은 config.json mediaKit.model 에 따로 적는다
const TOOLS = [
  ['Higgsfield', /higgsfield/i], ['DomoAI', /domo\s*ai|@domoai|#domo/i], ['Pollo AI', /pollo/i],
  ['Dreamina', /dreamina/i], ['Hailuo', /hailuo|minimax/i], ['Runway', /runway/i],
  ['PixVerse', /pixverse/i], ['Vidu', /\bvidu\b/i],
];
const TOOL_NAMES = new Set(TOOLS.map(([n]) => n));
const toolsOf = (text) => TOOLS.filter(([, re]) => re.test(String(text || ''))).map(([n]) => n);
const prevCount = (ch, key) => (prev.channels.find((c) => c.key === ch)?.followers || []).find((f) => f.key === key)?.count ?? null;
const channels = cfg.channels || [];
const log = (...a) => console.log('[feed]', ...a);

// ---------- helpers ----------
async function getJSON(url, headers = {}) {
  const r = await fetch(url, { headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${body?.error?.message || body?.title || ''}`.trim());
  return body;
}
async function pool(arr, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, arr.length) }, async () => { while (i < arr.length) await fn(arr[i++]); }));
}
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
// 해시태그·링크·빈 괄호를 걷어낸 뒤 글자가 남는 첫 줄을 제목으로 쓴다 ("[#광고]" 같은 줄은 건너뜀)
function cleanTitle(text) {
  for (const line of String(text || '').split('\n')) {
    const t = line.replace(/https?:\/\/\S+/g, '').replace(/#[\p{L}\p{N}_]+/gu, '').replace(/[\[(【]\s*[\])】]/g, '').replace(/\s{2,}/g, ' ').trim();
    if (/[\p{L}\p{N}]/u.test(t)) return t.length > 60 ? t.slice(0, 58) + '…' : t;
  }
  return '';
}
function episodeOf(title) {
  const m = String(title || '').match(/(?:ep|episode)\s*\.?\s*(\d+)/i) || String(title || '').match(/(\d+)\s*화/);
  return m ? Number(m[1]) : null;
}
function seasonOf(title) {
  const t = String(title || '');
  const m = t.match(/(\d+)\s*기(?![가-힣])/) || t.match(/\bseason\s*(\d+)/i) || t.match(/\bS(\d+)\s*E\d+/i);
  return m ? Number(m[1]) : null;
}
const firstMention = (text) => (String(text || '').match(/@([A-Za-z0-9_]{2,15})/) || [])[1] || null;
function seriesFromTitle(title, ch) {
  const t = norm(title);
  for (const [name, kws] of Object.entries(ch?.seriesKeywords || {})) if (kws.some((k) => t.includes(norm(k)))) return name;
  // "새시리즈 Ep.01" 처럼 쓰면 새 시리즈가 자동으로 생긴다
  const m = String(title || '').match(/^\s*(.{1,30}?)[\s\-–:|]*(?:ep|episode)\s*\.?\s*\d+/i);
  if (m) return m[1].trim();
  // 이름 없이 "EP.23 — ..." 로 시작하면 채널의 기본 시리즈로
  if (ch?.episodeSeries && /^\s*(?:ep|episode)\s*\.?\s*\d+/i.test(String(title || ''))) return ch.episodeSeries;
  return null;
}
function isAd(text) {
  const tags = (String(text || '').match(/#[\p{L}\p{N}_]+/gu) || []).map((h) => h.slice(1).toLowerCase());
  const adTags = (cfg.adHashtags || []).map((h) => h.toLowerCase());
  if (tags.some((t) => adTags.includes(t))) return true;
  const low = String(text || '').toLowerCase();
  return (cfg.adPhrases || []).some((p) => low.includes(p.toLowerCase()));
}
const igCode = (url) => (String(url).match(/instagram\.com\/(?:[^/]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/) || [])[1];
const xId = (url) => (String(url).match(/(?:x|twitter)\.com\/[^/]+\/status(?:es)?\/(\d+)/) || [])[1];
const truthy = (v) => /^(o|y|yes|true|1|v|✓|✔|광고)$/i.test(String(v || '').trim());

// ---------- Instagram ----------
async function fetchByDiscovery(ch, t, via) {
  const user = ch.instagram.handle;
  const F = 'id,caption,media_type,media_product_type,thumbnail_url,permalink,timestamp,like_count,comments_count,view_count';
  const media = [];
  let after = '', info = null;
  for (let n = 0; n < 30; n++) {
    const m = after ? `media.after(${after}).limit(50){${F}}` : `media.limit(50){${F}}`;
    const r = await getJSON(`${FB}/${via}?fields=business_discovery.username(${user}){username,followers_count,${m}}&access_token=${t}`);
    const bd = r.business_discovery;
    info ||= bd;
    media.push(...(bd.media?.data || []));
    after = bd.media?.paging?.cursors?.after;
    if (!after || !bd.media?.paging?.next && (bd.media?.data || []).length < 50) break;
  }
  const videos = media.filter((m) => m.media_type === 'VIDEO');
  log(`${ch.key}: @${info.username} 공개 정보로 영상 ${videos.length}개, 팔로워 ${info.followers_count}`);
  return {
    followers: info.followers_count ?? null,
    username: info.username,
    items: videos.map((m) => ({
      id: `ig-${m.id}`, platform: 'instagram', channel: ch.key, url: m.permalink, code: igCode(m.permalink),
      caption: m.caption || '', title: cleanTitle(m.caption), thumbSrc: m.thumbnail_url || null, video: null,
      views: m.view_count ?? null, likes: m.like_count ?? null, date: m.timestamp,
    })),
  };
}

// 미디어킷용 계정 통계: 최근 30일 도달·조회·상호작용, 팔로워 연령·성별·국가 (인스타 공식 인사이트)
async function accountStats(ch, t, node) {
  const out = { asOf: new Date().toISOString().slice(0, 10) };
  const until = Math.floor(Date.now() / 1000), since = until - 30 * 86400;
  for (const m of ['reach', 'views', 'total_interactions', 'accounts_engaged']) {
    try {
      const r = await getJSON(`${FB}/${node}/insights?metric=${m}&period=day&metric_type=total_value&since=${since}&until=${until}&access_token=${t}`);
      const v = r.data?.[0]?.total_value?.value;
      if (v != null) out[m] = v;
    } catch (e) { log(`${ch.key}: 인사이트 ${m} 실패`, e.message); }
  }
  for (const b of ['age', 'gender', 'country']) {
    try {
      const r = await getJSON(`${FB}/${node}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=${b}&access_token=${t}`);
      const rows = r.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
      const total = rows.reduce((a, x) => a + (x.value || 0), 0);
      if (total) out[b] = rows.map((x) => ({ k: x.dimension_values?.[0], p: Math.round((x.value / total) * 1000) / 10 })).sort((a, z) => z.p - a.p);
    } catch (e) { log(`${ch.key}: 팔로워 ${b} 분포 실패`, e.message); }
  }
  return out;
}

async function saveImage(src, file, opts) {
  if (!sharp || !src) return false;
  try {
    const r = await fetch(src);
    if (!r.ok) throw new Error(r.status);
    let img = sharp(Buffer.from(await r.arrayBuffer())).resize(opts);
    img = file.endsWith('.jpg') ? img.jpeg({ quality: 80 }) : img.webp({ quality: 80 });
    await img.toFile(file);
    return true;
  } catch (e) { log('이미지 저장 실패', path.basename(file), e.message); return false; }
}

async function fetchInstagram(ch) {
  const acc = ch.instagram;
  const token = process.env[acc.tokenEnv];
  if (!token) { log(`${ch.key}: 인스타 토큰 없음(${acc.tokenEnv}) → 이전 데이터 유지`); return null; }
  const t = encodeURIComponent(token);
  // 인스타 로그인 토큰(graph.instagram.com)과 통합 로그인·시스템 사용자 토큰(graph.facebook.com) 모두 지원
  let base = IG, node = 'me', me;
  try {
    me = await getJSON(`${IG}/me?fields=user_id,username,followers_count&access_token=${t}`);
  } catch {
    base = FB;
    node = acc.igUserId;
    if (!node) {
      const acc2 = await getJSON(`${FB}/me/accounts?fields=instagram_business_account{id,username}&limit=100&access_token=${t}`);
      const igs = (acc2.data || []).map((p) => p.instagram_business_account).filter(Boolean);
      node = (igs.find((a) => a.username?.toLowerCase() === acc.handle?.toLowerCase()) || igs[0])?.id;
    }
    if (!node) throw new Error('인스타 계정 ID를 찾지 못함 (config의 instagram.igUserId 필요)');
    try {
      me = await getJSON(`${FB}/${node}?fields=id,username,followers_count,media_count,profile_picture_url&access_token=${t}`);
    } catch (e) {
      // 직접 권한이 없으면, 같은 토큰으로 읽히는 다른 채널 계정을 통해 공개 정보(비즈니스 디스커버리)로 가져온다
      const viaList = cfg.channels.map((c) => c.instagram?.igUserId).filter((id) => id && id !== node);
      for (const via of viaList) {
        try { return await fetchByDiscovery(ch, t, via); } catch {}
      }
      throw e;
    }
  }
  const media = [];
  let url = `${base}/${node}/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50&access_token=${t}`;
  while (url && media.length < 1000) { const page = await getJSON(url); media.push(...(page.data || [])); url = page.paging?.next; }
  const videos = media.filter((m) => m.media_type === 'VIDEO');
  await pool(videos, 4, async (m) => {
    try {
      const ins = await getJSON(`${base}/${m.id}/insights?metric=views&access_token=${t}`);
      const d = ins.data?.[0];
      m.views = d?.total_value?.value ?? d?.values?.[0]?.value ?? null;
    } catch { m.views = null; }
  });
  // 인사이트 views는 인스타 단독 수치. 인스타 앱에 보이는 숫자(페이스북 공유 재생 포함)는 공개 정보의 view_count라 그걸 우선 쓴다
  if (base === FB) {
    try {
      const pub = await fetchByDiscovery(ch, t, node);
      const map = new Map(pub.items.map((i) => [i.id, i.views]));
      for (const m of videos) { const v = map.get(`ig-${m.id}`); if (v != null) m.views = v; }
    } catch (e) { log(`${ch.key}: 공개 조회수 실패 → 인스타 단독 조회수 사용`, e.message); }
  }
  log(`${ch.key}: @${me.username} 영상 ${videos.length}개, 팔로워 ${me.followers_count}`);
  const stats = base === FB ? await accountStats(ch, t, node) : null;
  return {
    followers: me.followers_count ?? null,
    username: me.username,
    avatarSrc: me.profile_picture_url || null,
    mediaCount: me.media_count ?? null,
    stats,
    items: videos.map((m) => ({
      id: `ig-${m.id}`,
      platform: 'instagram',
      channel: ch.key,
      url: m.permalink,
      code: igCode(m.permalink),
      caption: m.caption || '',
      title: cleanTitle(m.caption),
      thumbSrc: m.thumbnail_url || null,
      video: m.media_url || null,
      views: m.views ?? null,
      likes: m.like_count ?? null,
      date: m.timestamp,
    })),
  };
}

// ---------- X (공개 임베드 데이터, 무료) ----------
const xToken = (id) => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
async function fetchTweet(id, link) {
  const d = await getJSON(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=ko&token=${xToken(id)}`);
  const md = (d.mediaDetails || []).find((m) => m.type === 'video' || m.type === 'animated_gif') || (d.mediaDetails || [])[0];
  const mp4 = (md?.video_info?.variants || []).filter((v) => v.content_type === 'video/mp4').sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  const pick = mp4.find((v) => (v.bitrate || 0) <= 2_500_000) || mp4[mp4.length - 1];
  const oi = md?.original_info;
  return {
    id: `x-${id}`,
    platform: 'x',
    author: d.user?.screen_name || null,
    url: link,
    caption: d.text || '',
    title: cleanTitle(d.text),
    thumbSrc: md?.media_url_https || d.video?.poster || null,
    video: pick?.url || null,
    views: d.video?.viewCount || null, // 임베드 데이터는 보통 0을 준다 → 시트 조회수 칸 사용
    aspect: oi?.width && oi?.height ? Math.round((oi.width / oi.height) * 1000) / 1000 : null,
    date: d.created_at,
  };
}

// ---------- Google Sheet ----------
function parseCSV(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
async function readSheet() {
  const url = process.env[cfg.sheetCsvEnv];
  if (!url) { log('시트 주소 없음 → 시트 항목 건너뜀'); return []; }
  let text;
  if (/^https?:/i.test(url)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`시트 ${r.status}`);
    text = await r.text();
  } else text = await fs.readFile(url, 'utf8'); // 로컬 테스트용 CSV 파일
  const [head, ...rows] = parseCSV(text.replace(/^﻿/, ''));
  const col = (...names) => head.findIndex((h) => names.some((n) => norm(h) === norm(n)));
  const ix = { link: col('링크', 'link', 'url'), channel: col('채널', '계정', 'channel'), series: col('시리즈', 'series'), ad: col('광고', 'ad'), brand: col('브랜드', 'brand'),
    title: col('제목', 'title'), views: col('조회수', 'views'), hide: col('숨김', 'hide') };
  const get = (r, k) => (ix[k] >= 0 ? String(r[ix[k]] ?? '').trim() : '');
  return rows.map((r) => ({
    link: get(r, 'link'), channel: get(r, 'channel'), series: get(r, 'series'), ad: truthy(get(r, 'ad')), brand: get(r, 'brand'),
    title: get(r, 'title'), views: get(r, 'views') ? Number(get(r, 'views').replace(/[^\d]/g, '')) : null, hide: truthy(get(r, 'hide')),
  })).filter((r) => r.link);
}

// ---------- thumbnails ----------
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { log('sharp 없음 → 원본 썸네일 주소 사용'); }
async function localThumb(it) {
  if (!it.thumbSrc) return null;
  const file = path.join(THUMBS, `${it.id}.webp`);
  const rel = `thumbs/${it.id}.webp`;
  try { await fs.access(file); return rel; } catch {}
  if (!sharp) return it.thumbSrc;
  try {
    const r = await fetch(it.thumbSrc);
    if (!r.ok) throw new Error(r.status);
    await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 360, withoutEnlargement: true }).webp({ quality: 70 }).toFile(file);
    return rel;
  } catch (e) { log('썸네일 실패', it.id, e.message); return it.thumbSrc; }
}


// ---------- main ----------
await fs.mkdir(THUMBS, { recursive: true });
const items = new Map();
const chOut = [];
const findChannel = (v) => channels.find((c) => norm(c.key) === norm(v) || norm(c.name) === norm(v));
const channelOfX = (handle) => channels.find((c) => c.x?.handle && norm(c.x.handle) === norm(handle));

for (const ch of channels) {
  const followers = [];
  const prevCh = (prev.channels || []).find((c) => c.key === ch.key) || {};
  let avatar = ch.avatar || prevCh.avatar || '';
  let stats = prevCh.stats || null;

  if (ch.instagram?.handle) {
    let res = null;
    try { res = await fetchInstagram(ch); } catch (e) { log(`${ch.key} 인스타 실패: ${e.message} → 이전 데이터 유지`); }
    const old = prevItems.filter((i) => i.platform === 'instagram' && i.channel === ch.key && !i.id.startsWith('ig-link-'));
    for (const it of res ? res.items : old) items.set(it.id, it);
    if (res?.stats) stats = res.stats;
    if (!ch.avatar && res?.avatarSrc && await saveImage(res.avatarSrc, path.join(THUMBS, `avatar-${ch.key}.webp`), { width: 160, height: 160, fit: 'cover' })) avatar = `thumbs/avatar-${ch.key}.webp`;
    followers.push({ key: 'instagram', label: 'Instagram', url: `https://www.instagram.com/${res?.username || ch.instagram.handle}/`, count: res ? res.followers : prevCount(ch.key, 'instagram') });
  }

  const fb = ch.facebook;
  if (fb?.pageId) {
    let count = fb.followersManual ?? prevCount(ch.key, 'facebook');
    const token = process.env[fb.tokenEnv];
    if (token) {
      const tk = encodeURIComponent(token);
      try {
        const p = await getJSON(`${FB}/${fb.pageId}?fields=followers_count,fan_count&access_token=${tk}`);
        count = p.followers_count ?? p.fan_count ?? count;
      } catch (e) {
        // 프로필 주소의 숫자와 Graph 페이지 ID가 다를 수 있어, 토큰이 관리하는 페이지 목록에서 이름으로 찾는다
        try {
          const list = await getJSON(`${FB}/me/accounts?fields=id,name,followers_count,fan_count&limit=100&access_token=${tk}`);
          const pg = (list.data || []).find((x) => x.id === fb.pageId || (fb.pageName && x.name?.toLowerCase() === fb.pageName.toLowerCase()));
          if (!pg) throw new Error(`페이지 목록에 없음 (${(list.data || []).map((x) => `${x.name}:${x.id}`).join(', ')})`);
          count = pg.followers_count ?? pg.fan_count ?? count;
        } catch (e2) { log(`${ch.key} 페이스북 실패`, e2.message); }
      }
    }
    followers.push({ key: 'facebook', label: 'Facebook', url: fb.url, count });
  }

  if (ch.x?.handle) {
    let count = ch.x.followersManual ?? null;
    const bearer = process.env[ch.x.bearerEnv];
    if (bearer) {
      try {
        const u = await getJSON(`https://api.x.com/2/users/by/username/${ch.x.handle}?user.fields=public_metrics`, { Authorization: `Bearer ${bearer}` });
        count = u.data?.public_metrics?.followers_count ?? count;
      } catch (e) { log(`${ch.key} X 팔로워 실패(수동 값 사용)`, e.message); }
    }
    if (count == null) count = prevCount(ch.key, 'x');
    followers.push({ key: 'x', label: 'X', url: `https://x.com/${ch.x.handle}`, count });
  }

  chOut.push({ key: ch.key, name: ch.name, tagline: ch.tagline || '', avatar, followers, seriesOrder: ch.seriesOrder || [], stats, kit: ch.mediaKit || null, theme: ch.theme || "dark" });
}

let sheet = null;
try { sheet = await readSheet(); log(`시트 ${sheet.length}줄`); } catch (e) { log('시트 실패', e.message); }
if (!sheet || !process.env[cfg.sheetCsvEnv]) {
  // 시트를 못 읽으면 지난번에 시트로 들어온 영상(X·링크)을 그대로 유지한다
  for (const p of prevItems) if (p.platform === 'x' || p.id.startsWith('ig-link-')) items.set(p.id, { ...p, sheet: p._sheet });
  sheet = [];
}
const byCode = new Map([...items.values()].filter((i) => i.code).map((i) => [i.code, i]));
await pool(sheet, 4, async (row) => {
  let it = null;
  const tid = xId(row.link);
  const code = igCode(row.link);
  if (tid) {
    try { it = await fetchTweet(tid, row.link); }
    catch (e) { log('X 글 실패', tid, e.message); it = prevItems.find((p) => p.id === `x-${tid}`) || { id: `x-${tid}`, platform: 'x', url: row.link, title: '', date: null }; }
    // 채널: 시트 채널 칸 → X 계정 이름으로 자동 매칭 → 첫 번째 채널
    it.channel = findChannel(row.channel)?.key || channelOfX(it.author || (row.link.match(/(?:x|twitter)\.com\/([^/]+)/) || [])[1])?.key || it.channel || channels[0]?.key;
    items.set(it.id, it);
  } else if (code) {
    it = byCode.get(code);
    if (!it) {
      it = { id: `ig-link-${code}`, platform: 'instagram', url: row.link, title: '', date: null };
      it.channel = findChannel(row.channel)?.key || channels[0]?.key;
      items.set(it.id, it);
    }
  } else return;
  it.sheet = row;
});

const out = [];
for (const it of items.values()) {
  const s = it.sheet || {};
  const ch = channels.find((c) => c.key === it.channel) || channels[0];
  const title = s.title || it.title || '';
  const item = {
    id: it.id,
    channel: ch?.key,
    platform: it.platform,
    url: it.url,
    title,
    thumb: await localThumb(it),
    video: it.video || null,
    views: s.views ?? it.views ?? null,
    aspect: it.aspect ?? (it.platform === 'instagram' ? 0.5625 : null),
    date: it.date || null,
    series: s.series || seriesFromTitle(title, ch) || null,
    season: seasonOf(title),
    episode: episodeOf(title),
    ad: false,
    brand: null,
    // 다음 실행 때 계정 연결이 실패하면 이 값으로 이어 쓴다 (캡션 전체는 무거워서 저장하지 않음)
    _ad: it.caption != null ? isAd(it.caption) : Boolean(it._ad),
    _mention: it.caption != null ? firstMention(it.caption) : it._mention || null,
    tools: it.caption != null ? toolsOf(it.caption) : (it.tools || []).filter((n) => TOOL_NAMES.has(n)),
    code: it.code || undefined,
    thumbSrc: it.thumbSrc || undefined,
    _sheet: it.sheet || undefined,
  };
  item.ad = Boolean(s.ad) || item._ad;
  if (item.ad) item.brand = s.brand || (item._mention ? '@' + item._mention : null);
  if (s.hide) item.hidden = true;
  out.push(item);
}
out.sort((a, b) => +new Date(b.date || 0) - +new Date(a.date || 0));

// 이번 주 조회수 증가: 날짜별 조회수 기록(최근 9일)을 남겨, 7일 전(없으면 가장 오래된 기록)과 비교한다
const HIST = path.join(SITE, 'data', 'history.json');
const hist = await fs.readFile(HIST, 'utf8').then(JSON.parse).catch(() => ({}));
const today = new Date().toISOString().slice(0, 10);
hist[today] = Object.fromEntries(out.filter((i) => i.views != null).map((i) => [i.id, i.views]));
for (const d of Object.keys(hist)) if ((Date.parse(today) - Date.parse(d)) / 864e5 > 9) delete hist[d];
const days = Object.keys(hist).sort();
const base = days.filter((d) => (Date.parse(today) - Date.parse(d)) / 864e5 >= 7).pop() || (days[0] !== today ? days[0] : null);
for (const i of out) {
  if (i.views == null) continue;
  const was = base ? hist[base][i.id] : undefined;
  if (was != null) i.weekGain = Math.max(0, i.views - was);
  else if (i.date && Date.parse(today) - Date.parse(i.date) < 7 * 864e5) i.weekGain = i.views; // 이번 주에 올린 영상은 전부 이번 주 조회
}
await fs.writeFile(HIST, JSON.stringify(hist));
const weekBase = base;

const feed = {
  updatedAt: new Date().toISOString(),
  weekBase,
  contact: cfg.contact,
  channels: chOut,
  items: out,
};
await fs.mkdir(path.dirname(FEED), { recursive: true });
await fs.writeFile(FEED, JSON.stringify(feed, null, 1));

// 링크 미리보기(카톡·DM) 이미지: 첫 채널 조회수 상위 3편 썸네일을 이어 붙인 1200x630
if (sharp) {
  try {
    const top = out.filter((i) => i.channel === chOut[0]?.key && !i.ad && !i.hidden && i.thumb && !/^https?:/.test(i.thumb))
      .sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    if (top.length === 3) {
      const tiles = await Promise.all(top.map((i) => sharp(path.join(SITE, i.thumb)).resize(400, 630, { fit: 'cover' }).toBuffer()));
      const ogFile = path.join(THUMBS, 'og.jpg');
      const buf = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0b0b0d' } })
        .composite(tiles.map((input, k) => ({ input, left: k * 400, top: 0 }))).jpeg({ quality: 82 }).toBuffer();
      const old = await fs.readFile(ogFile).catch(() => null);
      if (!old || !old.equals(buf)) await fs.writeFile(ogFile, buf);
    }
  } catch (e) { log('미리보기 이미지 실패', e.message); }
}
for (const c of chOut) {
  const mine = out.filter((i) => i.channel === c.key);
  log(`${c.key}: 영상 ${mine.length}개, 시리즈 ${new Set(mine.map((i) => i.series).filter(Boolean)).size}개, 광고 ${mine.filter((i) => i.ad).length}개`);
}

