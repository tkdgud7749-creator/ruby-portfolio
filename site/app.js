(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const one = (x) => String(Math.round(x * 10) / 10);
  const fmt = (n) => {
    if (n == null || isNaN(n)) return '';
    if (n >= 1e8) return one(n / 1e8) + '억';
    if (n >= 1e7) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
    if (n >= 1e4) return one(n / 1e4) + '만';
    return Number(n).toLocaleString('ko-KR');
  };
  const hue = (s) => [...String(s || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 17);
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
  const time = (it) => +new Date(it.date || 0);
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  let feed;
  let ch;          // 지금 선택된 채널(계정)
  let items = [];  // 그 채널의 영상
  let list = [];
  let cur = -1;
  const video = $('#video');
  const link = (...parts) => '#/' + [ch.key, ...parts].map(encodeURIComponent).join('/');

  init();

  async function init() {
    try {
      const r = await fetch('data/feed.json', { cache: 'no-cache' });
      feed = await r.json();
    } catch (e) {
      $('#grid').innerHTML = '<p class="empty">영상을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>';
      return;
    }
    feed.items = (feed.items || []).filter((i) => !i.hidden);
    feed.channels = feed.channels || [];
    setupContact(feed.contact || {});
    $('#demo').hidden = !feed.demo;
    if (feed.updatedAt) {
      const d = new Date(feed.updatedAt);
      $('#updated').textContent = `마지막 업데이트 ${d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
    window.addEventListener('hashchange', route);
    route();
  }

  // ---------- 광고 문의: PC에 메일 앱이 없으면 mailto가 아무 반응이 없어서, Gmail·메일 앱·주소 복사를 함께 준다 ----------
  let mailAddr = '';
  function setupContact(c) {
    if (!c.user || !c.domain) { $('#contact').hidden = true; return; }
    mailAddr = `${c.user}@${c.domain}`;
    $('#contact').addEventListener('click', openContact);
    $('#copyMail').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mailAddr); $('#copyNote').textContent = '메일 주소를 복사했어요.'; }
      catch { $('#copyNote').textContent = mailAddr; }
    });
    $('#contactDlg').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  }
  function openContact() {
    const subject = `[광고 문의] ${ch?.name || ''} 협업 제안`;
    const body = ['안녕하세요, 협업 제안드립니다.', '', '- 브랜드/제품:', '- 원하는 콘텐츠 형식:', '- 희망 일정:', '- 예산(선택):', '- 담당자 연락처:', ''].join('\n');
    const q = `su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#mailAddr').textContent = mailAddr;
    $('#gmailLink').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(mailAddr)}&${q}`;
    $('#mailtoLink').href = `mailto:${mailAddr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#copyNote').textContent = '';
    const d = $('#contactDlg');
    if (d.showModal) d.showModal(); else location.href = $('#mailtoLink').href;
  }

  const total = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
  const ymd = (d) => { const t = new Date(d); return isNaN(t) ? '' : `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')}`; };

  function renderChannel() {
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
      .map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.label)} <b>${fmt(f.count)}</b></a></li>`)
      .join('');
    document.querySelectorAll('.tabs a').forEach((a) => {
      a.href = a.dataset.tab === 'works' ? link() : link(a.dataset.tab);
    });
    $('#kitBtn').href = link('kit');
  }

  // 첫 화면 상단: 채널 숫자 요약 + 대표작(조회수 1위)
  function renderHero(works) {
    const hero = $('#hero');
    const top = works[0];
    if (!top) { hero.hidden = true; return; }
    const fol = total(ch.followers || [], (f) => f.count);
    const views = total(items, (i) => i.views);
    hero.hidden = false;
    hero.innerHTML = `
      <div class="hero-txt">
        <p class="eyebrow">BEST · 조회수 1위</p>
        <h2>${esc(top.title || '대표작')}</h2>
        <p class="hero-meta">${[top.views != null ? `조회수 ${fmt(top.views)}` : '', top.series ? [top.series, epLabel(top)].filter(Boolean).join(' ') : '', ymd(top.date)].filter(Boolean).map(esc).join(' · ')}</p>
        <button class="btn" type="button" data-play="0">${EYE} 재생</button>
        <dl class="stats">
          ${fol ? `<div><dt>총 팔로워</dt><dd>${fmt(fol)}</dd></div>` : ''}
          ${views ? `<div><dt>누적 조회수</dt><dd>${fmt(views)}</dd></div>` : ''}
          <div><dt>작품</dt><dd>${items.length}편</dd></div>
        </dl>
      </div>
      <button class="hero-art card" type="button" data-play="0" aria-label="${esc(top.title || '대표작')} 재생">${thumb(top, '', false)}<span class="play">${EYE}</span></button>`;
  }
  $('#hero').addEventListener('click', (e) => { const b = e.target.closest('[data-play]'); if (b) openPlayer(+b.dataset.play); });

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
  const byEpisode = (a, b) => (a.season ?? 1) - (b.season ?? 1) || (a.episode ?? 1e9) - (b.episode ?? 1e9) || time(a) - time(b);
  const epLabel = (it) => [it.season ? `${it.season}기` : '', it.episode ? `${it.episode}화` : ''].filter(Boolean).join(' ');

  function route() {
    closePlayer();
    // 주소 형식: #/채널/탭/시리즈이름  (채널을 빼면 첫 번째 채널)
    let parts = location.hash.replace(/^#\/?/, '').split('/').map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
    const found = feed.channels.find((c) => norm(c.key) === norm(parts[0]) || norm(c.name) === norm(parts[0]));
    if (found) parts = parts.slice(1);
    const next = found || feed.channels[0] || { key: 'main', name: '', followers: [] };
    if (next !== ch) { ch = next; items = feed.items.filter((i) => !feed.channels.length || i.channel === ch.key); }
    renderChannel();
    const [tab, ...rest] = parts;
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
    if (which === 'kit') { $('#chips').hidden = true; return renderKit(); }

    const chips = $('#chips');
    chips.hidden = which !== 'series';
    if (which === 'series') {
      const all = seriesList();
      const active = all.find((s) => norm(s.name) === norm(name));
      chips.innerHTML = all.map((s) => `<a href="${link('series', s.name)}"${s === active ? ' aria-current="page"' : ''}>${esc(s.name)}<small>${s.items.length}</small></a>`).join('');
      if (!name) return renderCovers(all);
      if (!active) return renderGrid([], `“${esc(name)}” 시리즈는 아직 없어요.`);
      return renderGrid(active.items.slice().sort(byEpisode));
    }
    if (which === 'ads') return renderGrid(items.filter((i) => i.ad).sort(byViews), '광고 작업이 아직 없어요.');
    const works = items.filter((i) => !i.ad).sort(byViews);
    renderGrid(works, '아직 영상이 없어요.', true);
    renderHero(works);
  }

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

  function renderGrid(items, emptyMsg, ranked) {
    list = items;
    const wide = !ranked && mostlyWide(items);
    setWide(wide);
    if (!items.length) { $('#grid').innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }
    $('#grid').innerHTML = items.map((it, i) => `
      <button class="card" data-i="${i}" aria-label="${esc(it.title || '영상')} 재생">
        ${thumb(it, undefined, wide)}
        ${ranked && i < 3 && it.views != null ? `<span class="rank">${i + 1}</span>` : ''}
        ${it.ad && it.brand ? `<span class="tag brand">${esc(it.brand)}</span>` : ''}
        <span class="tag pf">${it.platform === 'x' ? 'X' : 'IG'}</span>
        <span class="meta">
          ${(() => { const e = it.series ? (ranked ? [it.series, epLabel(it)].filter(Boolean).join(' ') : epLabel(it)) : ''; return e ? `<span class="ep">${esc(e)}</span>` : ''; })()}
          <span class="t">${esc(it.title || '제목 없음')}</span>
          <span class="v">${it.views != null ? `${EYE}${fmt(it.views)}` : ''}<span class="d">${ymd(it.date)}</span></span>
        </span>
      </button>`).join('');
  }

  function renderCovers(all) {
    list = [];
    setWide(false);
    if (!all.length) { $('#grid').innerHTML = '<p class="empty">아직 시리즈가 없어요.</p>'; return; }
    $('#grid').innerHTML = all.map((s) => {
      const top = s.items.slice().sort(byViews)[0];
      const total = s.items.reduce((a, b) => a + (b.views || 0), 0);
      return `<a class="card cover" href="${link('series', s.name)}">
        ${thumb(top, s.name, false)}
        <span class="meta"><span class="t">${esc(s.name)}</span>
        <span class="v">${s.items.length}편${total ? ` · 누적 ${fmt(total)}` : ''}</span></span></a>`;
    }).join('');
  }

  $('#grid').addEventListener('click', (e) => {
    const c = e.target.closest('button.card');
    if (c) openPlayer(+c.dataset.i);
  });

  // ---------- 미디어킷: 실측 숫자는 자동, 소개·서비스·FAQ는 config.json의 mediaKit에서 ----------
  const AGE = (k) => k;
  const GENDER = { F: '여성', M: '남성', U: '기타' };
  let regionName = (k) => k;
  try { const dn = new Intl.DisplayNames(['ko'], { type: 'region' }); regionName = (k) => dn.of(k) || k; } catch {}
  // 성별 '기타(U)'는 비공개라 빼고, 공개한 사람 기준으로 다시 비율을 낸다
  const known = (rows) => { const r = rows.filter((x) => x.k !== 'U'); const s = r.reduce((a, x) => a + x.p, 0) || 1; return r.map((x) => ({ k: x.k, p: Math.round((x.p / s) * 1000) / 10 })); };
  const bars = (rows, label, n = 5) => rows.slice(0, n).map((r) => `<li><span>${esc(label(r.k))}</span><i style="--p:${r.p}%"></i><b>${one(r.p)}%</b></li>`).join('');

  function renderKit() {
    const kit = ch.kit || {};
    const st = ch.stats || {};
    const vids = items.filter((i) => i.views != null);
    const fol = total(ch.followers || [], (f) => f.count);
    const views = total(items, (i) => i.views);
    const avg = vids.length ? views / vids.length : 0;
    const topWorks = items.filter((i) => !i.ad).sort(byViews).slice(0, 6);
    const ads = items.filter((i) => i.ad).sort(byViews);
    list = [...topWorks, ...ads];
    const card = (it, i) => `<button class="card" data-i="${i}" aria-label="${esc(it.title || '영상')} 재생">${thumb(it, undefined, false)}
      ${it.ad && it.brand ? `<span class="tag brand">${esc(it.brand)}</span>` : ''}
      <span class="meta"><span class="t">${esc(it.title || '제목 없음')}</span><span class="v">${it.views != null ? `${EYE}${fmt(it.views)}` : ''}<span class="d">${ymd(it.date)}</span></span></span></button>`;
    const kpi = (v, l, s) => v ? `<div class="kpi"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ''}</div>` : '';
    const steps = kit.process || ['문의·브리프', '기획안 제안', '제작', '수정·컨펌', '발행·리포트'];
    const asOf = st.asOf ? st.asOf.replace(/-/g, '.') : ymd(feed.updatedAt);
    $('#kit').innerHTML = `
      <div class="kit-cover">
        <p class="eyebrow">PORTFOLIO &amp; MEDIA KIT</p>
        <h2>${esc(kit.headline || `${ch.name}입니다.`)}</h2>
        ${kit.intro ? `<p class="lead">${esc(kit.intro)}</p>` : ''}
        ${(kit.brands || []).length ? `<p class="fit-label">이런 브랜드와 잘 맞아요</p><ul class="fit">${kit.brands.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>

      <h3 class="sec">숫자로 보는 채널</h3>
      <div class="kpis">
        ${kpi(fol ? fmt(fol) : '', '총 팔로워', (ch.followers || []).filter((f) => f.count != null).map((f) => `${f.label} ${fmt(f.count)}`).join(' · '))}
        ${kpi(views ? fmt(views) : '', '누적 조회수', `영상 ${vids.length}편 합계`)}
        ${kpi(avg ? fmt(avg) : '', '영상당 평균 조회수')}
        ${kpi(st.reach ? fmt(st.reach) : '', '월간 도달', '최근 30일 · 인스타그램')}
        ${kpi(st.views ? fmt(st.views) : '', '월간 조회수', '최근 30일 · 인스타그램')}
        ${kpi(st.total_interactions ? fmt(st.total_interactions) : '', '월간 상호작용', '좋아요·댓글·저장·공유')}
      </div>

      ${st.age || st.gender || st.country ? `<h3 class="sec">누가 보나요</h3>
      <div class="aud">
        ${st.age ? `<div><h4>연령</h4><ul class="bars">${bars(st.age, AGE)}</ul></div>` : ''}
        ${st.gender ? `<div><h4>성별 <small>(공개 기준)</small></h4><ul class="bars">${bars(known(st.gender), (k) => GENDER[k] || k, 2)}</ul></div>` : ''}
        ${st.country ? `<div><h4>국가</h4><ul class="bars">${bars(st.country, regionName, 4)}</ul></div>` : ''}
      </div>` : ''}

      ${topWorks.length ? `<h3 class="sec">대표 작품</h3><div class="grid kit-grid">${topWorks.map((it, i) => card(it, i)).join('')}</div>` : ''}
      ${ads.length ? `<h3 class="sec">브랜드 협업</h3><div class="grid kit-grid">${ads.map((it, i) => card(it, topWorks.length + i)).join('')}</div>` : ''}

      ${(kit.services || []).length ? `<h3 class="sec">제작 상품</h3><div class="svc">${kit.services.map((s) => `<div><h4>${esc(s.title)}</h4>${s.desc ? `<p>${esc(s.desc)}</p>` : ''}${s.price ? `<b>${esc(s.price)}</b>` : ''}</div>`).join('')}</div>` : ''}

      <h3 class="sec">진행 과정</h3>
      <ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

      ${(kit.faq || []).length ? `<h3 class="sec">자주 묻는 질문</h3><div class="faq">${kit.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : ''}

      <div class="kit-cta">
        <h3>함께 만들어 볼까요?</h3>
        <p>브랜드·제품 소개와 원하시는 일정만 보내 주세요.</p>
        <div class="kit-btns"><button class="btn" type="button" data-contact>광고 문의</button><button class="btn ghost" type="button" data-print>PDF로 저장</button></div>
        <p class="src">수치는 인스타그램 공식 API 기준 · ${esc(asOf)}</p>
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
    cur = i;
    const it = list[i];
    $('#player').hidden = false;
    document.body.style.overflow = 'hidden';
    if (!history.state || !history.state.player) history.pushState({ player: true }, '', location.href);
    $('#ptitle').textContent = it.title || '';
    const bits = [];
    if (it.views != null) bits.push(`조회수 ${fmt(it.views)}`);
    if (it.series) bits.push([it.series, epLabel(it)].filter(Boolean).join(' '));
    if (it.brand) bits.push(it.brand);
    setAspect(it.aspect || 0.5625);
    $('#pmeta').textContent = bits.join(' · ');
    $('#porig').href = it.url || '#';
    $('#porig').hidden = !it.url;
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
      const msg = feed.demo ? '샘플 데이터라 영상이 없어요. 계정을 연결하면 여기서 바로 재생돼요.' : '이 영상은 원본에서 볼 수 있어요.';
      fb.innerHTML = `${thumb(it, '')}<p>${msg}</p>${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${it.platform === 'x' ? 'X' : '인스타그램'}에서 보기</a>` : ''}`;
    }
  }

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
