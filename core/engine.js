/* 入局 · 大学生反诈沉浸实验室 —— engine.js
 * 剧本引擎：一个引擎跑所有剧本（01 §5）。模块只写数据 + 少量自定义小组件。
 * 场景 chat / sms / call / video / app；内置小组件见 widgets.js。
 */
(function () {
  'use strict';
  var RJ = window.RJ;
  var st = null, timers = [], intervals = [], offKey = null, active = false, pending = null;

  function clearTimers() {
    timers.forEach(function (t) { clearTimeout(t); }); timers = [];
    intervals.forEach(function (t) { clearInterval(t); }); intervals = [];
  }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); intervals.push(t); return t; }

  var eng = RJ.engine = {};

  /* 40 §1：快速局里，骗局演到第一个 harvest 节点就收住，直接进「对方已读」。
     剧情短了，但反转保留（翻面页照常完整）。 */
  var QUICK_ENDING = {
    grade: 'B', title: '对方已读', stamp: 'stop', quick: true,
    text: '快速局到这里为止：故事没有演完，但你已经走到了对方要你掏钱的那一步。真正的收割，都在这一步之后。想看完整剧本，回复盘页点「玩完整的一天」。'
  };

  eng.stop = function () {
    active = false; clearTimers(); pending = null;
    if (offKey) { offKey(); offKey = null; }
    var p = document.getElementById('phone');
    if (p) {
      p.classList.remove('sharing');
      // 插入通知与"屏幕共享中"标签挂在 #phone 上，离开剧本时必须一起清掉，否则会盖在后面每一页的顶部
      var stale = p.querySelectorAll('.itb, #share-tag');
      for (var i = 0; i < stale.length; i++) stale[i].parentNode.removeChild(stale[i]);
    }
  };
  eng.state = function () { return st; };
  eng.isActive = function () { return active; };

  eng.run = function (host, def, opts) {
    clearTimers();
    if (offKey) { offKey(); offKey = null; }
    active = true;
    def = RJ.variantOf ? RJ.variantOf(def) : def;      // 40 §3：按当天的变体抽一份节点视图
    var quick = (RJ.mode && RJ.mode() === 'quick') && def.kind !== 'real' && !(opts && opts.quick === false);
    st = {
      def: def, id: def.id, node: null, nodeObj: null, path: [], picks: [],
      marks: {}, hooks: {}, sum: 0, maxStage: 'lure', t0: Date.now(),
      sceneHost: null, hostScene: null, hostApp: null, contact: null,
      shareOn: false, done: false, step: 0, callLive: false, actions: null,
      verify: [], order: [], lastWho: null, seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
      autoVerify: !!(opts && opts.autoVerify), quick: !!quick, quickCut: false
    };
    st.root = RJ.el('div', { class: 'mod' });
    st.root.addEventListener('click', function () { if (pending && pending.skip) pending.skip(); });
    host.appendChild(st.root);
    offKey = RJ.onKey(function (e) { return keyHandler(e); });
    applyShare();
    go(def.start);
  };

  /* ---------------- 状态与阶段 ---------------- */

  function bumpStage(s) {
    if (RJ.stageRank(s) > RJ.stageRank(st.maxStage)) st.maxStage = s;
  }

  function go(nodeId) {
    if (!active) return;
    var node = st.def.nodes[nodeId];
    if (!node) { RJ.toast('剧本节点缺失：' + nodeId); return; }
    if (node.if && !RJ.flag(node.if)) {              // 条件节点：标记没满足就跳过
      if (node.next) { go(node.next); return; }
      return;
    }
    st.step++;
    if (st.step > 300) { end(endId('e_x') || firstEnding()); return; }
    st.node = nodeId; st.nodeObj = node;
    st.path.push(nodeId);
    if (st.path.length > 200) st.path.shift();
    if (node.money) { st.sum += node.money; }
    bumpStage(node.stage || 'lure');
    if (node.shareOff) { st.shareOn = false; applyShare(); }
    renderNode(node);
  }

  function firstEnding() {
    var es = st.def.endings || {}, k;
    for (k in es) if (Object.prototype.hasOwnProperty.call(es, k)) return k;
    return 'end';
  }
  function endId(id) { return st.def.endings && st.def.endings[id] ? id : null; }

  /* ---------------- 场景骨架 ---------------- */

  function appColor() {
    return (st.def.app && st.def.app.color) || '#2d6cdf';
  }

  function renderNode(node) {
    var scene = node.scene || (st.hostScene || 'chat');
    var appName = node.app || st.hostApp || (st.def.app && st.def.app.name) || '微聊';
    if (scene !== 'app') st.chatApp = appName;      // 记住"聊天在哪个 App 里"，给 app 场景的迷你日志用
    var staleBd = st.root.querySelector('.widget-backdrop');   // 弹窗遮罩不跨节点留存
    if (staleBd && staleBd.parentNode) staleBd.parentNode.removeChild(staleBd);
    var reuse = st.sceneHost && scene === st.hostScene && appName === st.hostApp &&
      (scene === 'chat' || scene === 'sms') && st.sceneHost.msgs;
    if (scene !== 'call') st.callLive = false;
    var msgs, actions, head;

    if (reuse) {
      msgs = st.sceneHost.msgs;
      actions = st.sceneHost.actions;
      RJ.clear(actions);
      head = st.sceneHost.head;
      st.sceneHost.actions = actions;
      if (scene === 'chat' && head) {
        var who = contactOf(node) || st.contact;
        if (who && head.title !== who) { head.title = who; head.titleEl.textContent = who; }
      }
    } else {
      RJ.clear(st.root);
      st.hostApp = appName;              // 先记录，bar()/迷你日志才能显示当前 App 名
      st.hostScene = scene;
      var built = buildScene(scene, appName, node);
      st.sceneHost = built; st.lastWho = null;
      msgs = built.msgs; actions = built.actions; head = built.head;
      st.root.appendChild(built.el);
    }
    st.actions = actions;
    aside(node);   // 课堂解说栏在节点开始时就更新，不等台词播完

    var lines = node.say || [];
    if (st.pendingSys) { lines = [['sys', st.pendingSys]].concat(lines); st.pendingSys = null; }
    var widget = node.widget;
    showInterrupt(node);
    inboxBanner();
    if (scene === 'call' && !st.callLive) {
      showIncoming(built, node, function () { finish(); });
    } else {
      if (scene === 'call') startCallTimer(built);
      finish();
    }
    function finish() {
      playSay(msgs, lines, function () {
        if (st.quick && !st.quickCut && node.stage === 'harvest') {   // 40 §1：快速局截断
          st.quickCut = true;
          var at = built && built.el ? built.el.querySelector('.actions') : null;
          if (at) at.appendChild(RJ.el('div', { class: 'muted small', text: '（快速局到此为止 · 对方已读）' }));
          later(function () { end('e_quick', QUICK_ENDING); }, RJ.reduceMotion() ? 0 : 900);
          return;
        }
        if (widget) {
          var wname = widget[0], wprops = widget[1] || {};
          var ctx = makeCtx(node, actions);
          var known = (RJ.widgets && RJ.widgets[wname]) || (st.def.widgets && st.def.widgets[wname]);
          var selfActions = (RJ.widgetSelf && RJ.widgetSelf[wname]) || (st.def.widgetSelf && st.def.widgetSelf[wname]);
          var wHost = RJ.el('div', { class: 'widget w-' + wname + (selfActions ? ' modalish' : '') });
          if (scene === 'app') {
            var sc = st.root.querySelector('.scene');
            if (sc) sc.insertBefore(wHost, actions); else actions.appendChild(wHost);
          } else {
            if (selfActions) {
              var scx = st.root.querySelector('.scene');
              if (scx) scx.appendChild(RJ.el('div', { class: 'widget-backdrop' }));
            }
            actions.appendChild(wHost);
          }
          if (typeof known === 'function') {
            try { known(wHost, wprops, ctx); }
            catch (e) { wHost.appendChild(RJ.el('p', { class: 'muted', text: '小组件出错：' + (e && e.message) })); }
          } else {
            wHost.appendChild(RJ.el('p', { class: 'muted', text: '未知小组件：' + wname }));
          }
          if (!selfActions) actBar(actions, node, ctx);
        } else {
          actBar(actions, node, makeCtx(node, actions));
        }
        aside(node);
        revealActions();   // 小屏上小组件/选项会落在折叠线以下，必须滚到底让玩家看见按钮
        startPressure(node, actions);
        if (st.autoVerify && st.step === 1) { st.autoVerify = false; eng.openVerify(); }
      });
    }
  }

  /* 来电界面的「挂断」该走哪个选项：
     · 节点写了 node.hangup = 原选项下标 就用它
     · 否则优先找文本里带「挂断」的选项（真消息的挂断 = 漏处理，不是 safe）
     · 再否则退回第一个 safe（骗局里挂断=止损，这是对的） */
  function hangupIndex(node) {
    var chs = node.choices || [];
    if (typeof node.hangup === 'number' && chs[node.hangup]) return node.hangup;
    for (var i = 0; i < chs.length; i++) if (chs[i].text && chs[i].text.indexOf('挂断') >= 0) return i;
    for (var j = 0; j < chs.length; j++) if (chs[j].safe) return j;
    return chs.length - 1;
  }

  /* 来电：全屏来电 → 接听/挂断 → 通话界面（01 §5.3） */
  function showIncoming(built, node, goLive) {
    var cast = st.def.cast || {};
    var key = castKey(node);
    var who = (key && cast[key] && cast[key].name) || node.contact || st.contact || '未知来电';
    var av = (key && cast[key] && cast[key].avatar) || '📞';
    var hangIdx = hangupIndex(node);
    var lastIdx = (node.choices || []).length - 1;
    var ov = RJ.el('div', { class: 'call-incoming' + (RJ.reduceMotion() ? ' nomotion' : '') }, [
      RJ.el('div', { class: 'ci-sub', text: node.caller || '来电' }),
      RJ.el('div', { class: 'ci-av', text: av, role: 'img', 'aria-label': who }),
      RJ.el('div', { class: 'ci-name', text: who }),
      RJ.el('div', { class: 'ci-btns' }, [
        RJ.el('button', {
          class: 'ci-btn ci-hang', text: '挂断', onclick: function () {
            remove();
            if (hangIdx >= 0) pick(hangIdx);
            else if (lastIdx >= 0) pick(lastIdx);
            else RJ.toast('对方不会再打来');
          }
        }),
        RJ.el('button', {
          class: 'ci-btn ci-ans', text: '接听', onclick: function () {
            remove();
            st.callLive = true;
            startCallTimer(built);
            goLive();
          }
        })
      ])
    ]);
    built.el.appendChild(ov);
    function remove() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
  }

  function startCallTimer(built) {
    var el = built.el.querySelector('.call-timer');
    if (!el) {
      el = RJ.el('div', { class: 'call-timer', text: '00:00' });
      built.el.insertBefore(el, built.el.firstChild);
    }
    var t0 = Date.now();
    every(function () {
      var sc = document.getElementById('screen');
      if (!active || !sc || !sc.contains(el)) return;
      var s = Math.floor((Date.now() - t0) / 1000);
      el.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    }, 1000);
  }

  function contactOf(node) {
    var cast = st.def.cast || {}, say = node.say || [];
    for (var i = 0; i < say.length; i++) {
      var k = say[i][0];
      if (k !== 'me' && k !== 'sys' && cast[k]) return cast[k].name;
    }
    return node.contact || null;
  }

  function buildScene(scene, appName, node) {
    var head = null, msgs, actions, el;
    var cast = st.def.cast || {};
    if (scene === 'sms') {
      var from = node.from || '106****';
      head = { title: from, titleEl: null };
      var smsHead = RJ.el('div', { class: 'scene-head sms-head' }, [
        RJ.el('div', { class: 'sh-title', text: from }),
        RJ.el('div', { class: 'sh-sub', text: '短信' })
      ]);
      msgs = RJ.el('div', { class: 'msgs sms-msgs' });
      actions = RJ.el('div', { class: 'actions' });
      el = RJ.el('div', { class: 'scene sms' }, [smsHead, msgs, actions]);
      st.root.appendChild(bar());
    } else if (scene === 'call') {
      msgs = RJ.el('div', { class: 'msgs call-msgs' });
      actions = RJ.el('div', { class: 'actions' });
      el = RJ.el('div', { class: 'scene call' }, [msgs, actions]);
      st.root.appendChild(bar());
    } else if (scene === 'video') {
      msgs = RJ.el('div', { class: 'msgs video-subs' });
      actions = RJ.el('div', { class: 'actions' });
      var vkey = castKey(node);
      var vcast = (vkey && cast[vkey]) || {};
      var stage = RJ.el('div', { class: 'video-stage' }, [
        RJ.el('div', { class: 'vs-blur' }, [RJ.el('span', { class: 'vs-face', text: vcast.avatar || '🧑' })]),
        RJ.el('div', { class: 'vs-glitch' }),
        RJ.el('div', { class: 'vs-name', text: vcast.name || st.contact || '对方' }),
        RJ.el('div', { class: 'vs-tag', text: '视频通话中' })
      ]);
      el = RJ.el('div', { class: 'scene video' + (node.glitch ? ' glitch' : '') }, [stage, msgs, actions]);
      st.root.appendChild(bar());
    } else if (scene === 'app') {
      var who = contactOf(node);
      head = { title: appName, titleEl: null };
      msgs = RJ.el('div', { class: 'app-say' });
      actions = RJ.el('div', { class: 'actions' });
      var mini = (node.say && node.say.length) ? RJ.el('div', { class: 'minilog' }, [
        RJ.el('div', { class: 'minilog-tag', text: st.chatApp || '微聊' }), msgs
      ]) : null;
      el = RJ.el('div', { class: 'scene app-scene' }, [mini, actions]);
      st.root.appendChild(bar());
    } else {
      var name = contactOf(node) || st.contact || '对方';
      var titleEl = RJ.el('div', { class: 'sh-title', text: name });
      var av = RJ.el('div', { class: 'sh-av' }, [RJ.el('span', { class: 'appicon-emo', text: (castKey(node) && cast[castKey(node)].avatar) || '💬' })]);
      var sh = RJ.el('div', { class: 'scene-head', style: { background: appColor() } }, [
        av, RJ.el('div', { class: 'sh-main' }, [titleEl, RJ.el('div', { class: 'sh-sub', text: appName })])
      ]);
      head = { title: name, titleEl: titleEl };
      msgs = RJ.el('div', { class: 'msgs chat-msgs' });
      actions = RJ.el('div', { class: 'actions' });
      el = RJ.el('div', { class: 'scene chat' }, [sh, msgs, actions]);
      st.root.appendChild(bar());
    }
    st.contact = head && head.title ? head.title : st.contact;
    return { el: el, msgs: msgs, actions: actions, head: head };
  }

  function castKey(node) {
    var cast = st.def.cast || {}, say = node.say || [];
    for (var i = 0; i < say.length; i++) {
      var k = say[i][0];
      if (k !== 'me' && k !== 'sys' && cast[k]) return k;
    }
    return null;
  }

  function walletText() {
    var w = RJ.wallet();
    var left = Math.max(0, w.base - w.spent - Math.max(0, -st.sum));
    if (left > 0) return '零钱包 ' + RJ.yuan(left);
    return '零钱包 ¥0 · 本局已付出 ' + RJ.yuan(Math.max(0, -st.sum));
  }

  function bar() {
    var el = RJ.el('div', { class: 'mod-bar' }, [
      RJ.el('span', { class: 'mb-wallet', id: 'mb-wallet', text: walletText() }),
      RJ.el('button', { class: 'mb-verify', text: '🔎 核实', onclick: function () { eng.openVerify(); } }),
      RJ.el('span', { class: 'mb-stage', text: st.hostApp || (st.def.app && st.def.app.name) || '' })
    ]);
    return el;
  }
  function updateWallet() {
    var e = document.getElementById('mb-wallet');
    if (e) {
      e.textContent = walletText();
      e.classList.remove('pulse');
      void e.offsetWidth;
      e.classList.add('pulse');
    }
  }

  /* ---------------- 台词播放 ---------------- */

  function delayFor(text) {
    if (RJ.reduceMotion()) return 0;
    var base = Math.min(300 + String(text || '').length * 22, 1300);
    if (RJ.classroom) base = base * 1.5;
    return base;
  }

  function playSay(msgs, lines, done) {
    var i = 0, timer = null, typ = null, cur = null;
    pending = { skip: skip };
    function clearTyping() { if (typ && typ.parentNode) typ.parentNode.removeChild(typ); typ = null; }
    function pushLine(line) {
      msgs.appendChild(msgEl(line[0], line[1], line[2] || {}));
      scroll(msgs);
    }
    function after(line) {
      cur = null;
      var gap = RJ.reduceMotion() ? 0 : Math.min(delayFor(line && line[1]) / 3, 400);
      if (gap > 0) timer = later(step, gap); else step();
    }
    function step() {
      timer = null;
      if (!active) return;
      if (i >= lines.length) { pending = null; done(); return; }
      var line = lines[i++];
      var d = delayFor(line[1]);
      if (d <= 0) { pushLine(line); after(line); return; }
      cur = line;
      if (line[0] !== 'me' && line[0] !== 'sys') {
        typ = RJ.el('div', { class: 'typing', text: (castName(line[0]) || '对方') + ' 正在输入…' });
        msgs.appendChild(typ); scroll(msgs);
        timer = later(function () { clearTyping(); pushLine(line); after(line); }, Math.round(d / 2));
      } else {
        timer = later(function () { pushLine(line); after(line); }, d);
      }
    }
    function skip() { // 点击屏幕：立即显示当前这一条
      if (!cur) return;
      var line = cur;
      clearTyping();
      if (timer) { clearTimeout(timer); timer = null; }
      pushLine(line);
      after(line);
    }
    step();
  }

  function scroll(el) {
    try { el.scrollTop = el.scrollHeight; } catch (e) { }
    try {
      var sc = document.getElementById('screen');
      if (sc) sc.scrollTop = sc.scrollHeight;
    } catch (e) { }
  }
  /* 选项条 / 小组件渲染后滚到底。部分小组件（perm、form、bank）按钮是动画后才出现的，所以再补两次 */
  function revealActions() {
    var sc = document.getElementById('screen');
    if (!sc) return;
    var at = 0;
    var go = function () { try { sc.scrollTop = sc.scrollHeight; at = sc.scrollTop; } catch (e) { } };
    // 补滚只在玩家没有自己往上翻聊天记录时进行
    var again = function () { if (sc.scrollTop >= at - 4) go(); };
    go();
    later(again, 350);
    later(again, 1200);
  }

  function castName(k) {
    var c = (st.def.cast || {})[k];
    return c ? c.name : null;
  }

  function msgEl(who, text, opts) {
    opts = opts || {};
    text = RJ.fill(text);
    if (who === 'sys') return RJ.el('div', { class: 'sys', text: text });
    var body = [];
    if (opts.img) body.push(RJ.el('div', { class: 'imgcard' }, [RJ.el('span', { class: 'imgcard-emo', text: opts.img, role: 'img', 'aria-label': RJ.fill(opts.caption) || '图片' }), opts.caption ? RJ.el('div', { class: 'imgcard-cap', text: RJ.fill(opts.caption) }) : null]));
    if (opts.voice) body.push(RJ.el('div', { class: 'voicecard' }, [RJ.el('span', { text: '🔊' }), RJ.el('span', { class: 'wave', text: '▁▃▅▂▇▃▁' }), RJ.el('span', { text: opts.voice + '″' })]));
    if (opts.redpack) body.push(RJ.el('div', { class: 'redpack' }, [
      RJ.el('span', { class: 'rp-ico', text: '🧧' }),
      RJ.el('div', { class: 'rp-main' }, [RJ.el('div', { class: 'rp-amt', text: opts.redpack }), RJ.el('div', { class: 'rp-tip', text: opts.redpackTip || '已存入零钱包' })])
    ]));
    if (opts.link) body.push(RJ.el('div', { class: 'linkcard' }, [
      RJ.el('span', { class: 'lc-ico', text: '🔗' }),
      RJ.el('div', { class: 'lc-main' }, [RJ.el('div', { class: 'lc-name', text: opts.link }), RJ.el('div', { class: 'lc-tip', text: opts.linkTip || '点击下载安装' })])
    ]));
    if (text) body.push(RJ.el('div', { class: 'btext', text: text }));
    if (who === 'me') { st.lastWho = who; return RJ.el('div', { class: 'row me' }, [RJ.el('div', { class: 'bubble', style: { background: appColor() } }, body)]); }
    var c = (st.def.cast || {})[who] || {};
    var sameAsPrev = (st.lastWho === who);
    st.lastWho = who;
    return RJ.el('div', { class: 'row other' + (sameAsPrev ? ' cont' : '') }, [
      sameAsPrev ? RJ.el('span', { class: 'av av-blank' }) : RJ.el('span', { class: 'av', text: c.avatar || '👤', role: 'img', 'aria-label': c.name || who }),
      RJ.el('div', { class: 'col' }, [
        sameAsPrev ? null : (c.name ? RJ.el('div', { class: 'who', text: c.name }) : null),
        RJ.el('div', { class: 'bubble' }, body)
      ])
    ]);
  }

  /* ---------------- 选项与小组件上下文 ---------------- */

  function makeCtx(node, actions) {
    return {
      choose: function (i) { pick(i); },
      next: function () { advance(node); },
      money: function (n) { st.sum += (Number(n) || 0); updateWallet(); },
      state: st.marks,
      node: node,
      def: st.def,
      engine: eng,
      actions: function (el) { actBar(el || actions, node, this); },
      host: actions
    };
  }

  function advance(node) {
    if (node.next) go(node.next);
  }

  /* ---------------- 选项：同一样式 + 每局乱序（30 §2.1） ---------------- */

  function hashStr(s) {
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  eng.shuffleOrder = function (n, seed) {
    var rnd = mulberry32(seed >>> 0), a = [], i, j, t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  /* 本局内同一节点顺序稳定；不同局可不同；回放时用 run.seed 复现 */
  eng.orderFor = function (nodeId, visibleIdx, seed) {
    var perm = eng.shuffleOrder(visibleIdx.length, (seed ^ hashStr(String(nodeId))) >>> 0);
    return perm.map(function (k) { return visibleIdx[k]; });
  };

  function actBar(host, node, ctx) {
    var choices = node.choices || [], vis = [];
    if (!choices.length) {
      if (node.next) host.appendChild(RJ.el('button', { class: 'btn choice', text: '继续', onclick: function () { advance(node); } }));
      return;
    }
    choices.forEach(function (c, i) { if (!c.if || st.marks[c.if]) vis.push(i); });
    var order = eng.orderFor(node.id, vis, st.seed);
    st.order = order;
    var box = RJ.el('div', { class: 'choices' });
    order.forEach(function (oi, pos) {
      var ch = choices[oi];
      box.appendChild(RJ.el('button', {
        class: 'btn choice', 'data-i': oi, 'data-safe': ch.safe ? '1' : '0', onclick: function () { pick(oi); }
      }, [
        RJ.classroom ? RJ.el('span', { class: 'kbd', text: String(pos + 1) }) : null,
        RJ.fill(ch.text)
      ]));
    });
    host.appendChild(box);
    revealActions();
    if (RJ.classroom && node.note) aside(node);
  }

  function pick(i) {
    var node = st.nodeObj;
    var ch = (node.choices || [])[i];
    if (!ch) return;
    if (ch.if && !st.marks[ch.if]) return;
    clearTimers();
    var actions = st.actions;
    if (actions) RJ.clear(actions);
    st.picks.push(i);
    if (ch.hooks) ch.hooks.forEach(function (h) { st.hooks[h] = (st.hooks[h] || 0) + 1; });
    if (ch.money) { st.sum += ch.money; updateWallet(); }
    if (ch.set) st.marks[ch.set] = true;
    if (ch.shareOff) { st.shareOn = false; applyShare(); }
    if (!ch.shareOff && node.widget && node.widget[0] === 'share' && i === 0) { st.shareOn = true; applyShare(); }
    if (ch.end) { end(ch.end); return; }
    if (ch.next) { go(ch.next); return; }
    end(firstEnding());
  }

  /* ---------------- 屏幕共享红框 ---------------- */

  function applyShare() {
    var p = document.getElementById('phone');
    if (!p) return;
    p.classList.toggle('sharing', !!st.shareOn);
    var tag = document.getElementById('share-tag');
    if (st.shareOn && !tag) {
      tag = RJ.el('div', { class: 'share-tag', id: 'share-tag' }, [RJ.el('span', { class: 'dot' }), '屏幕共享中']);
      p.appendChild(tag);
    } else if (!st.shareOn && tag && tag.parentNode) {
      tag.parentNode.removeChild(tag);
    }
  }

  /* ---------------- 课堂解说栏 ---------------- */

  function aside(node) {
    if (!RJ.classroom) { RJ.aside(null); return; }
    var hooks = {};
    (node.choices || []).forEach(function (c) { (c.hooks || []).forEach(function (h) { hooks[h] = 1; }); });
    RJ.aside({
      stage: node.stage || 'lure', note: RJ.fill(node.note), flag: RJ.fill(node.flag),
      hooks: Object.keys(hooks)
    });
  }

  /* ---------------- 键盘（课堂模式 1/2/3、空格、R） ---------------- */

  function keyHandler(e) {
    if (!active || !st) return false;
    if (!RJ.classroom) return false;
    var node = st.nodeObj;
    if (!node) return false;
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      var pos = Number(e.key) - 1;
      var idx = (st.order && st.order.length) ? st.order[pos] : pos;
      if ((node.choices || [])[idx]) { pick(idx); return true; }
      return false;
    }
    if (e.key === ' ') {
      if (!(node.choices || []).length && node.next) { advance(node); return true; }
      if (pending) { pending.skip(); return true; }
      return false;
    }
    if (e.key === 'r' || e.key === 'R') { RJ.go('#/m/' + st.id + '/reveal'); return true; }
    return false;
  }

  /* ---------------- 结局与记录 ---------------- */

  function end(eid, synth) {
    if (!active || st.done) return;
    st.done = true;
    var def = st.def;
    var ending = synth || (def.endings || {})[eid] || {};
    var victim = (def.role || 'victim') !== 'accomplice';
    var pos = st.sum > 0 ? st.sum : 0;
    var neg = st.sum < 0 ? -st.sum : 0;
    var run = {
      mod: def.id, ending: eid, grade: ending.grade || 'B',
      loss: victim ? Math.max(0, Math.round(neg)) : 0,
      dirty: victim ? 0 : Math.round(pos),
      hooks: st.hooks, leftAt: st.maxStage,
      path: st.path.slice(), picks: st.picks.slice(),
      verify: st.verify.slice(), seed: st.seed,
      quick: !!synth, ts: Date.now(), secs: Math.max(1, Math.round((Date.now() - st.t0) / 1000))
    };
    if (def.kind === 'real') {              // 真消息剧本：结局写回收件箱，不进 rj.runs
      if (ending.flag) RJ.setFlag(ending.flag, true);
      eng.stop();
      if (RJ.inbox && RJ.inbox.finishReal) RJ.inbox.finishReal(def, run, eid);
      else RJ.go('#/home');
      return;
    }
    RJ.record(def.id, run);
    eng.stop();
    if (RJ.inbox && RJ.inbox.afterRun) { RJ.inbox.afterRun(def, run); return; }
    RJ.go('#/m/' + def.id + '/end/' + eid, true);
  }
  eng.endWith = end;

  /* ---------------- 核实渠道系统（30 §2.3） ---------------- */

  RJ.VERIFY_CHANNELS = [
    { via: 'orig', label: '打通讯录里原来的那个号码' },
    { via: 'app', label: '在官方 App 里查订单 / 账户' },
    { via: 'ask', label: '问辅导员 / 家人' },
    { via: 'police', label: '打 110 · 96110 · 去派出所' },
    { via: 'search', label: '搜一下「官方客服电话」' },
    { via: 'given', label: '打对方给我的「官方核实电话」' },
    { via: 'group', label: '进对方拉的「维权群」' },
    { via: 'video', label: '让对方开视频' }
  ];
  RJ.VERIFY_TRUTHY = { orig: 1, app: 1, ask: 1, police: 1 };
  RJ.VERIFY_DEFAULT = {
    orig: '你拨了通讯录里存的那个号码——接电话的就是本人。',
    app: '你打开官方 App，订单 / 账户记录和他说的一点都不一样。',
    ask: '你把事情原样说给认识的人听，对方一句话就点破了不对的地方。',
    police: '接警员听完说：这是典型套路，别转账，别再联系。',
    search: '搜索结果第一条是广告位，号码看着最“官方”。接起来的人说“您的订单确实异常，我们帮您处理”——那是他们的人。',
    given: '你按他给的号码打过去，对方说“核实无误，请放心处理”。',
    group: '群里几十个人都在说“我提现成功了”“客服人不错”，还有人发了收益截图。',
    video: '对方说摄像头坏了 / 现在不方便，发来一段录好的短视频。'
  };

  RJ.verifyResult = function (via, ctx) {
    var node = (ctx && ctx.node) || (st && st.nodeObj) || {};
    var def = (ctx && ctx.def) || (st && st.def) || {};
    var spec = (node.verify && node.verify[via]) || (def.verify && def.verify[via]) || null;
    if (spec) return { ok: spec.ok !== false, text: RJ.fill(spec.text || ''), spec: spec };
    var dft = (def.verifyText && def.verifyText[via]) || RJ.VERIFY_DEFAULT[via];
    return { ok: !!RJ.VERIFY_TRUTHY[via], text: RJ.fill(dft), spec: null };
  };

  RJ.verifyOpen = function (opts) {
    opts = opts || {};
    var host = opts.host || document.getElementById('phone');
    var sheet = RJ.el('div', { class: 'sheet-wrap' });
    var rows = RJ.el('div', { class: 'sheet' });
    rows.appendChild(RJ.el('div', { class: 'sheet-title', text: '核实一下' }));
    rows.appendChild(RJ.el('div', { class: 'sheet-sub', text: '不同渠道给你的答案不一样。' }));
    RJ.VERIFY_CHANNELS.forEach(function (c) {
      rows.appendChild(RJ.el('button', { class: 'sheet-row', onclick: function () { close(); opts.onPick(c.via); } }, [
        RJ.el('span', { class: 'sheet-ico', text: '🔎' }),
        RJ.el('span', { text: c.label })
      ]));
    });
    rows.appendChild(RJ.el('button', { class: 'btn btn-ghost', text: '先不核实', onclick: close }));
    var ov = RJ.el('div', { class: 'sheet-ov' }, [rows]);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    function close() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);   // 外层是 absolute inset:0 的空壳，留着会挡住整屏点击
    }
    sheet.appendChild(ov);
    host.appendChild(sheet);
    return { close: close };
  };

  function verifyCard(res) {
    var msgs = st.sceneHost && st.sceneHost.msgs;
    if (!msgs) return;
    msgs.appendChild(RJ.el('div', { class: 'verify-card ' + (res.ok ? 'ok' : 'bad') }, [
      RJ.el('div', { class: 'vc-head', text: (res.ok ? '🔎 核实结果' : '🔎 核实结果（注意）') }),
      RJ.el('div', { class: 'vc-text', text: res.text })
    ]));
    scroll(msgs);
  }

  function doVerify(via) {
    var res = RJ.verifyResult(via, { node: st.nodeObj, def: st.def });
    st.verify.push({ via: via, ok: res.ok, node: st.node });
    verifyCard(res);
    var spec = res.spec;
    if (spec && (spec.end || spec.next)) {
      st.pendingSys = (res.ok ? '🔎 核实：' : '🔎 核实（注意）：') + res.text;
    }
    if (spec && spec.end) { end(spec.end); return; }
    if (spec && spec.next) { go(spec.next); return; }
  }

  eng.openVerify = function () {
    if (!active || !st) return;
    RJ.verifyOpen({
      host: document.getElementById('phone'),
      onPick: doVerify
    });
  };

  /* ---------------- 施压倒计时 / 打断（30 §2.5） ---------------- */

  function startPressure(node, host) {
    if (!node.pressure || RJ.classroom || RJ.reduceMotion()) return;
    var bar = RJ.el('div', { class: 'pressure' }, [RJ.el('i', {}), RJ.el('span', { class: 'pressure-t', text: '对方在等你回话…' })]);
    var i = bar.querySelector('i');
    host.insertBefore(bar, host.firstChild);
    var t0 = Date.now(), secs = 15;
    var handle = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / (secs * 1000));
      i.style.width = ((1 - p) * 100) + '%';
      if (p >= 1) {
        clearInterval(handle);
        bar.className = 'pressure done';
        bar.querySelector('.pressure-t').textContent = '对方又发来一条：' + RJ.fill(node.pressureText || '你还在吗？再晚就来不及了。');
        var msgs = st.sceneHost && st.sceneHost.msgs;
        if (msgs) {
          msgs.appendChild(RJ.el('div', { class: 'sys', text: '对方：' + RJ.fill(node.pressureText || '你还在吗？再晚就来不及了。') }));
          scroll(msgs);
        }
        aside(node);
      }
    }, 200);
    intervals.push(handle);
  }

  function showInterrupt(node) {
    if (!node.interrupt) return;
    showBanner(node.interrupt);
  }

  /* 顶部通知横幅（模块内 interrupt 与收件箱按时钟送进来的新消息共用） */
  function showBanner(it) {
    if (!it) return;
    var banner = RJ.el('div', { class: 'itb' }, [
      RJ.el('div', { class: 'itb-app', text: it.app || '新消息' }),
      RJ.el('div', { class: 'itb-from', text: RJ.fill(it.from || '') }),
      RJ.el('div', { class: 'itb-text', text: RJ.fill(it.text || '') })
    ]);
    var drop = function () { if (banner.parentNode) banner.parentNode.removeChild(banner); };
    banner.addEventListener('click', drop);
    var p = document.getElementById('phone');
    if (p) p.appendChild(banner);
    setTimeout(drop, 5000);   // 真实手机的横幅几秒后自己收起
  }
  eng.banner = showBanner;

  /* 收件箱按到达时间插进来的新消息（35 §2）：轮到某个节点时问一次，避免挡住第一个节点 */
  function inboxBanner() {
    if (!RJ.inbox || !RJ.inbox.nextBanner || st.step < 2) return;
    var b = RJ.inbox.nextBanner(st.seed);
    if (b) showBanner(b);
  }

  /* ---------------- 公用：阶段条 / 印章（reveal 页也用） ---------------- */

  RJ.stageBar = function (leftAt, grade, opts) {
    opts = opts || {};
    var bar = RJ.el('div', { class: 'stagebar' });
    var idx = RJ.stageRank(leftAt);
    RJ.STAGES.forEach(function (s, i) {
      var reached = i <= idx;
      var mark = '';
      if (reached && i === idx) mark = (grade === 'C' || grade === 'X') ? '💸' : '✅';
      bar.appendChild(RJ.el('div', {
        class: 'stage ' + (reached ? 'on s-' + s : 'off'),
        title: RJ.STAGE_DESC[s]
      }, [
        RJ.el('div', { class: 'stage-mark', text: mark }),
        RJ.el('div', { class: 'stage-name', text: RJ.STAGE_LABEL[s] }),
        RJ.el('div', { class: 'stage-code', text: s })
      ]));
    });
    return bar;
  };

  RJ.stamp = function (kind) {
    return RJ.el('div', { class: 'stamp stamp-' + kind }, [RJ.el('span', { text: RJ.STAMP_TEXT[kind] }), RJ.el('span', { class: 'stamp-sub', text: '入局 · 反诈实验室' })]);
  };

  RJ.sourceBlock = function (ids, lawIds) {
    var box = RJ.el('div', { class: 'srcblock' });
    (ids || []).forEach(function (id) {
      var s = RJ.SOURCE_MAP[id];
      if (!s) return;
      box.appendChild(RJ.el('div', { class: 'src' }, [
        RJ.el('div', { class: 'src-head' }, [
          RJ.el('span', { class: 'src-id', text: '来源 ' + s.id }),
          RJ.el('a', { class: 'src-link', href: s.url, target: '_blank', rel: 'noopener', text: s.from })
        ]),
        RJ.el('p', { class: 'src-text', text: s.text })
      ]));
    });
    (lawIds || []).forEach(function (id) {
      var l = RJ.LAW_MAP[id];
      if (!l) return;
      box.appendChild(RJ.el('div', { class: 'law' }, [
        RJ.el('span', { class: 'law-id', text: '法条 ' + l.id }),
        RJ.el('span', { class: 'law-name', text: l.law }),
        RJ.el('span', { class: 'law-what', text: l.what })
      ]));
    });
    return box;
  };
})();
