/* 播放器：进页即播 → 播完弹卡/题板 → 点击继续；几何层在视频结束后继续旋转 */
(function () {
  const N = window.NODES, C = window.CARDS, Q = window.QUIZ, SEG = window.SEG_NAME;
  const v = document.getElementById('video'), geoCv = document.getElementById('geo');
  const cardEl = document.getElementById('card'), quizEl = document.getElementById('quiz');
  const pno = document.getElementById('pno'), ptitle = document.getElementById('ptitle'),
        pnum = document.getElementById('pnum'),
    pseg = document.getElementById('pseg'), modeTag = document.getElementById('modeTag'),
    hint = document.getElementById('hint'), gate = document.getElementById('gate');
  const micChip = document.getElementById('micChip'), micTxt = document.getElementById('micTxt'),
    heard = document.getElementById('heard');

  let idx = -1, cur = null, step = 0, cardOpen = false, quizState = null,
    branch = false, started = false, listenPaused = false, spin = true, answered = 0, quizDone = false;

  GEO.attach(geoCv);


  /* 八组 / 四组线段矢量图（精确：平行=等斜率等距；垂直=闭合直角；延长相交=端点留缝） */
  const FIGS = {
    g1: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="10" y1="20" x2="82" y2="20"/><line x1="10" y1="38" x2="82" y2="38"/></g></svg>`,
    g2: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="12" y1="46" x2="80" y2="10"/><line x1="12" y1="10" x2="80" y2="46"/></g></svg>`,
    g3: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="32" y1="8" x2="32" y2="48"/><line x1="60" y1="8" x2="60" y2="48"/></g></svg>`,
    g4: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="36" y1="14" x2="82" y2="24"/><line x1="36" y1="42" x2="82" y2="32"/></g></svg>`,
    g5: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="10" y1="34" x2="82" y2="22"/><line x1="10" y1="42" x2="82" y2="38"/></g></svg>`,
    g6: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="12" y1="46" x2="76" y2="14"/><line x1="18" y1="52" x2="82" y2="20"/></g></svg>`,
    g7: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="20" y1="46" x2="50" y2="14"/><line x1="40" y1="48" x2="70" y2="16"/></g></svg>`,
    g8: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="46" y1="8" x2="46" y2="48"/><line x1="10" y1="28" x2="82" y2="28"/>
         <path d="M46,28 L58,28 L58,16 L46,16 Z" fill="none" stroke="#7ef0a8"/></g></svg>`,
    p1: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="10" y1="18" x2="82" y2="18"/><line x1="10" y1="40" x2="82" y2="40"/></g></svg>`,
    p2: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="46" y1="8" x2="46" y2="48"/><line x1="10" y1="28" x2="82" y2="28"/>
         <path d="M46,28 L58,28 L58,16 L46,16 Z" fill="none" stroke="#7ef0a8"/></g></svg>`,
    p3: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="34" y1="12" x2="82" y2="24"/><line x1="34" y1="44" x2="82" y2="34"/></g></svg>`,
    p4: `<svg viewBox="0 0 92 56" width="86" height="52"><g stroke="#cfe6ff" stroke-width="2.4" stroke-linecap="round">
         <line x1="46" y1="8" x2="74" y2="48"/><line x1="28" y1="14" x2="70" y2="46"/>
         <path d="M50,26 L58,35 L49,40 L41,31 Z" fill="none" stroke="#7ef0a8"/></g></svg>`
  };

  /* ---------- 页面渲染 ---------- */
  function paintNode(n) {
    pno.textContent = String(n.page).padStart(2, '0');
    ptitle.textContent = n.title;
    pseg.textContent = SEG[n.seg] || '';
    modeTag.hidden = !n.geom;
    modeTag.textContent = n.geom ? '几何层：' + ({ cubeSkew: '异面直线', cubeSame: '同一平面', angle90: '角度扫掠', perp: '垂直', rotatePerp: '垂直旋转', parallel: '平行线' }[n.geom] || n.geom) : '';
  }

  function hidePanels() { cardEl.hidden = true; quizEl.hidden = true; cardEl.innerHTML = ''; quizEl.innerHTML = ''; cardOpen = false; step = 0; if (typeof stopTimer === 'function') stopTimer(); }
  function showHint(t) { hint.textContent = t; }

  /* ---------- 提示音（WebAudio 现场合成，不引入音频文件） ---------- */
  let actx = null;
  let beepCount = 0;
  function audioCtx() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      if (!actx) actx = new C();
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      return actx;
    } catch (_) { return null; }
  }
  function tone(freq, dur, vol, type) {
    const a = audioCtx(); if (!a) return;
    try {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, a.currentTime);
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, a.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + dur + 0.02);
      beepCount++;
    } catch (_) {}
  }
  /* 浏览器要求手势后才能出声：第一次点/按任意键就把音频解锁 */
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => {
    const a = audioCtx(); if (a && a.state === 'suspended') a.resume();
  }, { passive: true }));
  /* 浏览器要求手势后才能出声：第一次点/按任意键就把音频解锁 */
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => {
    const a = audioCtx(); if (a && a.state === 'suspended') a.resume();
  }, { passive: true }));
  function tickBeep() { tone(880, 0.12, 0.13, 'square'); }
  function endBeep() { tone(660, 0.14, 0.14, 'square'); setTimeout(() => tone(990, 0.34, 0.16, 'square'), 170); }


  function playNode(i) {
    if (i < 0 || i >= N.length) return;
    GEO.stop(); hidePanels(); hideTap();
    quizState = null; branch = false; answered = 0; quizDone = false;
    idx = i; cur = N[i]; paintNode(cur);

    // 只显示、不发声的提示句（cur.note）
    const noteEl = document.getElementById('note');
    if (noteEl) {
      if (cur.note && !cur.noteAfter) { noteEl.textContent = cur.note; noteEl.hidden = false; }
      else { noteEl.textContent = ''; noteEl.hidden = true; }
    }

    if (cur.geom) GEO.start(cur.geom, { follow: cur.geom !== 'parallel', video: v, ax: 0.49, ay: cur.geom === 'angle90' || cur.geom === 'perp' ? 0.5 : 0.38, scale: cur.geom === 'angle90' || cur.geom === 'perp' ? 0.095 : 0.074, dur: cur.geomDur || 0 });

    if (cur.quiz) renderQuiz(cur.quiz);      // 题板与出题动画同时出现
    if (cur.cardEarly) setTimeout(() => { if (cur && cur.cardEarly && cardEl.hidden) openCard(1); }, 300);
    document.getElementById('stage').classList.toggle('cleanbg', !!cur.cleanBg);
    if (cur.cleanBg) v.classList.add('hidden');
    if (cur.video) {
      v.classList.remove('hidden');
      v.preload = 'auto';
      v.src = cur.video; v.currentTime = 0;
      listenPaused = true; setMic('动画播放中 · 暂停聆听', false);
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
      showHint('播放中…');
      hideTap(); armTap();
      // 顺手把下一页的视频拉进缓存，免得每次切页都等一下
      setTimeout(() => {
        const nx = N[idx + 1];
        if (nx && nx.video && !document.querySelector('link[data-pf="1"][href="' + nx.video + '"]')) {
          const l = document.createElement('link');
          l.rel = 'prefetch'; l.as = 'video'; l.href = nx.video; l.setAttribute('data-pf', '1');
          document.head.appendChild(l);
        }
      }, 1500);
    } else {
      // 无视频的页：保留上一页的末帧作背景（标了 cleanBg 的页则用干净底色，不留人物画面）
      if (!cur.cleanBg) { try { v.pause(); } catch (_) {} }
      setTimeout(onEnded, 80);
    }
  }

  /* ---------- 自动播放被拦下时：盖一个「点一下开始」 ---------- */
  let tapEl = null;
  function tapBox() { if (!tapEl) tapEl = document.getElementById('tap'); return tapEl; }
  function showTap() { const e = tapBox(); if (e) e.hidden = false; }
  function hideTap() { const e = tapBox(); if (e) e.hidden = true; }
  function armTap() {
    setTimeout(() => {
      if (!v.paused || v.ended) return;
      showTap(); showHint('浏览器拦了自动播放 · 点一下画面开始');
    }, 700);
  }

  function onEnded() {
    showHint('点击画面 / 空格 / → 继续');
    // 视频播完才出现的提示句（如 p18：悟空操作完再提问）
    if (cur && cur.note && cur.noteAfter) {
      const ne = document.getElementById('note');
      if (ne) { ne.textContent = cur.note; ne.hidden = false; }
    }
    listenPaused = false; setMic(quizState ? '答题中 · 说「对了 / 错了」' : '聆听中', true);
    if (!cur) return;
    if (cur.quiz) {
      if (!quizState || quizState.id !== cur.quiz || quizEl.hidden) renderQuiz(cur.quiz);
      const st = quizEl.querySelector('#qstat');
      if (st && !quizDone) st.textContent = quizState.q.mode === 'tf' ? '可以作答了 · 八戒即时点评' : '可以作答了 · 全部选好后点「提交」';
      return;
    }
    if (C[cur.id]) { openCard(1); return; }
    // 无卡片的动画页：保持末帧、几何层继续转
  }

  /* ---------- 最后一页：课堂助教（只答本课内容） ---------- */
  const ASK_TIPS = ['什么是平行线？', '垂足在哪里？', '怎么判断垂直？', '平行和垂直有什么不同？'];
  const ASK_LOG = [];
  const ASK_REFUSAL = '俺老猪只答《平行与垂直》这节课的问题——你可以问「什么是平行线」「垂足在哪里」「怎么判断垂直」。';
  let ASK_SRC = '本课范围';
  const ASK_FOOT = '课前课后都能问：平行 / 垂直 / 垂足 / 记法 / 判断方法 / 生活例子；问别的俺老猪不答。';
  /* 没有后端（GitHub Pages）时的本课知识卡：关键词命中，措辞取自本课 */
  const ASK_KB = [
    [/区别|不同|一样吗|有什么不一样/, '平行是同一平面内不相交的两条直线；垂直是相交成直角的两条直线。平行不相交，垂直一定相交，交点叫垂足。'],
    [/平行线|什么叫平行|平行的定义/, '在同一个平面内不相交的两条直线叫做平行线，也可以说这两条直线互相平行。'],
    [/垂足/, '两条直线互相垂直时的交点叫垂足。只有相交成直角才是垂直，这时的交点才叫垂足，记得标直角符号。'],
    [/记法|符号|∥|⊥/, '平行记作 a∥b，读作“a 平行于 b”；垂直记作 a⊥b，读作“a 垂直于 b”。'],
    [/同一平面|同一个平面/, '平行线必须是“在同一个平面内”不相交的两条直线；只说不相交不够，不在同一平面上的两条直线不相交也不是平行线。'],
    [/延长/, '看着不相交、延长后却相交的两条直线，不是平行线；延长后仍然不相交，才是平行。'],
    [/距离/, '两条平行线之间的距离处处相等。'],
    [/方向|摆放|怎么转/, '垂直与摆放方向无关，只要相交成直角，就是互相垂直。'],
    [/例子|生活|找一找/, '平行：铁轨、双杠、窗框对边、斑马线；垂直：十字路口、门窗框的横框与竖框、黑板相邻两边。'],
    [/一条|单独/, '平行与垂直都是两条直线之间的关系，不能说一条直线“互相平行”。'],
    [/垂直|直角/, '两条直线相交成直角，就说这两条直线互相垂直，交点叫垂足；判断时先看是否相交，再看角是不是直角。']
  ];
  let ASK_HIT = null;
  function askLocal(q) {
    ASK_HIT = null;
    if (/区别|不同|不一样|差别/.test(q) && /平行/.test(q) && /垂直/.test(q)) {
      return '平行是同一平面内不相交的两条直线，记作 a∥b；垂直是两条直线相交成直角，记作 a⊥b，交点叫垂足。' +
             '平行一定不相交，垂直一定相交成直角——这就是它们最根本的区别。';
    }
    if (typeof ASK_MATCH === 'function') {              // ① 38 条标准答复（kb.js）
      const h = ASK_MATCH(q);
      if (h) { ASK_HIT = h.entry; return h.entry.a; }
    }
    for (const it of ASK_KB) if (it[0].test(q)) return it[1];   // ② 兜底短语
    return ASK_REFUSAL;
  }

  const askHTML = () => `
    <div class="ask">
      <div class="askhd"><img class="askava" src="assets/bajie_tutor.png?v=20261024n" alt="猪八戒"><span class="askwho">猪八戒 · 课堂助教</span><span class="tagx" id="askSrc">${ASK_SRC}</span></div>
      <div class="asklog" id="askLog"></div>
      <div class="askrow">
        <input id="askIn" type="text" maxlength="120" autocomplete="off"
               placeholder="打字问，或按 🎤 说话问（例：垂足在哪里？）">
        <button id="askMic" type="button" title="按一下说话提问">🎤</button>
        <button id="askBtn" type="button">提问</button>
      </div>
      <div class="askchips">${ASK_TIPS.map(t => `<span class="askchip" data-q="${t}">${t}</span>`).join('')}</div>
      <div class="askfoot" id="askFoot">${ASK_FOOT}</div>
    </div>`;

  function askAppend(host, m) {
    const log = host.querySelector('#askLog'); if (!log) return;
    const d = document.createElement('div');
    d.className = 'askb ' + (m.role === 'q' ? 'q' : 'a') + (m.cls ? ' ' + m.cls : '');
    if (m.role === 'a') {
      const w = document.createElement('span'); w.className = 'who';
      w.textContent = m.cls === 'out' ? '猪八戒 · 课外问题' : (m.cls === 'wait' ? '猪八戒 · 正在想' : '猪八戒');
      d.appendChild(w);
    }
    const t = document.createElement('span'); t.textContent = m.text; d.appendChild(t);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function askRepaint(host) {
    const log = host.querySelector('#askLog'); if (!log) return;
    log.innerHTML = '';
    if (!ASK_LOG.length) {
      const d = document.createElement('div'); d.className = 'askb a in';
      const w = document.createElement('span'); w.className = 'who'; w.textContent = '猪八戒';
      const sp = document.createElement('span'); sp.textContent = '俺老猪在这儿——课前课后问什么都行，只要是这节课的。';
      d.appendChild(w); d.appendChild(sp); log.appendChild(d); return;
    }
    ASK_LOG.forEach(m => askAppend(host, m));
    log.scrollTop = log.scrollHeight;
  }
  function askBusy(host, on) {
    const b = host.querySelector('#askBtn'), i = host.querySelector('#askIn'),
          f = host.querySelector('#askFoot');
    if (b) { b.disabled = !!on; b.textContent = on ? '思考中…' : '提问'; }
    if (i) i.disabled = !!on;
    if (f) f.textContent = on ? '正在回答…' : ASK_FOOT;
  }
  async function askQuestion(host, q) {
    q = (q || '').trim(); if (!q) return;
    const inp = host.querySelector('#askIn'); if (inp) inp.value = '';
    ASK_LOG.push({ role: 'q', text: q });
    ASK_LOG.push({ role: 'a', text: '……', cls: 'wait' });
    askRepaint(host); askBusy(host, true);
    let res = null;
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch('api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: q }), signal: ctl.signal
      });
      clearTimeout(to);
      res = await r.json();
    } catch (_) { res = null; }
    ASK_LOG.pop();
    let cls, text, src;
    if (res && res.ok) {
      cls = res.scope === 'out' ? 'out' : 'in';
      text = res.answer; src = 'DeepSeek · 在线';
    } else {
      const a = askLocal(q);
      cls = (a === ASK_REFUSAL) ? 'out' : 'in';
      text = a;
      src = cls === 'out' ? '本课范围 · 课外不答' : (ASK_HIT ? ('标准答复 · ' + ASK_HIT.kp) : '本课知识卡 · 离线');
    }
    ASK_LOG.push({ role: 'a', text: text, cls: cls });
    ASK_SRC = src;
    const tag = host.querySelector('#askSrc'); if (tag) tag.textContent = src;
    askRepaint(host); askBusy(host, false);
    const i2 = host.querySelector('#askIn'); if (i2) { try { i2.focus(); } catch (_) { } }
  }
  /* ---------- 课堂助教：语音提问（Web Speech，说完自动发送） ---------- */
  let askRecog = null;
  function askListen(host) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = host.querySelector('#askMic'), inp = host.querySelector('#askIn');
    if (!SR) { showHint('这个浏览器不支持语音识别：请用 Chrome / Edge'); return; }
    if (askRecog) { try { askRecog.stop(); } catch (_) {} askRecog = null; }
    const r = new SR();
    askRecog = r;
    r.lang = 'zh-CN'; r.continuous = false; r.interimResults = true; r.maxAlternatives = 3;
    if (btn) btn.classList.add('live');
    showHint('🎤 正在听…说完自动提问');
    r.onresult = e => {
      let fin = '', itm = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const s = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += s; else itm += s;
      }
      if (inp) inp.value = (fin || itm).trim();
      if (fin.trim()) { try { r.stop(); } catch (_) {} askQuestion(host, fin.trim()); }
    };
    r.onerror = ev => {
      if (btn) btn.classList.remove('live');
      const k = ev && ev.error;
      showHint(k === 'not-allowed' || k === 'service-not-allowed'
        ? '麦克风没授权：点地址栏左侧小锁 → 允许麦克风' : '没听清，按 🎤 再说一次');
    };
    r.onend = () => { if (btn) btn.classList.remove('live'); if (askRecog === r) askRecog = null; };
    try { r.start(); } catch (_) { if (btn) btn.classList.remove('live'); }
  }

  function askInit(host) {
    const input = host.querySelector('#askIn'), send = host.querySelector('#askBtn');
    if (!input) return;
    askRepaint(host);
    if (send) send.onclick = ev => { ev.stopPropagation(); askQuestion(host, input.value); };
    const mic = host.querySelector('#askMic');
    if (mic) mic.onclick = ev => { ev.stopPropagation(); askListen(host); };
    input.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); askQuestion(host, input.value); }
    });
    input.addEventListener('click', ev => ev.stopPropagation());
    host.querySelectorAll('.askchip').forEach(c => {
      c.onclick = ev => { ev.stopPropagation(); askQuestion(host, c.dataset.q); };
    });
  }

  /* ---------- 卡片 ---------- */
  function openCard(s) {
    const c = C[cur.id]; if (!c) return;
    step = Math.max(1, s); cardOpen = true;
    const maxStep = Math.max(1, ...c.blocks.map(b => b.step || 0));
    const total = c.steps || maxStep;
    if (c.hero) {
      cardEl.innerHTML = `
        <div class="tag">${c.tag || ''}</div>
        <h2>${c.title}</h2>
        ${c.blocks.map(b => `<div class="line${b.sub ? ' subline' : ''}" data-step="${b.step || 0}">${b.t}</div>`).join('')}
        ${c.cta ? `<a class="cta" href="${c.cta.href}" target="_blank" rel="noopener">${c.cta.label}</a>` : ''}
        ${c.ask ? askHTML() : ''}
        <div class="foot">${c.foot || ''}<span id="stepInfo"></span></div>`;
      cardEl.className = 'hero' + (c.center ? ' center' : '') + (c.big ? ' big' : '');
    } else {
      cardEl.innerHTML = `
        <div class="hd"><h2>${c.title}</h2><div class="ln"></div><span class="tag">${c.tag || ''}</span></div>
        <div class="cols">
          ${c.blocks.map(b => `<div class="col ${b.wide ? 'wide' : ''}" data-step="${b.step || 0}">
              <span class="n">${b.n || '·'}</span><span>${b.t}</span></div>`).join('')}
          ${c.slot ? `<div class="col wide slot">拖入学生作品照片 / 直接投影</div>` : ''}
        </div>
        <div class="foot"><span>${c.foot || ''}</span><span id="stepInfo"></span></div>
        ${c.ask ? askHTML() : ''}`;
      cardEl.className = 'cardbar';
    }
    cardEl.hidden = false;
    renderStep();
    if (c.ask) askInit(cardEl);
    if (c.timer) startTimer(c.timer);
  }

  function renderStep() {
    const c = C[cur.id]; if (!c) return;
    const maxStep = Math.max(1, ...c.blocks.map(b => b.step || 0));
    cardEl.querySelectorAll('[data-step]').forEach(el => {
      const s = +el.dataset.step;
      if (c.hero) el.classList.toggle('show', s <= step);
      else if (el.classList.contains('col')) el.classList.toggle('show', s <= step);
    });
    const info = cardEl.querySelector('#stepInfo');
    if (info) info.textContent = maxStep > 1 ? `第 ${Math.min(step, maxStep)} / ${maxStep} 步` : '';
  }

  let timerId = null, timerEl = null;
  function bigTimer() {
    if (timerEl) return timerEl;
    timerEl = document.createElement('div');
    timerEl.id = 'bigTimer';
    timerEl.innerHTML = '<div class="bt-label">计时</div><div class="bt-time">2:00</div><div class="bt-bar"><i></i></div>';
    (document.getElementById('stage') || document.body).appendChild(timerEl);
    return timerEl;
  }
  function stopTimer() {
    clearInterval(timerId);
    if (timerEl) timerEl.classList.remove('show', 'warn', 'danger');
  }
  function startTimer(sec) {
    clearInterval(timerId);
    const el = bigTimer();
    const tEl = el.querySelector('.bt-time'), barEl = el.querySelector('.bt-bar i');
    let left = sec;
    el.classList.add('show');
    const paint = () => {
      tEl.textContent = left <= 0 ? '时间到' : Math.floor(Math.max(0, left) / 60) + ':' + String(Math.max(0, left) % 60).padStart(2, '0');
      tEl.className = 'bt-time' + (left <= 0 ? ' done' : left <= 10 ? ' danger' : left <= 30 ? ' warn' : '');
      barEl.style.width = (Math.max(0, left) / sec * 100) + '%';
      el.classList.toggle('warn', left <= 30 && left > 10);
      el.classList.toggle('danger', left <= 10 && left > 0);
    };
    paint();
    timerId = setInterval(() => {
      left--; paint();
      if (left > 0 && left <= 5) tickBeep();                    // 5 4 3 2 1 各一声「滴」
      if (left <= 0) { clearInterval(timerId); endBeep(); }      // 时间到「滴滴——」
    }, 1000);
  }


  /* ---------- 线段小图（八组 / 四组）---------- */
  const G8 = [
    { no: 1, lines: [[24, 92, 148, 40], [34, 116, 158, 64]] },
    { no: 2, lines: [[26, 32, 150, 96], [30, 96, 150, 34]] },
    { no: 3, lines: [[64, 20, 64, 108], [118, 20, 118, 108]] },
    { no: 4, lines: [[26, 44, 156, 56], [26, 92, 156, 80]] },
    { no: 5, lines: [[30, 28, 140, 104], [34, 104, 146, 26]] },
    { no: 6, lines: [[22, 50, 156, 50], [22, 86, 156, 86]] },
    { no: 7, lines: [[60, 116, 104, 16], [88, 116, 118, 16]] },
    { no: 8, lines: [[30, 63, 150, 63], [110, 20, 110, 106]], mark: [110, 63] }
  ];
  const G4 = [
    [[24, 46, 150, 46], [24, 78, 150, 78]],
    [[24, 86, 150, 86], [120, 20, 120, 96]],
    [[24, 44, 150, 70], [26, 92, 150, 88]],
    [[57, 22, 125, 90], [57, 90, 125, 22]]
  ];
  function svgLines(lines, mark) {
    const seg = lines.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#8fd8ff" stroke-width="3" stroke-linecap="round"/>`).join('');
    let sq = '';
    if (mark) { const s = 12, [mx, my] = mark; sq = `<path d="M ${mx} ${my} L ${mx + s} ${my} L ${mx + s} ${my - s} L ${mx} ${my - s} Z" fill="none" stroke="#ffd166" stroke-width="2.2"/>`; }
    return `<svg class="mini" viewBox="0 0 182 126">${seg}${sq}</svg>`;
  }

  /* ---------- 答题 ---------- */
  function renderQuiz(qid) {
    const q = Q[qid];
    const prev = (quizState && quizState.id === qid) ? quizState : null;
    quizState = { id: qid, q, picks: prev ? prev.picks : {}, reasons: prev ? prev.reasons : {} };
    let rows = '';
    if (q.mode === 'sort') {
      rows = q.items.map(it => {
        const g = G8[it.k - 1];
        return `<div class="q" data-k="${it.k}"><span class="txt">${svgLines(g.lines, g.mark)}<span class="lbl">第 ${it.k} 组</span></span>
        <span class="btns"><button data-v="yes">相交</button><button data-v="no">不相交</button></span></div>`;
      }).join('');
    } else if (q.mode === 'choice') {
      rows = q.items.map(it => {
        const mark = (it.k === 2) ? [120, 86] : (it.k === 4) ? [91, 56] : null;
        return `<div class="q" data-k="${it.k}"><span class="txt">${svgLines(G4[it.k - 1], mark)}<span class="lbl">第 ${it.k} 组</span></span>
        <span class="btns">${q.options.map(o => `<button data-v="${o}">${o}</button>`).join('')}</span></div>`;
      }).join('');
    } else {
      rows = q.items.map((it, i) => `<div class="q" data-k="${i}"><span class="txt">${i + 1}. ${it.q}</span>
        <span class="btns"><button data-v="对">对</button><button data-v="错">错</button></span></div>`).join('');
    }
    quizEl.innerHTML = `<h3>${q.title}</h3><div style="font-size:12.5px;color:#9fb2cc;margin-bottom:4px">${q.prompt}</div>
      ${rows}
      <div class="why" id="qwhy"></div>
      <div class="qf"><span id="qstat">${q.mode === 'tf' ? '逐题判定 · 八戒即时点评' : '全部选好后点「提交」'}</span>
      <span class="qbtns">${q.mode === 'tf' ? '' : '<button id="qsubmit">提交</button>'}<button id="qskip">跳过</button><button id="qnext" hidden>下一段 ▶</button></span></div>`;
    quizEl.classList.toggle('tf', q.mode === 'tf');
    quizEl.hidden = false;
    quizEl.querySelectorAll('.q').forEach(row => {
      row.querySelectorAll('button').forEach(b => b.onclick = () => pick(row, b));
    });
    const sub = quizEl.querySelector('#qsubmit');
    if (sub) sub.onclick = grade;
    const qs = quizEl.querySelector('#qskip');
    if (qs) qs.onclick = e => { e.stopPropagation(); skipNext(); };
    const qn = quizEl.querySelector('#qnext');
    if (qn) { qn.onclick = () => next(); qn.hidden = !quizDone; }
    // 恢复已经答过的题（分支回来后会重绘）
    Object.entries(quizState.reasons || {}).forEach(([k, r]) => {
      const row = quizEl.querySelector(`.q[data-k="${k}"]`);
      if (!row) return;
      row.querySelectorAll('button').forEach(b => {
        if (b.dataset.v === quizState.picks[k]) b.classList.add(r.ok ? 'sel' : 'bad');
      });
      const w = document.createElement('div'); w.className = 'why'; w.textContent = (r.ok ? '✔ ' : '✘ ') + r.why;
      row.after(w);
    });
  }

  function pick(row, btn) {
    const q = quizState.q;
    row.querySelectorAll('button').forEach(b => b.classList.remove('sel', 'bad'));
    btn.classList.add('sel');
    quizState.picks[row.dataset.k] = btn.dataset.v;
    if (q.mode === 'tf') {
      const it = q.items[+row.dataset.k];
      const ok = btn.dataset.v === it.ans;
      if (!ok) btn.classList.add('bad');
      answered++;
      quizState.reasons[row.dataset.k] = { ok, why: it.why };
      row.querySelector('.why')?.remove();
      const w = document.createElement('div'); w.className = 'why'; w.textContent = (ok ? '✔ ' : '✘ ') + it.why;
      row.after(w);
      playBranch(ok ? q.right : q.wrong, () => { renderQuizKeep(row.dataset.k, ok); });
    }
  }

  function voiceAnswer(n, v) {
    if (!quizState || quizEl.hidden) return false;
    const q = quizState.q;
    if (q.mode === 'sort') v = (v === '相交') ? 'yes' : 'no';   // 分类题的按钮值是 yes/no
    const key = (q.mode === 'tf') ? (n - 1) : n;      // tf 的 data-k 从 0 开始
    let row = quizEl.querySelector(`.q[data-k="${key}"]`);
    // p24a~p24d 每页只有一小题：说「第2/3/4题」也要落到这一行
    if (!row && q.mode === 'tf') {
      const rows = quizEl.querySelectorAll('.q');
      if (rows.length === 1) row = rows[0];
    }
    if (!row) return false;
    const btn = [...row.querySelectorAll('button')].find(b => b.dataset.v === v || b.dataset.v.startsWith(v) || v.startsWith(b.dataset.v));
    if (!btn) return false;
    pick(row, btn); return true;
  }

  function renderQuizKeep(k, ok) {
    renderQuiz(quizState.id);
    const row = quizEl.querySelector(`.q[data-k="${k}"]`);
    if (row) { row.querySelectorAll('button').forEach(b => { if (b.dataset.v === quizState.picks[k]) b.classList.add(ok ? 'sel' : 'bad'); }); }
    if (answered >= quizState.q.items.length) {
      quizDone = true;
      const st = quizEl.querySelector('#qstat');
      if (st) st.textContent = '本页完成 · 点「下一段」继续';
    }
    const qn2 = quizEl.querySelector('#qnext'); if (qn2) qn2.hidden = !quizDone;
  }

  function grade() {
    const q = quizState.q, picks = quizState.picks;
    let allRight = true, miss = [];
    q.items.forEach(it => {
      const k = String(it.k), got = picks[k];
      const row = quizEl.querySelector(`.q[data-k="${k}"]`);
      const want = it.ans;
      if (!row) return;
      row.querySelectorAll('button').forEach(b => {
        if (b.dataset.v === want) b.classList.add('sel');
        if (b.dataset.v === got && got !== want) b.classList.add('bad');
      });
      if (got !== want) { allRight = false; miss.push(k); }
    });
    const why = quizEl.querySelector('#qwhy');
    if (why) why.textContent = (allRight ? '全对！' : `再想想第 ${miss.join('、')} 组。`) + (q.why ? ' ' + q.why : '');
    playBranch(allRight ? q.right : q.wrong, () => {
      quizDone = true;
      if (quizState) renderQuizKeep(null, true);
      const w2 = quizEl.querySelector('#qwhy'); if (w2 && q.why) w2.textContent = q.why;
    });
  }

  function playBranch(url, after) {
    branch = true;
    const keepQuiz = quizEl.innerHTML;
    hidePanels();
    listenPaused = true; setMic('八戒点评中 · 暂停聆听', false);
    v.classList.remove('hidden');
    v.src = url; v.currentTime = 0; v.play().catch(() => {});
    const done = () => {
      v.removeEventListener('ended', done);
      branch = false; listenPaused = false; setMic('聆听中', true);
      if (after) after();
    };
    v.addEventListener('ended', done, { once: true });
  }

  /* ---------- 推进 ---------- */
  function skipNext() {
    if (branch) return;
    if (idx + 1 < N.length) playNode(idx + 1);
  }

  function next() {
    if (branch) return;
    if (quizState && !quizEl.hidden && !quizDone) {
      const total = quizState.q.items.length;
      const picked = Object.keys(quizState.picks || {}).length;
      if (picked >= total) {          // 全部选完但没点提交 → 直接判分
        if (quizState.q.mode === 'tf') { quizDone = true; }
        else { grade(); }
        return;
      }
      const st = quizEl.querySelector('#qstat');
      if (st) st.textContent = `还有 ${total - picked} 组没选`;
      return;
    }
    if (cardOpen) {
      const c = C[cur.id];
      const maxStep = Math.max(1, ...c.blocks.map(b => b.step || 0));
      if (step < maxStep) { step++; renderStep(); return; }
    }
    if (idx + 1 < N.length) playNode(idx + 1);
  }
  function prev() { if (!branch && idx > 0) playNode(idx - 1); }

  /* ---------- 语音 ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;
  function setMic(t, live) {
    micTxt.textContent = t;
    micChip.querySelector('.dot').style.background = live ? '#54d07a' : '#d0a054';
    micChip.querySelector('.dot').style.boxShadow = live ? '0 0 8px #54d07a' : '0 0 8px #d0a054';
  }
  const CN = { '零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 };
  function cn2num(t) {
    if (/^\d+$/.test(t)) return +t;
    if (t === '十') return 10;
    let m = t.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
    if (m) return (m[1] ? CN[m[1]] : 1) * 10 + (m[2] ? CN[m[2]] : 0);
    if (t.length === 1 && CN[t] != null) return CN[t];
    return NaN;
  }
  function jumpPage(n) {
    const i = N.findIndex(x => x.page === n);
    if (i < 0) return false;
    playNode(i); return true;
  }
  function jumpSeg(k) {
    const i = N.findIndex(x => x.seg === k);
    if (i < 0) return false;
    playNode(i); return true;
  }
  function toast(msg) {
    let el = document.getElementById('vtoast');
    if (!el) { el = document.createElement('div'); el.id = 'vtoast'; document.getElementById('stage').appendChild(el); }
    el.innerHTML = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 3200);
  }
  function norm(s) { return (s || '').replace(/[\s，。！？、,.!?「」“”"']/g, ''); }
  function askOpen() {
    return !!(cur && cur.id === 'p28' && !cardEl.hidden && cardEl.querySelector('#askIn'));
  }
  function looksLikeQuestion(t) {
    return /[？?]|什么|怎么|为什么|咋|哪|是不是|能不能|可不可以|多少|几|如何|请问|告诉我|解释|讲讲|说说|区别|一样吗|吗|呢/.test(t);
  }
  function handleText(text) {
    if (!text) return;
    heard.hidden = false;
    heard.innerHTML = `听到：<b>${text}</b>`;
    const t = norm(text);
    // —— 直接切换：播放中也可以用 ——
    let mm;
    if ((mm = t.match(/^(?:跳到|到|去|打开)?第?([一二两三四五六七八九十0-9]{1,3})(?:页|段|节)$/))) {
      const n = cn2num(mm[1]);
      if (n && jumpPage(n)) { heard.innerHTML += `<span class="hit">→ 第 ${n} 页</span>`; return; }
      toast(`没有第 ${mm[1]} 页`); return;
    }
    if ((mm = t.match(/^(?:跳到|到|去|打开)?(?:第)?([一二三四五六])环节$/) || t.match(/^环节([一二三四五六])$/))) {
      const k = cn2num(mm[1]);
      if (k && jumpSeg(k)) { heard.innerHTML += `<span class="hit">→ 环节 ${mm[1]}</span>`; return; }
      return;
    }
    if (/^(回到开头|从头开始|回到第一页|第一页)$/.test(t)) { playNode(0); return; }
    if (/^(下一段|下一个|继续|往下|下一页)$/.test(t)) { if (!branch) next(); return; }
    if (/^(上一段|上一个|返回|上一页)$/.test(t)) { if (!branch) prev(); return; }
    if (/^(重播|再放一遍|再来一次)$/.test(t)) { playNode(idx); return; }
    if (/^(语音口令|口令|帮助|怎么用)$/.test(t)) {
      toast('口令：第N页/第N段 · 环节一~六 · 下一段/上一段 · 跳过 · 第3组相交 · 第2题垂直 · 第四题错 · 提交 · 重播 · 转起来');
      return;
    }
    if (/^(跳过|跳过这题|跳过本题|不会|不知道)$/.test(t)) { skipNext(); return; }
    if (/^(提交|交卷|判分|批改)$/.test(t)) { if (quizState && !quizEl.hidden) grade(); return; }
    // —— 以下口令在播放途中忽略，避免误触 ——
    if (listenPaused || branch || (cur && cur.video && !v.ended && !v.paused)) return;
    // 语音逐题作答：「第3组相交」「第2题垂直」「第四题错」
    if (quizState && !quizEl.hidden) {
      // 直接说「对 / 错」也能作答（四道判断题都支持）
      if (/^(对|错|正确|错误)$/.test(t)) {
        const bv = (t === '正确') ? '对' : (t === '错误') ? '错' : t;
        if (voiceAnswer(1, bv) && quizState && quizEl && !quizEl.hidden) {
          heard.innerHTML += `<span class="hit">→ ${bv}</span>`; return;
        }
      }
      const ans = t.match(/^第?([0-9一二两三四五六七八]{1,2})(?:组|题|句|条|个)?(相交|不相交|平行|垂直|都不是|对|错|正确|错误)$/);
      if (ans) {
        const n = cn2num(ans[1]);
        const raw = ans[2];
        const val = (raw === '正确') ? '对' : (raw === '错误') ? '错' : raw;
        if (n && voiceAnswer(n, val)) { heard.innerHTML += `<span class="hit">→ 第 ${n} 题 ${val}</span>`; return; }
      }
      if (/^(对了|答对了|正确)$/.test(t) || /判断对了/.test(t)) { const q = quizState.q; playBranch(q.right, () => renderQuizKeep(null, true)); return; }
      if (/^(错了|答错了|不对)$/.test(t) || /判断错了/.test(t)) { const q = quizState.q; playBranch(q.wrong, () => renderQuizKeep(null, false)); return; }
    }
    const map = [
      [/^(暂停)$/, () => v.pause()],
      [/^(接着放|继续播放)$/, () => v.play()],
      [/^(暂停旋转|别转了)$/, () => { spin = false; GEO.setSpin(false); }],
      [/^(转起来|继续转)$/, () => { spin = true; GEO.setSpin(true); }]
    ];
    for (const [re, fn] of map) if (re.test(t)) { fn(); heard.innerHTML += `<span class="hit">→ ${re.source.slice(2, 8)}…</span>`; return; }
    // —— 答疑页（p29）：说一个问题就直接带着它跳到大页去问 ——
    if (looksLikeQuestion(t) && cur && cur.id === 'p29') {
      heard.innerHTML += '<span class="hit">→ 带着问题去问猪八戒</span>';
      location.href = 'assistant.html?q=' + encodeURIComponent(text.trim());
      return;
    }
    // —— 内嵌助教的页：像提问的话交给猪八戒 ——
    if (askOpen() && looksLikeQuestion(t)) {
      const host = document.getElementById('card');
      if (host) { heard.innerHTML += '<span class="hit">→ 问猪八戒</span>'; askQuestion(host, text.trim()); return; }
    }
    // 页面口令（取最长命中）
    let best = null, bestLen = 0;
    N.forEach(n => (n.say || []).forEach(s => { const k = norm(s); if (k && t.includes(k) && k.length > bestLen) { best = n; bestLen = k.length; } }));
    if (best) { heard.innerHTML += `<span class="hit">→ 第 ${best.page} 页 · ${best.title}</span>`; playNode(N.indexOf(best)); }
  }

  function startVoice() {
    if (!SR) { setMic('语音不可用 · 用按钮/点击', false); return; }
    recog = new SR(); recog.lang = 'zh-CN'; recog.continuous = true; recog.interimResults = true; recog.maxAlternatives = 3;
    recog.onresult = e => {
      if (listenPaused) return;
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      if (txt.trim()) handleText(txt.trim());
    };
    recog.onend = () => { try { if (started && !listenPaused) recog.start(); } catch (_) {} };
    recog.onerror = () => setMic('识别中断 · 可点按钮', false);
    try { recog.start(); setMic('聆听中', true); } catch (_) { }
  }

  /* ---------- 事件 ---------- */
  document.getElementById('startBtn').onclick = () => {
    gate.classList.add('hidden'); started = true;
    playNode(0); startVoice();
  };
  document.getElementById('tap').onclick = e => {
    e.stopPropagation(); hideTap();
    const p = v.play();
    if (p && p.catch) p.catch(err => {
      // 被拦截或这页没有视频：别把卡片顶上来当成"播放"，把遮罩还给用户
      showTap(); showHint('这一页要点一下才能播（浏览器拦截了自动播放）');
    });
    setTimeout(() => {
      if (v.paused && !v.ended && cur && !cur.video) showTap();
    }, 900);
  };
  document.getElementById('btnNext').onclick = e => { e.stopPropagation(); next(); };
  document.getElementById('btnPrev').onclick = e => { e.stopPropagation(); prev(); };
  document.getElementById('btnReplay').onclick = e => { e.stopPropagation(); playNode(idx); };
  document.getElementById('btnSpin').onclick = e => { e.stopPropagation(); spin = !spin; GEO.setSpin(spin); e.target.textContent = spin ? '旋转中' : '已暂停'; };

  v.addEventListener('play', () => { hideTap(); if (hint.textContent.indexOf('拦截') >= 0) showHint('播放中…'); });
  v.addEventListener('playing', () => { hideTap(); if (v.currentTime > 0) showHint('播放中…'); });
  v.addEventListener('waiting', () => { if (!v.paused) showHint('缓冲中…'); });
  v.addEventListener('ended', onEnded);
  v.addEventListener('error', () => {
    const src = v.getAttribute('src') || '';
    if (branch) { branch = false; listenPaused = false; if (quizState) renderQuizKeep(null, true); return; }
    if (src) showHint('视频缺失：' + src);
    onEnded();
  });
  v.addEventListener('play', () => { listenPaused = true; setMic('动画播放中 · 暂停聆听', false); });
  v.addEventListener('pause', () => { if (!v.ended) setMic('已暂停', false); });

  document.getElementById('stage').addEventListener('click', e => {
    if (e.target.closest('button,#card,#quiz,.nav,.topbar,.micbox')) return;
    if (tapEl && !tapEl.hidden) {          // 遮罩在时：点画面 = 播这一页，不是翻页
      hideTap(); const pp = v.play(); if (pp && pp.catch) pp.catch(() => {});
      setTimeout(() => { if (v.paused && !v.ended) { showTap(); showHint('还没开始播放，再点一下 ▶'); } }, 1200);
      return;
    }
    if (cur && cur.video && !v.paused && !v.ended) { v.pause(); return; } // 播放中点击=暂停
    next();
  });
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'r' || e.key === 'R') playNode(idx);
    else if (e.key === 's' || e.key === 'S') { spin = !spin; GEO.setSpin(spin); }
  });

  /* 深链：?p=p13 直接进入该页；?autostart=1 从封面开始 */
  (function(){
    const q = new URLSearchParams(location.search);
    const pid = q.get('p'), auto = q.get('autostart');
    if (!pid && !auto) return;
    const boot = () => {
      const g = document.getElementById('gate'); if (g) g.classList.add('hidden');
      started = true;
      const i = pid ? N.findIndex(n => n.id === pid) : 0;
      playNode(i >= 0 ? i : 0);
      startVoice();
    };
    if (document.readyState === 'complete') setTimeout(boot, 300); else window.addEventListener('load', () => setTimeout(boot, 300));
  })();

  /* 探针 */
  if (pnum) pnum.textContent = String(Math.max.apply(null, N.map(x => x.page)));

  window.APP = {
    timer: s => startTimer(s), beeps: () => beepCount, tapShown: () => !!(tapEl && !tapEl.hidden),
    say: t => handleText(t),
    state: () => ({ idx, id: cur && cur.id, page: cur && cur.page, card: !cardEl.hidden, step, quiz: !quizEl.hidden, branch, geo: GEO.mode, geoOn: GEO.active, geoTime: +GEO.time.toFixed(2), videoEnded: v.ended, videoPaused: v.paused, src: v.getAttribute('src') }),
    go: id => { const i = N.findIndex(n => n.id === id); if (i >= 0) playNode(i); },
    next, prev, answer: (k, val) => { const row = quizEl.querySelector(`.q[data-k="${k}"]`); if (row) { const b = [...row.querySelectorAll('button')].find(b => b.dataset.v === val); if (b) b.click(); } },
    submit: () => { const b = quizEl.querySelector('#qsubmit'); if (b) b.click(); },
    spin: val => { spin = val; GEO.setSpin(val); }
  };
})();
