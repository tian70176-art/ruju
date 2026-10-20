/* 入局 · 大学生反诈沉浸实验室 —— inbox.js
 * 真手机收件箱（30 §2.2 / §2.4 / §4 + 35 §1 §2 §3 + 40 §1 §2 §3）：
 *  · 真消息与骗局用完全一样的入口：点一条 → 进剧本（真消息 = RJ.real 短剧本，骗局 = 模块）
 *  · 两种时长：5 分钟快速局（默认，抽 3 个骗局 + 3 条真消息）/ 完整的一天
 *  · 第二天「骗子回来了」：由第一天的结果决定收到什么（假追回 / 真民警退赃 / 室友 / 升级开场）
 *  · 每条消息按游戏内时间陆续到达，新消息以顶部横幅落下
 *  · 每局结束给「这一局」即时反馈（钱包滚动 + 饭钱换算 + 对方状态），不揭晓答案
 *  · 全部处理完（或 ≥10 条）→ 一天复盘
 */
(function () {
  'use strict';
  var RJ = window.RJ;

  var APP_COLOR = {
    '电话': '#2bb3a8', '短信': '#4a5568', '微聊': '#2ec4b6', '校友圈': '#4361ee', '闲趣二手': '#ffd60a',
    '兼职猫': '#ff9f1c', '同城缘遇': '#ff5d8f', '金沙娱乐': '#d4af37', '零钱包': '#2d6cdf', '云会议': '#5b6bff',
    '反诈中心': '#2d6cdf', '新生群': '#4361ee', '游戏中心': '#7b61ff', '旅行': '#2bb3a8'
  };
  function appColor(app) { return APP_COLOR[app] || '#6b7482'; }
  function dateStr() { var d = new Date(); return (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function seed(s) { return RJ.hashStr(String(s) + '|' + today()); }

  /* ================= 状态 ================= */

  function st() {
    var s = RJ.store.get('inbox', null);
    var d2 = RJ.store.get('day2seed', null);
    if (!s || typeof s !== 'object' || s.day !== today()) {
      s = { day: today(), done: {}, verify: [], lostExtra: 0, finished: false, announced: {} };
      if (d2 && typeof d2 === 'object') { s.day2 = true; s.ctx = d2; }   // 40 §2：第二天
      RJ.store.set('inbox', s);
    }
    if (!s.done) s.done = {};
    if (!s.verify) s.verify = [];
    if (!s.announced) s.announced = {};
    return s;
  }
  function save(s) { RJ.store.set('inbox', s); }

  /* ================= 池子：真消息来自 RJ.real，骗局来自各模块 def.inbox ================= */

  function scamIds() {
    return RJ.MANIFEST.filter(function (id) {
      var d = RJ.modules[id];
      return d && d.inbox && !d.page && !d.day2Only;
    });
  }
  function realIds() {
    return Object.keys(RJ.real).filter(function (id) {
      var d = RJ.real[id];
      return d && d.inbox && !d.day2Only;
    });
  }

  function mkReal(id, timeOverride) {
    var d = RJ.real[id];
    if (!d) return null;
    var ib = RJ.inboxEntryOf(d);
    if (ib.lowOnly && RJ.wallet().left >= 300) return null;      // 妈妈追问短信：余额低时才出现
    return {
      id: id, kind: 'real', time: timeOverride || ib.time || '09:00',
      app: ib.app || (d.app && d.app.name) || '消息',
      icon: ib.icon || (d.app && d.app.icon) || '💬',
      from: RJ.fill(ib.from || d.title || ''), text: RJ.fill(ib.text || '')
    };
  }

  function mkScam(id, timeOverride, ctx) {
    var d = RJ.modules[id];
    if (!d) return null;
    var ib = RJ.inboxEntryOf(d);
    var text = RJ.fill(ib.text || '');
    if (ctx && ctx.allBreak && !ib.upgraded) {                   // 40 §2：全部识破 → 骗子用昨天的信息定制开场
      var up = d.inboxUp;
      if (up) { ib = up; text = RJ.fill(up.text || ''); }
      else {
        var p = RJ.profile();
        text = '「' + (p.nick || '同学') + '同学，昨天你在' + (p.school || '学校') + '那边问的事，我一直记着。」' + text;
      }
    }
    return {
      id: 'sc_' + id, kind: 'scam', mod: id,
      time: timeOverride || ib.time || '10:00', app: ib.app || (d.app && d.app.name) || '消息',
      icon: ib.icon || (d.app && d.app.icon) || '💬',
      from: RJ.fill(ib.from || ''), text: text
    };
  }

  /* ---------- 完整的一天：全部消息 ---------- */
  function fullPool() {
    var out = [];
    realIds().forEach(function (id) { var e = mkReal(id); if (e) out.push(e); });
    scamIds().forEach(function (id) { var e = mkScam(id); if (e) out.push(e); });
    return out;
  }

  /* 快速局的时长上限：先算「走到第一个收割节点还有几步」。
   * 快速局在第一个 harvest 收住，这个距离基本决定这一局要读多少字。
   * 只用它给候选池排序（最短的 8 个里抽 3 个），保证 5 分钟能看完复盘（40 §1）。 */
  function quickCost(def) {
    var nodes = def.nodes || {}, q = [[def.start, 0]], seen = {};
    while (q.length) {
      var it = q.shift(), n = nodes[it[0]];
      if (!n || seen[it[0]]) continue;
      seen[it[0]] = 1;
      if (n.stage === 'harvest' && it[1] > 0) return it[1];
      var nxt = [];
      (n.choices || []).forEach(function (c) { if (c.next) nxt.push(c.next); });
      if (n.next) nxt.push(n.next);
      nxt.forEach(function (id) { q.push([id, it[1] + 1]); });
    }
    return 99;                                   // 外部页面模块：不进快速局
  }

  /* ---------- 5 分钟快速局：3 个骗局 + 3 条真消息（必含 1 条「像骗局的真消息」） ---------- */
  function quickPool() {
    var out = [], d = today();
    var pool = scamIds().filter(function (id) { return quickCost(RJ.modules[id]) <= 4; })
      .sort(function (a, b) { return quickCost(RJ.modules[a]) - quickCost(RJ.modules[b]) || (a < b ? -1 : 1); });
    if (pool.length < 3) pool = scamIds().filter(function (id) { return quickCost(RJ.modules[id]) < 99; });
    RJ.sample(pool, 3, seed('quick-scam')).forEach(function (id) {
      var e = mkScam(id); if (e) out.push(e);
    });
    var tricky = ['r1', 'r5', 'r8'].filter(function (id) { return realIds().indexOf(id) >= 0; });
    var must = RJ.pickOne(tricky, seed('quick-must'));
    var rest = realIds().filter(function (id) { return id !== must; }).filter(function (id) {
      var ib = RJ.inboxEntryOf(RJ.real[id]);
      return !ib.lowOnly;
    });
    var picked = [must].concat(RJ.sample(rest, 2, seed('quick-real'))).filter(Boolean);
    picked.forEach(function (id) { var e = mkReal(id); if (e) out.push(e); });
    return out;
  }
  RJ.inbox.quickIds = function () {
    var es = quickPool(), o = { scam: [], real: [] };
    es.forEach(function (e) { if (e.kind === 'scam') o.scam.push(e.mod); else o.real.push(e.id); });
    return o;
  };

  /* ---------- 第二天（40 §2）：由第一天的结果决定 ---------- */
  var DAY2_TIME = {
    zhuihui: '10:20', d2_police: '11:30', d2_roommate: '12:40',
    scam: ['14:10', '16:30', '19:20'], real: ['09:20', '15:20', '20:40']
  };

  function day2Pool(s) {
    var ctx = s.ctx || {};
    var out = [], cheat = !!(ctx.cheated && ctx.cheated.length);
    if (cheat) {
      var z = mkScam('zhuihui', DAY2_TIME.zhuihui, null); if (z) out.push(z);
      var pol = mkReal('d2_police', DAY2_TIME.d2_police); if (pol) out.push(pol);
    }
    if (ctx.blockedZhou) { var rm = mkReal('d2_roommate', DAY2_TIME.d2_roommate); if (rm) out.push(rm); }

    var played = {};
    (ctx.played || []).forEach(function (id) { played[id] = true; });
    var fresh = scamIds().filter(function (id) { return !played[id]; });
    if (fresh.length < 3) fresh = fresh.concat(scamIds().filter(function (id) { return played[id]; }));
    RJ.sample(fresh, 3, seed('day2-scam')).forEach(function (id, i) {
      var e = mkScam(id, DAY2_TIME.scam[i], ctx); if (e) out.push(e);      // 全部识破 → 升级开场
    });

    var rpool = realIds().filter(function (id) {
      if (id === 'r9b') return false;
      if (ctx.blockedZhou && id === 'r5') return false;                    // 昨天拉黑了室友，今天不再让他带饭
      return true;
    });
    RJ.sample(rpool, 3, seed('day2-real')).forEach(function (id, i) {
      var e = mkReal(id, DAY2_TIME.real[i]); if (e) out.push(e);
    });
    return out;
  }

  function entries() {
    var s = st();
    var out = s.day2 ? day2Pool(s) : (RJ.mode() === 'quick' ? quickPool() : fullPool());
    out.sort(function (a, b) { return a.time < b.time ? -1 : (a.time > b.time ? 1 : 0); });
    return out;
  }
  RJ.inboxEntries = entries;

  /* 开局 3 条（最早的 3 条），其余按游戏内时钟陆续到达（35 §2） */
  function arrivedList(s) {
    var list = entries(), clock = RJ.clock.text();
    return list.filter(function (e, i) {
      return i < 3 || e.time <= clock || !!s.done[e.id];
    });
  }

  /* 处理完一条后，把时钟推进到下一条未处理消息的时间 → 它就"到达"了 */
  function advanceClock(s) {
    var next = entries().filter(function (e) { return !s.done[e.id] && e.time > RJ.clock.text(); })[0];
    if (next) RJ.clock.advanceTo(next.time);
  }

  function announceCandidates(s) {
    var clock = RJ.clock.text();
    return entries().filter(function (e) { return e.time <= clock && !s.done[e.id] && !s.announced[e.id]; });
  }
  function notifyNew(s) {
    var cand = announceCandidates(s)[0];
    if (!cand) return false;
    s.announced[cand.id] = 1; save(s);
    if (RJ.engine && RJ.engine.banner) RJ.engine.banner({ app: cand.app, from: cand.from, text: cand.text });
    // 只在玩家已经操作过页面时震动，否则 Chrome 会把被拦截的调用打进控制台
    try {
      if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(80);
    } catch (e) { }
    return true;
  }
  var bannerToken = null;
  RJ.inbox.nextBanner = function (token) {          // 剧本进行中由引擎调用
    if (bannerToken === token) return null;
    var s = st(), cand = announceCandidates(s)[0];
    if (!cand) return null;
    bannerToken = token;
    s.announced[cand.id] = 1; save(s);
    return { app: cand.app, from: cand.from, text: cand.text };
  };

  function mark(s, e, patch) {
    var cur = s.done[e.id] || {};
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) cur[k] = patch[k];
    if (!cur.ts) cur.ts = Date.now();
    cur.kind = e.kind;
    if (e.mod) cur.mod = e.mod;
    s.done[e.id] = cur;
    // 只有真消息的损失（没去处理造成的，如奖学金）进 lostExtra；骗局的损失由 rj.runs 统一计算
    if (e.kind === 'real' && cur.loss) s.lostExtra = (s.lostExtra || 0) + cur.loss;
    save(s);
    RJ.clock.advanceTo(e.time);
    advanceClock(s);
    notifyNew(s);
  }

  /* ================= 锁屏通知（最近 4 条） ================= */

  RJ.inbox.lockNotices = function () {
    var list = entries().filter(function (e) { return e.id !== 'r9b'; });
    return list.slice(0, 4).map(function (e) { return { app: e.app, title: e.from, body: e.text }; });
  };

  /* ================= 一局结束的即时反馈（35 §3） ================= */

  function runFeedback(def, run, ending) {
    var victim = def.kind !== 'real';
    var loss = victim ? (run.loss || 0) : (ending.loss || 0);
    var after = RJ.wallet().left;
    var before = Math.min(RJ.wallet().base, after + loss);
    var box = RJ.el('div', { class: 'result-card' });
    box.appendChild(RJ.el('div', { class: 'result-label', text: victim ? '这一局 · 零钱包' : '这一条 · 你的损失' }));
    var num = RJ.el('div', {
      class: 'result-num' + (loss > 0 ? ' bad' : ' ok'),
      text: victim ? RJ.yuan(before) : RJ.yuan(loss)
    });
    box.appendChild(num);
    box.appendChild(RJ.el('div', { class: 'result-sub', id: 'rf-sub', text: victim ? '' : ('零钱包现在 ' + RJ.yuan(Math.max(0, after))) }));
    return { box: box, num: num, before: before, after: after, loss: loss, victim: victim };
  }

  function rollNumber(el, from, to, done) {
    if (RJ.reduceMotion() || from === to) { el.textContent = RJ.yuan(to); if (done) done(); return; }
    var t0 = Date.now(), dur = 1000;
    var handle = setInterval(function () {
      if (!document.body.contains(el)) { clearInterval(handle); return; }
      var p = Math.min(1, (Date.now() - t0) / dur);
      var v = Math.round(from + (to - from) * p);
      el.textContent = RJ.yuan(v);
      if (p >= 1) { clearInterval(handle); if (done) done(); }
    }, 40);
  }

  /* 模块跑完后的收束（30 §4：先不揭晓，35 §3：但要让玩家感觉到后果） */
  RJ.inbox.afterRun = function (def, run) {
    var s = st();
    var id = 'sc_' + def.id;
    // 识破 = S/A（零损失）。B 是"及时止损"，钱已经出去了，不算识破；快速局截断（cut）也算没走完
    var ok = run.grade === 'S' || run.grade === 'A';
    mark(s, { id: id, kind: 'scam', mod: def.id },
      { action: 'engaged', ok: ok, grade: run.grade, ending: run.ending, loss: run.loss || 0, cut: !!run.quick });
    save(s);
    RJ.go('#/read');
  };

  /* 真消息剧本结束：结局写回收件箱（35 §1） */
  RJ.inbox.finishReal = function (def, run, eid) {
    var ending = (def.endings || {})[eid] || {};
    var s = st();
    mark(s, { id: def.id, kind: 'real' }, {
      action: 'script', ok: ending.ok === true, misjudge: !!ending.misjudge,
      loss: ending.loss || 0, ending: eid, result: ending.result || ending.text || ''
    });
    save(s);
    RJ.lastRun = { mod: def.id, run: run, def: def };
    RJ.go('#/read');
  };

  /* 「这一局」页（#/read） */
  RJ.inbox.interstitial = function (host) {
    var lr = RJ.lastRun || {};
    var def = RJ.defOf(lr.mod) || {};
    var run = lr.run || {};
    var ending = (def.endings || {})[run.ending] || {};
    var f = runFeedback(def, run, ending);
    var page = RJ.el('div', { class: 'page' }, [f.box]);
    var sub = f.box.querySelector('#rf-sub');

    if (sub && f.victim) {
      sub.textContent = f.loss > 0
        ? ('≈ 你 ' + RJ.MEALS(f.loss) + ' 顿的饭钱（模拟数据）')
        : '这一局你没亏钱';
    }

    if (def.kind !== 'real') {
      var lost = (f.loss > 0);
      page.appendChild(RJ.el('div', { class: 'result-oppo', text: lost ? '对方：好的，收到 😊' : '对方已读，没有再回复' }));
      if (run.quick) {
        page.appendChild(RJ.el('div', { class: 'muted', text: '快速局只演到“对方要你掏钱”的前一步，完整的收割在你没看到的那半段里。' }));
      }
    } else if (ending.result || ending.text) {
      page.appendChild(RJ.el('div', { class: 'result-oppo' + (ending.ok === true ? ' good' : '') , text: ending.result || ending.text }));
      if (ending.loss) page.appendChild(RJ.el('div', { class: 'result-oppo', text: '少了 ' + RJ.yuan(ending.loss) + '，但这笔不是被骗：是你自己没去处理。' }));
    }
    var vs = run.verify || [];
    if (vs.length) {
      var good = vs.filter(function (v) { return v.ok; }).length;
      page.appendChild(RJ.el('div', { class: 'muted', text: '这一局你核实了 ' + vs.length + ' 次：走对渠道 ' + good + ' 次、走错渠道 ' + (vs.length - good) + ' 次。' }));
    }
    var btns = [RJ.el('button', { class: 'btn btn-primary', text: '返回收件箱', onclick: function () { RJ.go('#/home'); } })];
    if (run.quick) btns.push(RJ.el('button', { class: 'btn btn-ghost', text: '玩完整的一天', onclick: function () { playFull(); } }));
    page.appendChild(RJ.el('div', { class: 'btns' }, btns));
    page.appendChild(RJ.el('p', { class: 'foot-note', text: RJ.COMPLIANCE }));
    host.appendChild(page);

    if (f.victim) {
      rollNumber(f.num, f.before, f.after, function () {
        f.num.classList.toggle('bad', f.after < f.before);
        f.num.classList.toggle('ok', f.after >= f.before);
      });
    } else {
      f.num.classList.toggle('bad', f.loss > 0);
      f.num.classList.toggle('ok', f.loss <= 0);
    }
  };

  /* ================= 主屏（收件箱） ================= */

  RJ.inbox.render = function (host) {
    var s = st();
    if (s.finished) { RJ.inbox.review(host); return; }

    var arrived = arrivedList(s);
    var left = arrived.filter(function (e) { return !s.done[e.id]; }).length;
    var doneN = arrived.filter(function (e) { return s.done[e.id]; }).length;

    var wrap = RJ.el('div', { class: 'inbox' });
    var headRight = s.day2 ? '第二天 · 骗子回来了' : (RJ.mode() === 'quick' ? '5 分钟快速局' : '完整的一天');
    wrap.appendChild(RJ.el('div', { class: 'inbox-head' }, [
      RJ.el('div', { class: 'inbox-date', text: '今天 · ' + dateStr() }),
      RJ.el('div', { class: 'inbox-prog', text: (left > 0 ? ('还剩 ' + left + ' 条未读') : '都处理完了') + ' · ' + headRight })
    ]));
    var w = RJ.wallet();
    var wEl = RJ.el('div', { class: 'inbox-wallet', text: '零钱包 ' + RJ.yuan(Math.max(0, w.left)) + '（这个月）' + (w.spent ? ' · 已花 ' + RJ.yuan(w.spent) : '') });
    wrap.appendChild(wEl);

    var groups = [['上午', 0, 12], ['下午', 12, 18], ['晚上', 18, 24]];
    var ls = RJ.el('div', { class: 'inbox-list' });
    groups.forEach(function (g) {
      var items = arrived.filter(function (e) {
        var h = Number(String(e.time).split(':')[0]);
        return h >= g[1] && h < g[2];
      });
      if (!items.length) return;
      ls.appendChild(RJ.el('div', { class: 'inbox-group', text: g[0] }));
      items.forEach(function (e) {
        var d = s.done[e.id];
        ls.appendChild(RJ.el('button', {
          class: 'msg-row' + (d ? ' done' : ''), 'data-id': e.id,
          onclick: function () { RJ.go('#/m/' + (e.kind === 'scam' ? e.mod : e.id)); }
        }, [
          RJ.el('span', { class: 'msg-ico-wrap' }, [
            RJ.el('span', { class: 'msg-ico', style: { background: appColor(e.app) }, text: e.icon }),
            d ? null : RJ.el('span', { class: 'msg-dot' })
          ]),
          RJ.el('div', { class: 'msg-main' }, [
            RJ.el('div', { class: 'msg-top' }, [RJ.el('span', { class: 'msg-from', text: e.from }), RJ.el('span', { class: 'msg-time', text: e.time })]),
            RJ.el('div', { class: 'msg-text', text: e.text })
          ])
        ]));
      });
    });
    wrap.appendChild(ls);

    var foot = RJ.el('div', { class: 'inbox-foot' });
    if (left === 0) foot.appendChild(RJ.el('button', { class: 'btn btn-primary', text: '今天的复盘', onclick: function () { finishDay(s); } }));
    else if (doneN >= 10) foot.appendChild(RJ.el('button', { class: 'btn btn-ghost', text: '今天就到这：看复盘', onclick: function () { finishDay(s); } }));
    wrap.appendChild(foot);
    wrap.appendChild(RJ.el('div', { class: 'dock', style: { marginTop: '12px' } }, [
      RJ.el('button', { class: 'dock-app', onclick: function () { RJ.go('#/center'); } }, [
        RJ.el('span', { class: 'appicon-emo', text: '🛡️' }), RJ.el('span', { class: 'dock-name', text: '反诈中心' })
      ])
    ]));
    host.appendChild(wrap);
    if (!RJ.store.get('profile', null)) RJ.guide();

    // 回到收件箱时钱包数字滚动一次（35 §3）
    var from = RJ.store.get('lastShownWallet', null);
    RJ.store.set('lastShownWallet', w.left);
    if (from !== null && from !== w.left && !RJ.reduceMotion()) rollNumber(wEl, from, w.left);
  };

  function finishDay(s) {
    s.finished = true;
    save(s);
    var days = RJ.store.get('days', []);
    if (!Array.isArray(days)) days = [];
    days.push(score(s));
    if (days.length > 50) days = days.slice(-50);
    RJ.store.set('days', days);
    RJ.go('#/review');
  }

  /* ================= 计分 ================= */

  function score(s) {
    var all = entries();
    var sc = all.filter(function (e) { return e.kind === 'scam'; });
    var re = all.filter(function (e) { return e.kind === 'real'; });
    var breakN = 0, trustN = 0, misN = 0;
    sc.forEach(function (e) { var d = s.done[e.id]; if (d && d.ok) breakN++; });
    re.forEach(function (m) {
      var d = s.done[m.id];
      if (!d) return;
      if (d.misjudge) { misN++; return; }
      if (d.ok) trustN++;
    });
    var breakRate = sc.length ? breakN / sc.length : 0;
    var trustRate = re.length ? trustN / re.length : 0;
    var title = (breakRate >= 0.7 && trustRate >= 0.75) ? '反诈老手'
      : (breakRate >= 0.7 && trustRate < 0.75) ? '惊弓之鸟'
        : '目标客户';
    return {
      day: s.day, day2: !!s.day2, mode: RJ.mode(),
      scam: sc.length, scamBreak: breakN, breakRate: breakRate,
      real: re.length, realOk: trustN, trustRate: trustRate, misjudge: misN,
      title: title, lostExtra: s.lostExtra || 0, wallet: RJ.wallet().left,
      verify: s.verify || [], ts: Date.now()
    };
  }
  RJ.inbox.score = score;

  /* 第一天结果摘要（40 §2）：决定第二天收到什么 */
  function summary(s) {
    var played = [], cheated = [], scamN = 0, breakN = 0;
    entries().forEach(function (e) {
      var d = s.done[e.id];
      if (!d) return;
      if (e.kind === 'scam') {
        scamN++;
        if (e.mod && played.indexOf(e.mod) < 0) played.push(e.mod);
        if (d.ok) breakN++;
        else if (d.grade === 'C' || d.grade === 'X') cheated.push({ mod: e.mod, loss: d.loss || 0 });
      }
    });
    return {
      day: today(), ts: Date.now(), played: played, cheated: cheated,
      lost: cheated.reduce(function (a, c) { return a + (c.loss || 0); }, 0),
      allBreak: scamN > 0 && breakN === scamN,
      blockedZhou: RJ.flag('blockedZhou'),
      title: score(s).title
    };
  }
  RJ.inbox.summary = summary;

  /* ================= 复盘页（30 §4 + 35 §4 + 40 §1） ================= */

  RJ.inbox.review = function (host) {
    document.body.classList.add('skin-dark');
    var s = st();
    if (!s.finished) { s.finished = true; save(s); }
    var o = score(s);
    var quick = !s.day2 && RJ.mode() === 'quick';
    var totalScam = RJ.MANIFEST.filter(function (id) {
      var d = RJ.modules[id]; return d && d.inbox && !d.page && !d.day2Only;
    }).length;
    var seenScam = {};
    entries().forEach(function (e) { if (e.kind === 'scam' && e.mod) seenScam[e.mod] = 1; });
    var missed = Math.max(0, totalScam - Object.keys(seenScam).length);

    var page = RJ.el('div', { class: 'review' });
    page.appendChild(RJ.el('div', { class: 'board-head' }, [
      RJ.el('div', { class: 'bh-tag', text: s.day2 ? '第二天 · 骗子回来了' : '今天的复盘' }),
      RJ.el('h2', { class: 'board-title', text: '一天 ' + entries().length + ' 条消息，你处理了 ' + (Object.keys(s.done).length) + ' 条' }),
      RJ.el('p', { class: 'muted', text: quick ? '这是 5 分钟快速局：3 个骗局 + 3 条真消息。' : '识骗不是“全都不信”：真的消息也有代价。' })
    ]));

    page.appendChild(RJ.el('div', { class: 'sec-title', text: '两个分数' }));
    page.appendChild(RJ.el('div', { class: 'score-row' }, [
      RJ.el('div', { class: 'score-box' }, [
        RJ.el('div', { class: 'score-big', text: o.scamBreak + '/' + o.scam }),
        RJ.el('div', { class: 'kpi-label', text: '🎯 识骗率 ' + Math.round(o.breakRate * 100) + '%' })
      ]),
      RJ.el('div', { class: 'score-box' }, [
        RJ.el('div', { class: 'score-big', text: o.realOk + '/' + o.real }),
        RJ.el('div', { class: 'kpi-label', text: '🤝 信任率 ' + Math.round(o.trustRate * 100) + '%' })
      ])
    ]));
    page.appendChild(RJ.el('div', { class: 'title-card' }, [
      RJ.el('div', { class: 'title-name', text: o.title }),
      RJ.el('div', { class: 'title-why', text: o.title === '反诈老手' ? '骗局都挡住了，真的消息也没漏。'
        : o.title === '惊弓之鸟' ? '你守住了钱，也错过了奖学金和朋友。多疑也有代价——有人把来退钱的警察当成了骗子。'
          : '今天的消息里，有人已经拿到了你的名字和信息。' })
    ]));
    var left = Math.max(0, o.wallet);
    page.appendChild(RJ.el('div', { class: 'card' }, [
      RJ.el('div', { class: 'sec-title', text: '这个月' }),
      RJ.el('div', { class: 'mono', text: '零钱包：' + RJ.yuan(left) + '　≈ 还剩 ' + RJ.MEALS(left) + ' 顿饭（约 ' + Math.floor(RJ.MEALS(left) / 3) + ' 天，模拟数据）' }),
      o.lostExtra ? RJ.el('div', { class: 'muted', text: '另外错过了 ' + RJ.yuan(o.lostExtra) + ' 奖学金：不是被骗，是把真通知当成了骗局（多疑的代价）。' }) : null,
      RJ.el('div', { class: 'muted', text: '本月累计被骗（含之前的局）：' + RJ.yuan(RJ.spent()) })
    ]));

    if (quick) {
      page.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('div', { class: 'sec-title', text: '还有 ' + missed + ' 个骗局没遇到' }),
        RJ.el('p', { class: 'muted', text: '快速局只抽了 3 个。完整的一天里，11 条骗局和 9 条真消息会一起落进这部手机。' }),
        RJ.el('div', { class: 'btns' }, [
          RJ.el('button', { class: 'btn btn-primary', text: '玩完整的一天', onclick: function () { playFull(); } })
        ])
      ]));
    }

    page.appendChild(RJ.el('div', { class: 'sec-title', text: '一天时间线 · 点任意一条看详情' }));
    var tl = RJ.el('div', { class: 'tl' });
    entries().forEach(function (e) {
      var d = s.done[e.id] || null;
      var sp = stampOf(e, d);
      tl.appendChild(RJ.el('button', {
        class: 'tl-row', 'data-id': e.id,
        onclick: function () {
          if (RJ.review && RJ.review.card) RJ.review.card(e, d, sp.text, sp.cls);
          else RJ.toast('这一条：' + sp.text);
        }
      }, [
        RJ.el('span', { class: 'tl-time', text: e.time }),
        RJ.el('div', { class: 'tl-main' }, [
          RJ.el('div', { class: 'tl-from', text: e.from + ' · 点开看详情 →' }),
          RJ.el('div', { class: 'tl-text', text: e.text })
        ]),
        RJ.el('span', { class: 'tl-stamp ' + sp.cls, text: sp.text })
      ]));
    });
    page.appendChild(tl);

    var vs = [];
    RJ.runs().forEach(function (r) { (r.verify || []).forEach(function (v) { vs.push(v); }); });
    (s.verify || []).forEach(function (v) { vs.push(v); });
    var good = vs.filter(function (v) { return v.ok; }).length, badN = vs.filter(function (v) { return !v.ok; }).length;
    page.appendChild(RJ.el('div', { class: 'sec-title', text: '你的核实习惯' }));
    page.appendChild(RJ.el('div', { class: 'card habit' }, [
      RJ.el('div', { class: 'habit-row' }, [RJ.el('span', { text: '走对渠道' }), RJ.el('b', { class: 'ok', text: good + ' 次' })]),
      RJ.el('div', { class: 'habit-row' }, [RJ.el('span', { text: '走错渠道' }), RJ.el('b', { class: 'bad', text: badN + ' 次' })]),
      badN ? RJ.el('div', { class: 'muted', text: '走错的那几次：搜索结果第 1 条、对方给的号码、对方拉的群——都是他们安排的。' }) : null,
      !vs.length ? RJ.el('div', { class: 'muted', text: '这一天你没有核实过任何东西。' }) : null
    ]));

    var btns = [];
    if (s.day2) {
      btns.push(RJ.el('button', { class: 'btn btn-primary', text: '重开第一天', onclick: function () { restart(); } }));
    } else {
      btns.push(RJ.el('button', { class: 'btn btn-primary', text: '再玩一天：骗子回来了', onclick: function () { nextDay(); } }));
    }
    btns.push(RJ.el('button', { class: 'btn btn-ghost', text: '看结局图鉴', onclick: function () { RJ.go('#/center/gallery'); } }));
    btns.push(RJ.el('button', { class: 'btn btn-ghost', text: '反诈中心', onclick: function () { RJ.go('#/center/report'); } }));
    page.appendChild(RJ.el('div', { class: 'btns' }, btns));
    page.appendChild(RJ.el('p', { class: 'foot-note', text: RJ.COMPLIANCE }));
    host.appendChild(page);
  };

  /* 盖章口径（reveal.js 的复盘卡片也用同一套，见 RJ.inbox.stampOf） */
  function stampOf(e, d) {
    if (!d) return { text: e.kind === 'scam' ? '没理它' : '没处理', cls: 'st-miss' };
    if (e.kind === 'scam') {
      if (d.cut) return { text: '没走完', cls: 'st-miss' };
      if (d.action === 'report') return { text: '已识破', cls: 'st-break' };
      if (d.ok === true) return { text: '已识破', cls: 'st-break' };
      if (d.ok === false && d.grade === 'B') return { text: '及时止损', cls: 'st-in' };
      if (d.ok === false) return { text: '已入局', cls: 'st-in' };
      return { text: '处理中', cls: 'st-miss' };
    }
    if (d.misjudge) return { text: '误判', cls: 'st-miss' };
    if (d.ok) return { text: '正确处理', cls: 'st-ok' };
    return { text: '漏了', cls: 'st-miss' };
  }
  RJ.inbox.stampOf = stampOf;

  /* 40 §1：从复盘直接切到「完整的一天」（同一天重来一次，这次全部消息都在） */
  function playFull() {
    RJ.setMode('full');
    RJ.store.del('inbox');
    RJ.store.del('lastShownWallet');
    RJ.clock.reset();
    bannerToken = null;
    RJ.go('#/home');
  }
  RJ.inbox.playFull = playFull;

  /* 40 §2：「再玩一天」= 第二天，由第一天的结果决定收到什么 */
  function nextDay() {
    var s = st();
    var ctx = summary(s);
    RJ.store.set('day2seed', ctx);
    RJ.store.del('inbox');
    RJ.store.del('lastShownWallet');
    RJ.clock.reset();
    bannerToken = null;
    RJ.go('#/home');
  }
  RJ.inbox.nextDay = nextDay;

  /* 重开第一天（清掉第二天状态） */
  function restart() {
    RJ.store.del('day2seed');
    RJ.store.del('inbox');
    RJ.store.del('lastShownWallet');
    RJ.clock.reset();
    ['hint96110', 'codeLeak', 'blockedZhou'].forEach(function (k) { RJ.store.del('flag.' + k); });
    bannerToken = null;
    RJ.go('#/home');
  }
  RJ.inbox.restart = restart;
})();
