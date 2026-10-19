/* 实时精确几何层：Canvas 2D。视频只提供角色/背景，几何由代码绘制。
   模式：cubeSkew（异面）| cubeSame（同一平面）| angle90（角度扫掠）| perp（垂直）
   API: GEO.start(mode, opts) / GEO.stop() / GEO.setSpin(bool) / GEO.time */
(function () {
  const A0 = [-2.05, -0.30, 1.0], A1 = [2.05, -0.30, 1.0];
  const B0 = [-0.15, 1.0, -1.0], B1 = [-0.15, 1.0, 0.55];
  const L2 = [[-2.05, -0.52, 1.0, 2.05, -0.52, 1.0], [-2.05, 0.42, 1.0, 2.05, 0.42, 1.0]];
  const FACES = {
    top: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
    front: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
    right: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]],
    left: [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]],
    back: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
    bottom: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]]
  };
  const EDGES = (() => {
    const s = new Set();
    for (const k in FACES) { const p = FACES[k]; for (let i = 0; i < 4; i++) s.add([p[i], p[(i + 1) % 4]].map(String).sort().join('|')); }
    return [...s].map(k => k.split('|').map(x => x.split(',').map(Number)));
  })();

  let cv = null, ctx = null, raf = 0, mode = null, opts = {}, t0 = 0, spin = true, active = false, last = 0, tm = 0;

  function fit() {
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(2, Math.round(r.width * dpr));
    cv.height = Math.max(2, Math.round(r.height * dpr));
  }

  function proj3(yaw, pitch, W, H) {
    const s = opts.scale || 0.074, ax = opts.ax == null ? 0.49 : opts.ax, ay = opts.ay == null ? 0.38 : opts.ay;
    const cx = W * ax, cy = H * ay, S = W * s;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return p => {
      const [x, y, z] = p;
      const x1 = x * cyw + y * syw, y1 = -x * syw + y * cyw;
      const v = z * cp - y1 * sp, d = z * sp + y1 * cp;
      const k = 1 + 0.075 * d;
      return [cx + S * x1 * k, cy - S * v * k];
    };
  }

  function ring(P, rad, z, seg, phase, arc) {
    const out = [], n = (arc && arc < Math.PI * 2) ? Math.max(2, Math.ceil(seg * arc / (Math.PI * 2))) : seg;
    for (let i = 0; i < n; i++) {
      const a = (phase || 0) + (arc || Math.PI * 2) * i / (n - (arc && arc < Math.PI * 2 ? 1 : 0) || 1);
      out.push(P([rad * Math.cos(a), rad * Math.sin(a), z]));
    }
    return out;
  }

  const path = (pts, close) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close) ctx.closePath(); };

  function drawCubeSkew(t) {
    const W = cv.width, H = cv.height, dpr = W / cv.clientWidth;
    const yaw = Math.PI / 180 * (24 + 1.84 * t), pitch = Math.PI / 180 * 18;
    const P = proj3(yaw, pitch, W, H);
    const pulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 2.2));
    // 底座
    const base = ring(P, 1.12, -1.78, 64);
    path(base, true); ctx.fillStyle = 'rgba(90,215,245,.24)'; ctx.fill();
    ctx.strokeStyle = 'rgba(180,246,255,.9)'; ctx.lineWidth = 3 * dpr; ctx.stroke();
    // 光柱
    for (const [bx, by] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = P([bx * 1.04, by * 1.04, -1.78]), b = P([bx, by, -1.0]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = 'rgba(120,235,255,.22)'; ctx.lineWidth = 12 * dpr; ctx.stroke();
      ctx.strokeStyle = 'rgba(200,250,255,.5)'; ctx.lineWidth = 3 * dpr; ctx.stroke();
    }
    // 波纹
    for (let i = 0; i < 3; i++) {
      const ph = ((t / 2.8) + i / 3) % 1, rad = 1.15 + 0.9 * ph;
      path(ring(P, rad, -1.78, 64), true);
      ctx.strokeStyle = `rgba(170,245,255,${0.85 * (1 - ph) * pulse})`;
      ctx.lineWidth = (4.4 - 2 * ph) * dpr; ctx.stroke();
    }
    // 面
    const front = new Set();
    for (const name in FACES) {
      const xy = FACES[name].map(P);
      let area = 0; for (let i = 0; i < 4; i++) { const a = xy[i], b = xy[(i + 1) % 4]; area += a[0] * b[1] - b[0] * a[1]; }
      if (area < 0) {
        front.add(name);
        path(xy, true);
        ctx.fillStyle = name === 'top' ? 'rgba(255,196,88,.30)' : 'rgba(34,140,175,.30)'; ctx.fill();
      }
    }
    const vis = e => { const [a, b] = e; for (const n of front) { const f = FACES[n]; if (f.some(p => p.join() === a.join()) && f.some(p => p.join() === b.join())) return true; } return false; };
    // 背棱
    ctx.setLineDash([6 * dpr, 8 * dpr]);
    for (const e of EDGES) { if (vis(e)) continue; const a = P(e[0]), b = P(e[1]); path([a, b]); ctx.strokeStyle = 'rgba(150,220,250,.42)'; ctx.lineWidth = 2 * dpr; ctx.stroke(); }
    ctx.setLineDash([]);
    // 可见棱
    ctx.save(); ctx.shadowColor = 'rgba(110,232,255,.9)'; ctx.shadowBlur = 14 * dpr;
    for (const e of EDGES) {
      if (!vis(e)) continue; const a = P(e[0]), b = P(e[1]);
      path([a, b]); ctx.strokeStyle = 'rgba(110,232,255,.5)'; ctx.lineWidth = 10 * dpr; ctx.stroke();
      ctx.strokeStyle = 'rgba(198,240,255,1)'; ctx.lineWidth = 3.4 * dpr; ctx.stroke();
      ctx.strokeStyle = '#f0fdff'; ctx.lineWidth = 1.3 * dpr; ctx.stroke();
    }
    ctx.restore();
    // 流光
    for (let i = 0; i < EDGES.length; i++) {
      const e = EDGES[i]; if (!vis(e)) continue;
      const a = P(e[0]), b = P(e[1]), ph = ((t / 1.7) + i * 0.137) % 1;
      const u0 = Math.max(0, ph - 0.26), u1 = Math.min(1, ph + 0.16);
      path([[a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1]]);
      ctx.strokeStyle = 'rgba(255,224,150,.95)'; ctx.lineWidth = 6 * dpr; ctx.stroke();
      ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1, 4 * dpr, 0, 7); ctx.fillStyle = '#fffbe0'; ctx.fill();
    }
    // 顶点
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const [px, py] = P([x, y, z]);
      ctx.save(); ctx.shadowColor = 'rgba(110,232,255,1)'; ctx.shadowBlur = 12 * dpr;
      ctx.beginPath(); ctx.arc(px, py, 3.6 * dpr, 0, 7); ctx.fillStyle = '#f0fdff'; ctx.fill(); ctx.restore();
    }
    // 金环
    for (let i = 0; i < 3; i++) {
      const ph = t * 2.4 + i * 2 * Math.PI / 3;
      const pts = ring(P, 1.78, 0, 96, ph, Math.PI / 1.9);
      ctx.save(); ctx.shadowColor = 'rgba(255,200,90,.9)'; ctx.shadowBlur = 12 * dpr;
      path(pts); ctx.strokeStyle = 'rgba(255,214,130,.9)'; ctx.lineWidth = 4.4 * dpr; ctx.stroke(); ctx.restore();
    }
    // 两条线
    const line3 = (p0, p1, col, inside, w) => {
      const a = P(p0), b = P(p1), N = 140;
      for (let i = 0; i < N; i++) {
        const t0i = i / N, t1i = (i + 1) / N;
        const x0 = a[0] + (b[0] - a[0]) * t0i, y0 = a[1] + (b[1] - a[1]) * t0i;
        const x1 = a[0] + (b[0] - a[0]) * t1i, y1 = a[1] + (b[1] - a[1]) * t1i;
        path([[x0, y0], [x1, y1]]);
        if (inside((t0i + t1i) / 2)) { ctx.strokeStyle = col; ctx.lineWidth = w * dpr; ctx.shadowColor = col; ctx.shadowBlur = 12 * dpr; }
        else { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = (w - 2) * dpr; ctx.shadowBlur = 0; }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
    };
    line3(A0, A1, '#ffce4a', tt => { const x = A0[0] + (A1[0] - A0[0]) * tt; return x >= -1 && x <= 1; }, 6.6);
    line3(B0, B1, '#ff60be', tt => { const z = B0[2] + (B1[2] - B0[2]) * tt; return z >= -1 && z <= 1; }, 6.6);
    label(P([1.5, -1.05, 1.0]), '上表面', '#ffce4a', dpr);
    label(P([-0.15, 1.0, -1.6]), '前面', '#ff60be', dpr);
  }

  function drawCubeSame(t) {
    const W = cv.width, H = cv.height, dpr = W / cv.clientWidth;
    const yaw = Math.PI / 180 * (24 + 12 * Math.min(1, t / 9)), pitch = Math.PI / 180 * 18;
    const P = proj3(yaw, pitch, W, H);
    drawCubeShell(P, dpr, '#ffce4a');
    for (let i = 0; i < L2.length; i++) {
      const [x0, y0, z0, x1, y1, z1] = L2[i];
      const a = P([x0, y0, z0]), b = P([x1, y1, z1]);
      ctx.save(); ctx.shadowColor = '#ffce4a'; ctx.shadowBlur = 14 * dpr;
      path([a, b]); ctx.strokeStyle = '#ffce4a'; ctx.lineWidth = 6.6 * dpr; ctx.stroke(); ctx.restore();
      const ph = ((t / 1.6) + i * 0.5) % 1, u0 = Math.max(0, ph - 0.22), u1 = Math.min(1, ph + 0.22);
      path([[a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1]]);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6 * dpr; ctx.stroke();
    }
    label(P([0.55, -1.30, 1.0]), '同一平面', '#ffce4a', dpr);
  }

  function drawCubeShell(P, dpr, gold) {
    const W = cv.width, H = cv.height;
    const base = ring(P, 1.12, -1.78, 64);
    path(base, true); ctx.fillStyle = 'rgba(90,215,245,.22)'; ctx.fill();
    for (const [bx, by] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = P([bx * 1.04, by * 1.04, -1.78]), b = P([bx, by, -1.0]);
      path([a, b]); ctx.strokeStyle = 'rgba(120,235,255,.2)'; ctx.lineWidth = 10 * dpr; ctx.stroke();
    }
    const front = new Set();
    for (const name in FACES) {
      const xy = FACES[name].map(P); let area = 0;
      for (let i = 0; i < 4; i++) { const a = xy[i], b = xy[(i + 1) % 4]; area += a[0] * b[1] - b[0] * a[1]; }
      if (area < 0) { front.add(name); path(xy, true); ctx.fillStyle = name === 'top' ? 'rgba(255,196,88,.26)' : 'rgba(34,140,175,.24)'; ctx.fill(); }
    }
    const vis = e => { const [a, b] = e; for (const n of front) { const f = FACES[n]; if (f.some(p => p.join() === a.join()) && f.some(p => p.join() === b.join())) return true; } return false; };
    ctx.setLineDash([5 * dpr, 7 * dpr]);
    for (const e of EDGES) { if (vis(e)) continue; const a = P(e[0]), b = P(e[1]); path([a, b]); ctx.strokeStyle = 'rgba(150,220,250,.35)'; ctx.lineWidth = 2 * dpr; ctx.stroke(); }
    ctx.setLineDash([]);
    for (const e of EDGES) {
      if (!vis(e)) continue; const a = P(e[0]), b = P(e[1]);
      path([a, b]); ctx.strokeStyle = 'rgba(120,232,255,.85)'; ctx.lineWidth = 4.4 * dpr; ctx.stroke();
      ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 1.4 * dpr; ctx.stroke();
    }
  }

  let hitT = null;

  function drawAngle(t) {
    const W = cv.width, H = cv.height, dpr = W / cv.clientWidth;
    const R = W * (opts.scale || 0.095);
    const X = W * (opts.ax == null ? 0.49 : opts.ax), Y = H * (opts.ay == null ? 0.5 : opts.ay);
    const dur = opts.dur || (opts.video && opts.video.duration) || 12.9;
    let th = 90;
    if (mode === 'angle90') {
      const k = Math.max(0, Math.min(1, (t - 0.6) / Math.max(0.1, dur - 2.2)));
      const e = k * k * (3 - 2 * k);
      th = 30 + 60 * e;
    }
    // 整体旋转（rigid）：两条线一起转，夹角恒为 90°
    const rotDeg = (mode === 'rotatePerp') ? 38 * Math.sin(t * Math.PI * 2 / 7.5) : 0;
    const a1 = rotDeg * Math.PI / 180;
    const a2 = (rotDeg + th) * Math.PI / 180;
    const u1 = [Math.cos(a1), -Math.sin(a1)], u2 = [Math.cos(a2), -Math.sin(a2)];
    const L = R * 1.75;
    // 角弧（与 th 同源）
    const pts = []; const a0 = a1; const sweep = th * Math.PI / 180;
    for (let i = 0; i <= 40; i++) { const a = a0 + sweep * i / 40; pts.push([X + R * 0.52 * Math.cos(a), Y - R * 0.52 * Math.sin(a)]); }
    const line = (u, col) => {
      const a = [X - u[0] * L, Y - u[1] * L], b = [X + u[0] * L, Y + u[1] * L];
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14 * dpr;
      path([a, b]); ctx.strokeStyle = col; ctx.lineWidth = 6.6 * dpr; ctx.stroke(); ctx.restore();
      path([a, b]); ctx.strokeStyle = 'rgba(255,253,240,.85)'; ctx.lineWidth = 1.6 * dpr; ctx.stroke();
    };
    line(u1, '#ffce4a');
    line(u2, '#ff60be');
    ctx.save(); ctx.shadowColor = 'rgba(110,232,255,.9)'; ctx.shadowBlur = 12 * dpr;
    path(pts); ctx.strokeStyle = '#bdf3ff'; ctx.lineWidth = 3.2 * dpr; ctx.stroke(); ctx.restore();
    if (th >= 89.5) {
      const q = R * 0.26;
      const p0 = [X, Y];
      const p1 = [X + q * u1[0], Y + q * u1[1]];
      const p2 = [X + q * (u1[0] + u2[0]), Y + q * (u1[1] + u2[1])];
      const p3 = [X + q * u2[0], Y + q * u2[1]];
      path([p0, p1, p2, p3], true); ctx.fillStyle = 'rgba(70,235,150,.12)'; ctx.fill();
      ctx.strokeStyle = '#46eb96'; ctx.lineWidth = 3.4 * dpr; ctx.stroke();
    }
    const deg = Math.round(th);
    const ab = a0 + sweep / 2;                       // 角平分线：标签跟着角走
    const lx = X + R * 0.78 * Math.cos(ab), ly = Y - R * 0.78 * Math.sin(ab);
    const hit = th >= 89.5;
    if (hit && hitT == null) hitT = t;
    if (!hit) hitT = null;
    const sinceHit = hitT == null ? 99 : (t - hitT);
    const blink = hit ? (sinceHit < 1.6 && Math.floor(sinceHit * 9) % 2 ? '#fff1b8' : '#ffc23a') : '#ffe9a8';
    if (hit && sinceHit < 1.6) { ctx.save(); ctx.shadowColor = 'rgba(255,197,46,.95)'; ctx.shadowBlur = 22 * dpr; }
    labelAt(lx, ly, deg + '°', blink, dpr, hit ? 32 : 30);
    if (hit && sinceHit < 1.6) ctx.restore();
    if (th >= 89.5) labelAt(X + R * 1.10 * Math.cos(ab), Y - R * 1.10 * Math.sin(ab), '直角', '#78ffb4', dpr, 24);
    ctx.save(); ctx.shadowColor = 'rgba(255,233,168,.9)'; ctx.shadowBlur = 12 * dpr;
    ctx.beginPath(); ctx.arc(X, Y, 5 * dpr, 0, 7); ctx.fillStyle = '#fffbe0'; ctx.fill(); ctx.restore();
    if (th >= 89.5 && mode === 'angle90') {
      // 直角符号：以两条射线为边的正方形小方框（边长 = 0.26R）
      labelAt(X - R * 0.30 * Math.cos(ab), Y + R * 0.30 * Math.sin(ab) + 26 * dpr, '垂足 O', '#aef0ff', dpr, 24);
    }
    if (mode === 'perp') {
      labelAt(X + u1[0] * L * 0.7, Y + u1[1] * L * 0.7 + 30 * dpr, 'a', '#ffce4a', dpr, 26);
      labelAt(X + u2[0] * L * 0.55, Y + u2[1] * L * 0.55 - 30 * dpr, 'b', '#ff60be', dpr, 26);
      labelAt(X - 58 * dpr, Y + 38 * dpr, '垂足 O', '#aef0ff', dpr, 24);
      labelAt(X - R * 0.95, Y - R * 1.12, 'a ⊥ b', '#ffe9a8', dpr, 30);
    }
    if (hit && sinceHit < 2.4) {
      const e = Math.min(1, sinceHit / 0.55);
      const ease = 1 - Math.pow(1 - e, 3);
      // 冲击环
      ctx.save(); ctx.shadowColor = 'rgba(255,206,74,.95)'; ctx.shadowBlur = 18 * dpr;
      ctx.beginPath(); ctx.arc(X, Y, R * (0.20 + 2.25 * ease), 0, 7);
      ctx.strokeStyle = `rgba(255,214,102,${(1 - e) * 0.95})`; ctx.lineWidth = (9 - 7 * e) * dpr; ctx.stroke();
      ctx.restore();
      // 火花粒子
      for (let i = 0; i < 26; i++) {
        const ang = i * 2.399963 + 0.35;                 // 黄金角，分布均匀
        const sp = 0.55 + 0.45 * ((i * 37) % 11) / 10;
        const rr = R * (0.16 + 2.15 * ease * sp);
        const px = X + rr * Math.cos(ang), py = Y - rr * Math.sin(ang);
        const a = Math.max(0, 1 - e * (0.75 + 0.25 * sp));
        const sz = (2.8 + 3.8 * (1 - e)) * dpr;
        ctx.save(); ctx.shadowColor = 'rgba(255,190,60,.95)'; ctx.shadowBlur = 12 * dpr;
        ctx.fillStyle = `rgba(255,235,160,${a})`;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, 7); ctx.fill();
        // 拖尾
        ctx.strokeStyle = `rgba(255,170,40,${a * 0.55})`; ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath(); ctx.moveTo(X + rr * 0.72 * Math.cos(ang), Y - rr * 0.72 * Math.sin(ang)); ctx.lineTo(px, py); ctx.stroke();
        ctx.restore();
      }
    }
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, R * 1.9);
    g.addColorStop(0, 'rgba(110,232,255,.10)'); g.addColorStop(1, 'rgba(110,232,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R * 1.9, 0, 7); ctx.fill();
  }

  function labelAt(x, y, text, col, dpr, size) {
    ctx.font = 'bold ' + Math.round((size || 26) * dpr / 1.35) + 'px "Microsoft YaHei"';
    const w = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(4,12,22,.9)'; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1 * dpr;
    const bw = w + 20 * dpr, bh = 36 * dpr;
    ctx.beginPath(); ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 10 * dpr); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function label(p, text, col, dpr) { labelAt(p[0], p[1], text, col, dpr, 26); }

  function draw() { ctx.clearRect(0, 0, cv.width, cv.height); if (mode === 'cubeSkew') drawCubeSkew(tm); else if (mode === 'cubeSame') drawCubeSame(tm); else drawAngle(tm); }

  function loop(now) {
    if (!active) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (opts.follow && opts.video && !opts.video.paused && !opts.video.ended) tm = opts.video.currentTime;
    else if (spin) tm += dt;
    if (!opts.follow) tm = opts.video ? opts.video.currentTime : tm + dt;
    draw(); raf = requestAnimationFrame(loop);
  }

  window.GEO = {
    attach(canvas) { cv = canvas; ctx = cv.getContext('2d'); fit(); window.addEventListener('resize', fit); },
    start(m, o) {
      mode = m; opts = o || {}; tm = 0; spin = true; active = true; last = performance.now();
      fit(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    },
    stop() { active = false; cancelAnimationFrame(raf); if (ctx) ctx.clearRect(0, 0, cv.width, cv.height); },
    setSpin(v) { spin = !!v; },
    setMode(m) { mode = m; },
    get mode() { return mode; },
    get time() { return tm; },
    get active() { return active; }
  };
})();
