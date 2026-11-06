(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const one = (x) => String(Math.round(x * 10) / 10);

  // ---------- 한국어/영어 ----------
  let lang = 'ko';
  try { lang = localStorage.getItem('lang') === 'en' ? 'en' : (localStorage.getItem('lang') ? 'ko' : (navigator.language || '').startsWith('ko') ? 'ko' : 'en'); } catch {}
  const DICT = {
    ko: {
      works: '작품', series: '시리즈', ads: '광고 작업', kit: '미디어킷', contact: '광고 문의',
      pop: '인기순', latest: '최신순', week: '이번 주 인기',
      views: '조회수', weekGain: (v) => `이번 주 +${v}`, followers: '총 팔로워', totalViews: '누적 조회수', count: '작품', eps: (n) => `${n}편`,
      updated: '마지막 업데이트', loadFail: '영상을 불러오지 못했어요. 잠시 후 다시 열어 주세요.',
      noVideos: '아직 영상이 없어요.', noAds: '광고 작업이 아직 없어요.', noSeries: '아직 시리즈가 없어요.', noSuch: (n) => `“${n}” 시리즈는 아직 없어요.`,
      untitled: '제목 없음', play: '재생', sum: (v) => `누적 ${v}`,
      season: (s) => `${s}기`, ep: (e) => `${e}화`,
      copyLink: '링크 복사', copied: '링크를 복사했어요', close: '닫기', prev: '이전 영상', next: '다음 영상', orig: '원본에서 보기',
      viewOn: (p) => `${p}에서 보기`, onlyOrig: '이 영상은 원본에서 볼 수 있어요.', demoVid: '샘플 데이터라 영상이 없어요. 계정을 연결하면 여기서 바로 재생돼요.',
      demo: '샘플 데이터로 보여 주는 시안이에요. 계정을 연결하면 실제 영상으로 바뀝니다.',
      dlgTitle: '광고·협업 문의', dlgSub: '브랜드·제품 소개와 원하시는 일정을 보내 주세요. 확인 후 빠르게 회신드릴게요.',
      copyMail: '주소 복사', gmail: 'Gmail로 쓰기', mailApp: '메일 앱으로 쓰기', mailCopied: '메일 주소를 복사했어요.',
      subject: (n) => `[광고 문의] ${n} 협업 제안`,
      body: ['안녕하세요, 협업 제안드립니다.', '', '- 브랜드/제품:', '- 원하는 콘텐츠 형식:', '- 희망 일정:', '- 예산(선택):', '- 담당자 연락처:', ''],
      fitLabel: '이런 브랜드와 잘 맞아요', numbers: '숫자로 보는 채널', avgViews: '영상당 평균 조회수', sumOf: (n) => `영상 ${n}편 합계`,
      reach: '월간 도달', monthViews: '월간 조회수', inter: '월간 상호작용', last30: '최근 30일 · 인스타그램', interSub: '좋아요·댓글·저장·공유',
      audience: '누가 보나요', age: '연령', gender: '성별', disclosed: '(공개 기준)', country: '국가', F: '여성', M: '남성',
      topWorks: '대표 작품', collabs: '브랜드 협업', withBrands: '함께한 브랜드', toolsUsed: '제작 툴', services: '제작 상품', process: '진행 과정',
      steps: ['문의·브리프', '기획안 제안', '제작', '수정·컨펌', '발행·리포트'], faq: '자주 묻는 질문',
      ctaH: '함께 만들어 볼까요?', ctaP: '브랜드·제품 소개와 원하시는 일정만 보내 주세요.', pdf: 'PDF로 저장', src: '수치는 인스타그램 공식 API 기준',
      langBtn: 'EN', langLabel: 'Switch to English',
    },
    en: {
      works: 'Works', series: 'Series', ads: 'Brand work', kit: 'Media kit', contact: 'Contact',
      pop: 'Popular', latest: 'Latest', week: 'This week',
      views: 'views', weekGain: (v) => `+${v} this week`, followers: 'Followers', totalViews: 'Total views', count: 'Videos', eps: (n) => `${n}`,
      updated: 'Updated', loadFail: "Couldn't load videos. Please try again shortly.",
      noVideos: 'No videos yet.', noAds: 'No brand work yet.', noSeries: 'No series yet.', noSuch: (n) => `No series called “${n}” yet.`,
      untitled: 'Untitled', play: 'Play', sum: (v) => `${v} total`,
      season: (s) => `S${s}`, ep: (e) => `E${e}`,
      copyLink: 'Copy link', copied: 'Link copied', close: 'Close', prev: 'Previous video', next: 'Next video', orig: 'View original',
      viewOn: (p) => `View on ${p}`, onlyOrig: 'This video plays on the original site.', demoVid: 'Sample data — no video yet.',
      demo: 'This is a preview with sample data.',
      dlgTitle: 'Brand partnership inquiry', dlgSub: 'Tell us about your brand or product and your timeline. We will get back to you soon.',
      copyMail: 'Copy address', gmail: 'Write in Gmail', mailApp: 'Open mail app', mailCopied: 'Email address copied.',
      subject: (n) => `[Partnership] Proposal for ${n}`,
      body: ['Hello, we would like to propose a collaboration.', '', '- Brand/product:', '- Content format:', '- Timeline:', '- Budget (optional):', '- Contact:', ''],
      fitLabel: 'A good fit for', numbers: 'Channel at a glance', avgViews: 'Avg. views per video', sumOf: (n) => `across ${n} videos`,
      reach: 'Monthly reach', monthViews: 'Monthly views', inter: 'Monthly interactions', last30: 'Last 30 days · Instagram', interSub: 'Likes, comments, saves, shares',
      audience: 'Audience', age: 'Age', gender: 'Gender', disclosed: '(disclosed)', country: 'Country', F: 'Female', M: 'Male',
      topWorks: 'Top works', collabs: 'Brand collaborations', withBrands: 'Brands', toolsUsed: 'Tools', services: 'Packages', process: 'How we work',
      steps: ['Inquiry & brief', 'Proposal', 'Production', 'Revisions', 'Publish & report'], faq: 'FAQ',
      ctaH: "Let's make something together.", ctaP: 'Send us your brand, product and timeline.', pdf: 'Save as PDF', src: 'Figures from the official Instagram API',
      langBtn: '한국어', langLabel: '한국어로 보기',
    },
  };
  const t = (k, ...a) => { const v = DICT[lang][k] ?? DICT.ko[k]; return typeof v === 'function' ? v(...a) : v; };

  const fmt = (n) => {
    if (n == null || isNaN(n)) return '';
    if (lang === 'en') {
      if (n >= 1e9) return one(n / 1e9) + 'B';
      if (n >= 1e6) return one(n / 1e6) + 'M';
      if (n >= 1e4) return Math.round(n / 1e3) + 'K';
      return Number(n).toLocaleString('en-US');
    }
    if (n >= 1e8) return one(n / 1e8) + '억';
    if (n >= 1e7) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
    if (n >= 1e4) return one(n / 1e4) + '만';
    return Number(n).toLocaleString('ko-KR');
  };
  const hue = (s) => [...String(s || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 17);
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
  const time = (it) => +new Date(it.date || 0);
  const isNew = (it) => it.date && Date.now() - time(it) < 7 * 864e5;
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const ICON = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM16 2H8a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V8a6 6 0 0 0-6-6zm4.2 14a4.2 4.2 0 0 1-4.2 4.2H8A4.2 4.2 0 0 1 3.8 16V8A4.2 4.2 0 0 1 8 3.8h8A4.2 4.2 0 0 1 20.2 8z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.4V14h2.7v8z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>',
  };

  let feed;
  let ch;          // 지금 선택된 채널(계정)
  let items = [];  // 그 채널의 영상
  let list = [];
  let cur = -1;
  let sort = 'pop';
  const video = $('#video');
  const link = (...parts) => '#/' + [ch.key, ...parts].map(encodeURIComponent).join('/');

  init();

  async function init() {
    applyLang();
    try {
      const r = await fetch('data/feed.json', { cache: 'no-cache' });
      feed = await r.json();
    } catch (e) {
      $('#grid').innerHTML = `<p class="empty">${t('loadFail')}</p>`;
      return;
    }
    feed.items = (feed.items || []).filter((i) => !i.hidden);
    feed.channels = feed.channels || [];
    setupContact(feed.contact || {});
    $('#demo').hidden = !feed.demo;
    window.addEventListener('hashchange', route);
    route();
  }

  // 화면에 고정된 글자(탭·버튼·대화상자)를 지금 언어로 바꾼다
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-t-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.tLabel)); });
    $('#lang').textContent = t('langBtn');
    $('#lang').setAttribute('aria-label', t('langLabel'));
    if (feed?.updatedAt) {
      const d = new Date(feed.updatedAt);
      $('#updated').textContent = `${t('updated')} ${d.toLocaleString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
  }
  $('#lang').addEventListener('click', () => {
    lang = lang === 'ko' ? 'en' : 'ko';
    try { localStorage.setItem('lang', lang); } catch {}
    applyLang();
    route();
  });

  // ---------- 광고 문의: PC에 메일 앱이 없으면 mailto가 아무 반응이 없어서, Gmail·메일 앱·주소 복사를 함께 준다 ----------
  let mailAddr = '';
  function setupContact(c) {
    if (!c.user || !c.domain) { $('#contact').hidden = true; return; }
    mailAddr = `${c.user}@${c.domain}`;
    $('#contact').addEventListener('click', openContact);
    $('#copyMail').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mailAddr); $('#copyNote').textContent = t('mailCopied'); }
      catch { $('#copyNote').textContent = mailAddr; }
    });
    $('#contactDlg').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  }
  function openContact() {
    const subject = t('subject', ch?.name || '');
    const body = t('body').join('\n');
    const q = `su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#mailAddr').textContent = mailAddr;
    $('#gmailLink').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(mailAddr)}&${q}`;
    $('#mailtoLink').href = `mailto:${mailAddr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#copyNote').textContent = '';
    const d = $('#contactDlg');
    if (d.showModal) d.showModal(); else location.href = $('#mailtoLink').href;
  }

  const total = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
  const ymd = (d) => { const tt = new Date(d); return isNaN(tt) ? '' : `${tt.getFullYear()}.${String(tt.getMonth() + 1).padStart(2, '0')}.${String(tt.getDate()).padStart(2, '0')}`; };

  function renderChannel() {
    document.body.dataset.theme = ch.theme || 'dark';
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = ch.theme === 'warm' ? '#fff6ee' : '#0b0b0d';
    const sw = $('#channels');
    sw.hidden = feed.channels.length < 2;
    sw.innerHTML = feed.channels.map((c) => `<a href="#/${encodeURIComponent(c.key)}"${c === ch ? ' aria-current="page"' : ''}>
      <span class="mini">${c.avatar ? `<img src="${esc(c.avatar)}" alt="">` : esc((c.name || '?').slice(0, 1))}</span>${esc(c.name)}</a>`).join('');
    $('#name').textContent = ch.name || '';
    $('#tagline').textContent = ch.tagline || '';
    document.title = `${ch.name} · ${ch.tagline || 'Portfolio'}`;
    if (ch.avatar) $('#avatar').innerHTML = `<img src="${esc(ch.avatar)}" alt="">`;
    else $('#avatar').textContent = (ch.name || '?').slice(0, 1);
    $('#avatar').style.background = `hsl(${hue(ch.key)} 70% 58%)`;
    $('#followers').innerHTML = (ch.followers || [])
      .filter((f) => f.count != null)
      .map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener" aria-label="${esc(f.label)} ${fmt(f.count)}">${ICON[f.key] || esc(f.label)} <b>${fmt(f.count)}</b></a></li>`)
      .join('');
    document.querySelectorAll('.tabs a').forEach((a) => {
      a.href = a.dataset.tab === 'works' ? link() : link(a.dataset.tab);
    });
    $('#kitBtn').href = link('kit');
  }

  // 첫 화면 상단: 이번 주 가장 많이 오른 작품(없으면 전체 1위) + 채널 숫자 요약
  function renderHero(works) {
    const hero = $('#hero');
    const weekly = works.filter((i) => i.weekGain > 0).sort((a, b) => b.weekGain - a.weekGain || byViews(a, b));
    const top = weekly[0] || works.slice().sort(byViews)[0];
    if (!top) { hero.hidden = true; return; }
    const idx = list.indexOf(top);
    const fol = total(ch.followers || [], (f) => f.count);
    const views = total(items, (i) => i.views);
    const tag = [top.series ? [top.series, epLabel(top)].filter(Boolean).join(' ') : '', ymd(top.date)].filter(Boolean).join(' · ');
    hero.hidden = false;
    hero.innerHTML = `
      <div class="hero-txt">
        <p class="big">${weekly[0] ? 'Best of<br>the week' : 'All-time<br>best'}</p>
        <h2>${esc(top.title || '')}</h2>
        <div class="hero-views">
          <button class="pbtn" type="button" data-play="${idx}" aria-label="${esc(t('play'))}">${EYE}</button>
          ${top.views != null ? `<b>${fmt(top.views)}</b><span>${t('views')}</span>` : ''}
        </div>
        <p class="hero-note">${esc([weekly[0] ? t('weekGain', fmt(top.weekGain)) : '', tag].filter(Boolean).join(' · '))}</p>
        <dl class="stats">
          ${fol ? `<div><dt>${t('followers')}</dt><dd>${fmt(fol)}</dd></div>` : ''}
          ${views ? `<div><dt>${t('totalViews')}</dt><dd>${fmt(views)}</dd></div>` : ''}
          <div><dt>${t('count')}</dt><dd>${t('eps', items.length)}</dd></div>
        </dl>
      </div>
      <button class="hero-art card" type="button" data-play="${idx}" aria-label="${esc(top.title || '')} ${esc(t('play'))}"${top.video ? ` data-v="${esc(top.video)}"` : ''}>${thumb(top, '', false)}<span class="play">${EYE}</span>${badges(top) ? `<span class="badges">${badges(top)}</span>` : ''}</button>`;
  }
  $('#hero').addEventListener('click', (e) => { const b = e.target.closest('[data-play]'); if (b && +b.dataset.play >= 0) openPlayer(+b.dataset.play); });

  function seriesList() {
    const m = new Map();
    for (const it of items) {
      if (!it.series) continue;
      const key = norm(it.series);
      if (!m.has(key)) m.set(key, { name: it.series, items: [] });
      m.get(key).items.push(it);
    }
    const order = (ch.seriesOrder || []).map(norm);
    const rank = (s) => { const i = order.indexOf(norm(s.name)); return i < 0 ? 1e9 : i; };
    return [...m.values()].sort((a, b) => rank(a) - rank(b) || Math.max(...b.items.map(time)) - Math.max(...a.items.map(time)));
  }
  const byViews = (a, b) => (b.views ?? -1) - (a.views ?? -1) || time(b) - time(a);
  const byNew = (a, b) => time(b) - time(a);
  const byWeek = (a, b) => (b.weekGain ?? -1) - (a.weekGain ?? -1) || byViews(a, b);
  const byEpisode = (a, b) => (a.season ?? 1) - (b.season ?? 1) || (a.episode ?? 1e9) - (b.episode ?? 1e9) || time(a) - time(b);
  const epLabel = (it) => [it.season ? t('season', it.season) : '', it.episode ? t('ep', it.episode) : ''].filter(Boolean).join(' ');

  function route() {
    closePlayer();
    // 주소 형식: #/채널/탭/시리즈이름  (채널을 빼면 첫 번째 채널),  #/채널/v/영상ID = 공유 링크
    let parts = location.hash.replace(/^#\/?/, '').split('/').map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
    const found = feed.channels.find((c) => norm(c.key) === norm(parts[0]) || norm(c.name) === norm(parts[0]));
    if (found) parts = parts.slice(1);
    const next = found || feed.channels[0] || { key: 'main', name: '', followers: [] };
    if (next !== ch) { ch = next; items = feed.items.filter((i) => !feed.channels.length || i.channel === ch.key); }
    renderChannel();
    const [tab, ...rest] = parts;

    if (tab === 'v') {
      const it = items.find((i) => String(i.id) === rest[0]);
      history.replaceState(null, '', it && it.ad ? link('ads') : link());
      route();
      const i = it ? list.indexOf(it) : -1;
      if (i >= 0) openPlayer(i);
      return;
    }

    const name = rest.join('/');
    const which = ['series', 'ads', 'kit'].includes(tab) ? tab : 'works';
    document.querySelectorAll('.tabs a').forEach((a) => {
      if (a.dataset.tab === which) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $('#kitBtn').toggleAttribute('aria-current', which === 'kit');
    $('#hero').hidden = true;
    $('#kit').hidden = which !== 'kit';
    $('#grid').hidden = which === 'kit';
    $('#sorts').hidden = which !== 'works';
    if (which === 'kit') { $('#chips').hidden = true; return renderKit(); }

    const chips = $('#chips');
    chips.hidden = which !== 'series';
    if (which === 'series') {
      const all = seriesList();
      const active = all.find((s) => norm(s.name) === norm(name));
      chips.innerHTML = all.map((s) => `<a href="${link('series', s.name)}"${s === active ? ' aria-current="page"' : ''}>${esc(s.name)}<small>${s.items.length}</small></a>`).join('');
      if (!name) return renderCovers(all);
      if (!active) return renderGrid([], t('noSuch', esc(name)));
      return renderGrid(active.items.slice().sort(byEpisode));
    }
    if (which === 'ads') return renderGrid(items.filter((i) => i.ad).sort(byViews), t('noAds'));
    renderSorts();
    const works = items.filter((i) => !i.ad);
    renderGrid(works.slice().sort(sort === 'new' ? byNew : sort === 'week' ? byWeek : byViews), t('noVideos'), sort !== 'new');
    renderHero(works);
  }

  function renderSorts() {
    const hasWeek = items.some((i) => i.weekGain > 0);
    if (sort === 'week' && !hasWeek) sort = 'pop';
    $('#sorts').innerHTML = [['pop', t('pop')], ['new', t('latest')], ...(hasWeek ? [['week', t('week')]] : [])]
      .map(([k, l]) => `<button type="button" data-sort="${k}" aria-pressed="${k === sort}">${esc(l)}</button>`).join('');
  }
  $('#sorts').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sort]');
    if (!b || b.dataset.sort === sort) return;
    sort = b.dataset.sort;
    route();
  });

  // 가로 영상은 잘라내지 않고 가운데에 통째로 보여 주고, 같은 이미지를 흐리게 깔아 빈 곳을 채운다
  const isWide = (it) => (it.aspect || 0) > 0.8;
  const mostlyWide = (items) => items.length > 0 && items.filter(isWide).length > items.length / 2;
  const setWide = (on) => $('#grid').classList.toggle('wide', on);
  const thumb = (it, label, wideGrid) => {
    if (!it.thumb) return `<span class="ph" style="--h:${hue(it.series || it.title)}">${esc(label ?? it.series ?? '')}</span>`;
    const src = esc(it.thumb);
    const mismatch = wideGrid ? it.aspect != null && !isWide(it) : isWide(it);
    if (mismatch) return `<img class="blur" src="${src}" alt="" loading="lazy" decoding="async"><img class="fit" src="${src}" alt="" loading="lazy" decoding="async">`;
    return `<img src="${src}" alt="" loading="lazy" decoding="async">`;
  };
  // NEW(7일 이내 업로드) + 캡션에서 찾은 제작 툴
  const badges = (it) => [isNew(it) ? '<span class="bdg new">NEW</span>' : '', ...(it.tools || []).slice(0, 2).map((x) => `<span class="bdg">${esc(x)}</span>`)].join('');

  function cardHtml(it, i, { ranked, wide, epFull } = {}) {
    const e = it.series ? (epFull ? [it.series, epLabel(it)].filter(Boolean).join(' ') : epLabel(it)) : '';
    const b = badges(it);
    return `<button class="card" data-i="${i}" aria-label="${esc(it.title || t('untitled'))} ${esc(t('play'))}"${it.video ? ` data-v="${esc(it.video)}"` : ''}>
        ${thumb(it, undefined, wide)}
        ${ranked && i < 3 && it.views != null ? `<span class="rank">${lang === 'en' ? '#' + (i + 1) : (i + 1)}</span>` : ''}
        ${it.ad && it.brand ? `<span class="tag brand">${esc(it.brand)}</span>` : ''}
        <span class="tag pf">${it.platform === 'x' ? 'X' : 'IG'}</span>
        <span class="meta">
          ${b ? `<span class="badges">${b}</span>` : ''}
          ${e ? `<span class="ep">${esc(e)}</span>` : ''}
          <span class="t">${esc(it.title || t('untitled'))}</span>
          <span class="v">${it.views != null ? `${EYE}${fmt(it.views)}` : ''}<span class="d">${ymd(it.date)}</span></span>
        </span>
      </button>`;
  }

  function renderGrid(items, emptyMsg, ranked) {
    stopPreview();
    list = items;
    const wide = !ranked && mostlyWide(items);
    setWide(wide);
    if (!items.length) { $('#grid').innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }
    $('#grid').innerHTML = items.map((it, i) => cardHtml(it, i, { ranked, wide, epFull: ranked })).join('');
    watchCenter();
  }

  function renderCovers(all) {
    stopPreview();
    list = [];
    setWide(false);
    if (!all.length) { $('#grid').innerHTML = `<p class="empty">${t('noSeries')}</p>`; return; }
    $('#grid').innerHTML = all.map((s) => {
      const top = s.items.slice().sort(byViews)[0];
      const sum = s.items.reduce((a, b) => a + (b.views || 0), 0);
      return `<a class="card cover" href="${link('series', s.name)}">
        ${thumb(top, s.name, false)}
        <span class="meta"><span class="t">${esc(s.name)}</span>
        <span class="v">${t('eps', s.items.length)}${sum ? ` · ${t('sum', fmt(sum))}` : ''}</span></span></a>`;
    }).join('');
  }

  $('#grid').addEventListener('click', (e) => {
    const c = e.target.closest('button.card');
    if (c) openPlayer(+c.dataset.i);
  });

  // ---------- 미리 재생: PC는 마우스를 올리면, 폰은 화면 가운데 온 카드 하나만 소리 없이 ----------
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pv = null, pvCard = null, pvTimer = 0;
  function startPreview(card) {
    if (pvCard === card || !card.dataset.v || saveData || reduced) return;
    stopPreview();
    pvCard = card;
    pv = document.createElement('video');
    pv.className = 'pv';
    pv.muted = true; pv.loop = true; pv.playsInline = true; pv.preload = 'auto';
    pv.setAttribute('muted', ''); pv.setAttribute('playsinline', '');
    pv.style.opacity = '0';
    pv.src = card.dataset.v;
    const bar = document.createElement('span');
    bar.className = 'pbar'; bar.innerHTML = '<i></i>';
    pv.addEventListener('playing', () => { pv && (pv.style.opacity = '1'); card.classList.add('playing'); });
    pv.addEventListener('timeupdate', () => { if (pv && pv.duration) bar.firstChild.style.width = `${(pv.currentTime / pv.duration) * 100}%`; });
    const last = [...card.querySelectorAll('img, .ph')].pop();
    (last ? last.after(pv) : card.prepend(pv));
    card.append(bar);
    pv.play().catch(() => {});
  }
  function stopPreview() {
    clearTimeout(pvTimer);
    if (!pvCard) return;
    pv.pause(); pv.removeAttribute('src'); pv.load(); pv.remove();
    pvCard.querySelector('.pbar')?.remove();
    pvCard.classList.remove('playing');
    pv = null; pvCard = null;
  }
  if (canHover) {
    for (const root of [$('#grid'), $('#hero')]) {
      root.addEventListener('mouseover', (e) => {
        const c = e.target.closest('.card[data-v]');
        if (!c || c === pvCard) return;
        clearTimeout(pvTimer);
        pvTimer = setTimeout(() => startPreview(c), 220);
      });
      root.addEventListener('mouseout', (e) => {
        const c = e.target.closest('.card');
        if (c && !c.contains(e.relatedTarget)) { clearTimeout(pvTimer); if (c === pvCard) stopPreview(); }
      });
    }
  }
  let io = null;
  function watchCenter() {
    if (canHover || saveData || reduced || !('IntersectionObserver' in window)) return;
    io?.disconnect();
    io = new IntersectionObserver((ents) => {
      for (const en of ents) {
        if (en.isIntersecting) startPreview(en.target);
        else if (en.target === pvCard) stopPreview();
      }
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('#grid .card[data-v]').forEach((c) => io.observe(c));
  }

  // ---------- 미디어킷: 실측 숫자는 자동, 소개·서비스·FAQ는 config.json의 mediaKit에서 ----------
  const known = (rows) => { const r = rows.filter((x) => x.k !== 'U'); const s = r.reduce((a, x) => a + x.p, 0) || 1; return r.map((x) => ({ k: x.k, p: Math.round((x.p / s) * 1000) / 10 })); };
  const bars = (rows, label, n = 5) => rows.slice(0, n).map((r) => `<li><span>${esc(label(r.k))}</span><i style="--p:${r.p}%"></i><b>${one(r.p)}%</b></li>`).join('');
  const regionName = (k) => { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(k) || k; } catch { return k; } };
  const tally = (vals) => { const m = new Map(); for (const v of vals) if (v) m.set(v, (m.get(v) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k); };

  function renderKit() {
    stopPreview();
    const kit = ch.kit || {};
    const en = lang === 'en';
    const st = ch.stats || {};
    const vids = items.filter((i) => i.views != null);
    const fol = total(ch.followers || [], (f) => f.count);
    const views = total(items, (i) => i.views);
    const avg = vids.length ? views / vids.length : 0;
    const topWorks = items.filter((i) => !i.ad).sort(byViews).slice(0, 6);
    const ads = items.filter((i) => i.ad).sort(byViews);
    const brands = tally(ads.map((i) => i.brand));
    const tools = tally(items.flatMap((i) => i.tools || []));
    list = [...topWorks, ...ads];
    const card = (it, i) => `<button class="card" data-i="${i}" aria-label="${esc(it.title || t('untitled'))} ${esc(t('play'))}">${thumb(it, undefined, false)}
      ${it.ad && it.brand ? `<span class="tag brand">${esc(it.brand)}</span>` : ''}
      <span class="meta"><span class="t">${esc(it.title || t('untitled'))}</span><span class="v">${it.views != null ? `${EYE}${fmt(it.views)}` : ''}<span class="d">${ymd(it.date)}</span></span></span></button>`;
    const kpi = (v, l, s) => v ? `<div class="kpi"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ''}</div>` : '';
    const steps = (en ? kit.processEn : kit.process) || t('steps');
    const asOf = st.asOf ? st.asOf.replace(/-/g, '.') : ymd(feed.updatedAt);
    const fit = (en ? kit.brandsEn : kit.brands) || [];
    const services = (en ? kit.servicesEn : kit.services) || [];
    const faq = (en ? kit.faqEn : kit.faq) || [];
    const strip = (title, arr) => arr.length ? `<div class="strip"><h4>${title}</h4><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    $('#kit').innerHTML = `
      <div class="kit-cover">
        <p class="eyebrow">PORTFOLIO &amp; MEDIA KIT</p>
        <h2>${esc((en && kit.headlineEn) || kit.headline || ch.name)}</h2>
        ${(en && kit.introEn) || kit.intro ? `<p class="lead">${esc((en && kit.introEn) || kit.intro)}</p>` : ''}
        ${fit.length ? `<p class="fit-label">${t('fitLabel')}</p><ul class="fit">${fit.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>

      ${brands.length || tools.length ? `<div class="strips">${strip(t('withBrands'), brands)}${strip(t('toolsUsed'), tools)}</div>` : ''}

      <h3 class="sec">${t('numbers')}</h3>
      <div class="kpis">
        ${kpi(fol ? fmt(fol) : '', t('followers'), (ch.followers || []).filter((f) => f.count != null).map((f) => `${f.label} ${fmt(f.count)}`).join(' · '))}
        ${kpi(views ? fmt(views) : '', t('totalViews'), t('sumOf', vids.length))}
        ${kpi(avg ? fmt(avg) : '', t('avgViews'))}
        ${kpi(st.reach ? fmt(st.reach) : '', t('reach'), t('last30'))}
        ${kpi(st.views ? fmt(st.views) : '', t('monthViews'), t('last30'))}
        ${kpi(st.total_interactions ? fmt(st.total_interactions) : '', t('inter'), t('interSub'))}
      </div>

      ${st.age || st.gender || st.country ? `<h3 class="sec">${t('audience')}</h3>
      <div class="aud">
        ${st.age ? `<div><h4>${t('age')}</h4><ul class="bars">${bars(st.age, (k) => k)}</ul></div>` : ''}
        ${st.gender ? `<div><h4>${t('gender')} <small>${t('disclosed')}</small></h4><ul class="bars">${bars(known(st.gender), (k) => t(k) || k, 2)}</ul></div>` : ''}
        ${st.country ? `<div><h4>${t('country')}</h4><ul class="bars">${bars(st.country, regionName, 4)}</ul></div>` : ''}
      </div>` : ''}

      ${topWorks.length ? `<h3 class="sec">${t('topWorks')}</h3><div class="grid kit-grid">${topWorks.map((it, i) => card(it, i)).join('')}</div>` : ''}
      ${ads.length ? `<h3 class="sec">${t('collabs')}</h3><div class="grid kit-grid">${ads.map((it, i) => card(it, topWorks.length + i)).join('')}</div>` : ''}

      ${services.length ? `<h3 class="sec">${t('services')}</h3><div class="svc">${services.map((s) => `<div><h4>${esc(s.title)}</h4>${s.desc ? `<p>${esc(s.desc)}</p>` : ''}${s.price ? `<b>${esc(s.price)}</b>` : ''}</div>`).join('')}</div>` : ''}

      <h3 class="sec">${t('process')}</h3>
      <ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

      ${faq.length ? `<h3 class="sec">${t('faq')}</h3><div class="faq">${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : ''}

      <div class="kit-cta">
        <h3>${t('ctaH')}</h3>
        <p>${t('ctaP')}</p>
        <div class="kit-btns"><button class="btn" type="button" data-contact>${t('contact')}</button><button class="btn ghost" type="button" data-print>${t('pdf')}</button></div>
        <p class="src">${t('src')} · ${esc(asOf)}</p>
      </div>`;
  }
  $('#kit').addEventListener('click', (e) => {
    if (e.target.closest('[data-contact]')) return openContact();
    if (e.target.closest('[data-print]')) return window.print();
    const c = e.target.closest('button.card');
    if (c) openPlayer(+c.dataset.i);
  });

  // ---------- player ----------
  function openPlayer(i) {
    if (!list[i]) return;
    stopPreview();
    cur = i;
    const it = list[i];
    $('#player').hidden = false;
    document.body.style.overflow = 'hidden';
    if (!history.state || !history.state.player) history.pushState({ player: true }, '', location.href);
    $('#ptitle').textContent = it.title || '';
    const bits = [];
    if (it.views != null) bits.push(`${t('views')} ${fmt(it.views)}`);
    if (it.series) bits.push([it.series, epLabel(it)].filter(Boolean).join(' '));
    if (it.brand) bits.push(it.brand);
    setAspect(it.aspect || 0.5625);
    $('#pmeta').textContent = bits.join(' · ');
    $('#porig').href = it.url || '#';
    $('#porig').hidden = !it.url;
    $('#pshare').hidden = it.id == null;
    $('#pprev').disabled = i === 0;
    $('#pnext').disabled = i === list.length - 1;

    const fb = $('#fallback');
    $('#stage').classList.toggle('emb', !it.video && it.platform === 'instagram' && !!it.code);
    if (it.video) {
      fb.hidden = true;
      video.hidden = false;
      video.poster = it.thumb || '';
      video.src = it.video;
      video.muted = false;
      video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
    } else {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.hidden = true;
      fb.hidden = false;
      if (it.platform === 'instagram' && it.code) {
        // 영상 파일 주소를 주지 않는 계정은 인스타 공식 임베드로 재생
        fb.innerHTML = `<iframe class="embed" src="https://www.instagram.com/reel/${encodeURIComponent(it.code)}/embed/" allow="autoplay; encrypted-media; fullscreen" allowfullscreen scrolling="no" loading="eager"></iframe>`;
        return;
      }
      const msg = feed.demo ? t('demoVid') : t('onlyOrig');
      fb.innerHTML = `${thumb(it, '')}<p>${msg}</p>${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${t('viewOn', it.platform === 'x' ? 'X' : 'Instagram')}</a>` : ''}`;
    }
  }

  // 공유 링크: 이 영상이 바로 열리는 주소를 복사
  let toastTimer = 0;
  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }
  $('#pshare').addEventListener('click', async () => {
    const it = list[cur];
    if (!it) return;
    const url = location.origin + location.pathname + link('v', String(it.id));
    try { await navigator.clipboard.writeText(url); toast(t('copied')); }
    catch { window.prompt(t('copyLink'), url); }
  });

  function setAspect(a) { $('#stage').style.setProperty('--a', a); }
  video.addEventListener('loadedmetadata', () => { if (video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight); });

  function closePlayer() {
    if ($('#player').hidden) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    $('#player').hidden = true;
    document.body.style.overflow = '';
    cur = -1;
  }
  const step = (d) => { if (cur >= 0 && list[cur + d]) openPlayer(cur + d); };
  const requestClose = () => { if (history.state && history.state.player) history.back(); else closePlayer(); };

  window.addEventListener('popstate', () => { if (!history.state || !history.state.player) closePlayer(); });
  $('#pclose').addEventListener('click', requestClose);
  $('#pprev').addEventListener('click', () => step(-1));
  $('#pnext').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if ($('#player').hidden) return;
    if (e.key === 'Escape') requestClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  });

  let y0 = null, x0 = null;
  const stage = $('#stage');
  stage.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0, dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) step(dy < 0 ? 1 : -1);
    y0 = null;
  }, { passive: true });
  let wheelLock = 0;
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - wheelLock < 700 || Math.abs(e.deltaY) < 20) return;
    wheelLock = now;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
})();
