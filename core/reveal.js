/* 入局 · 大学生反诈沉浸实验室 —— reveal.js
 * 通用结局页（#/m/<id>/end/<eid>）与翻面页（#/m/<id>/reveal）。01 §7。
 */
(function () {
  'use strict';
  var RJ = window.RJ;
  var R = RJ.reveal = {};

  function lastRun(def, eid) {
    var runs = RJ.runs(def.id);
    if (!runs.length) return null;
    if (eid) {
      for (var i = runs.length - 1; i >= 0; i--) if (runs[i].ending === eid) return runs[i];
    }
    return runs[runs.length - 1];
  }

  function galBox(def, runs) {
    var ids = Object.keys(def.endings || {});
    var got = {};
    runs.forEach(function (r) { got[r.ending] = true; });
    var n = 0;
    var grid = RJ.el('div', { class: 'gal' });
    ids.forEach(function (id) {
      var e = def.endings[id], ok = !!got[id];
      if (ok) n++;
      var cell = RJ.el(ok ? 'button' : 'div', {
        class: 'gal-cell' + (ok ? ' on' : ' off'),
        onclick: ok ? function () { RJ.go('#/m/' + def.id + '/end/' + id, true); } : null,
        'aria-label': ok ? e.title : '未解锁'
      }, [
        RJ.el('div', { class: 'gal-stamp stamp-' + (RJ.STAMP_TEXT[e.stamp] ? e.stamp : 'caught'), text: ok ? RJ.STAMP_TEXT[e.stamp] || '已入局' : '❓' }),
        RJ.el('div', { class: 'gal-title', text: ok ? e.title : '？？？' }),
        RJ.el('div', { class: 'gal-grade', text: ok ? ('档位 ' + e.grade) : '' })
      ]);
      grid.appendChild(cell);
    });
    return RJ.el('div', { class: 'gal-wrap' }, [
      RJ.el('div', { class: 'sec-title', text: '本模块结局图鉴 · 已解锁 ' + n + '/' + ids.length }),
      grid
    ]);
  }

  /* ---------------- 结局页 ---------------- */

  R.end = function (host, def, eid) {
    document.body.classList.add('skin-dark');
    var ending = (def.endings || {})[eid] || null;
    if (!ending) { RJ.go('#/home'); return; }
    var run = lastRun(def, eid);
    var grade = ending.grade || 'B';
    var stampKind = ending.stamp || (RJ.GRADES[grade] || {}).stamp || 'caught';
    var victim = (def.role || 'victim') !== 'accomplice';

    var page = RJ.el('div', { class: 'page end-page' });
    page.appendChild(RJ.el('div', { class: 'end-head' }, [
      RJ.stamp(stampKind),
      RJ.el('h2', { class: 'end-title', text: ending.title }),
      RJ.el('div', { class: 'chips' }, [
        RJ.el('span', { class: 'chip grade-' + grade, text: '档位 ' + grade }),
        RJ.el('span', { class: 'chip', text: def.title + ' · ' + def.type }),
        RJ.el('span', { class: 'chip chip-role', text: def.role === 'accomplice' ? '身份：工具人' : '身份：受害者' })
      ])
    ]));

    var lossLine = victim
      ? ('本局虚拟损失 ' + RJ.yuan(run ? run.loss : 0))
      : ((def.dirtyLabel || '赃款手续费') + ' ' + RJ.yuan(run ? run.dirty : 0));
    var moneyBox = RJ.el('div', { class: 'money-box' + (victim && run && run.loss > 0 ? ' bad' : '') }, [
      RJ.el('div', { class: 'mb-big', text: lossLine }),
      RJ.el('div', { class: 'mb-sub', text: (run ? run.secs + ' 秒' : '') + ' · 模拟数据' })
    ]);
    page.appendChild(moneyBox);
    page.appendChild(RJ.el('p', { class: 'end-text', text: ending.text }));
    /* 模块自定义的结局页附加块（40 §4.1：paotui 的「帮信 vs 掩隐」对照卡） */
    if (typeof def.endExtra === 'function') {
      var extra = RJ.el('div', { class: 'end-extra' });
      try { def.endExtra(extra, run, ending); } catch (e) { }
      if (extra.childNodes.length) page.appendChild(extra);
    }

    page.appendChild(RJ.el('div', { class: 'sec-title', text: '你在哪一步离开' }));
    page.appendChild(RJ.stageBar(run ? run.leftAt : 'lure', grade));

    var hooks = (run && run.hooks) || {};
    var used = Object.keys(hooks).filter(function (k) { return hooks[k]; });
    if (used.length) {
      page.appendChild(RJ.el('div', { class: 'sec-title', text: '这一局暴露的心理弱点' }));
      page.appendChild(RJ.el('div', { class: 'hook-row' }, used.map(function (h) {
        return RJ.el('span', { class: 'hook-chip h-' + h, text: RJ.HOOK_ICON[h] + ' ' + RJ.HOOKS[h] + ' ×' + hooks[h] });
      })));
    }

    if (def.nodes || def.external) {
      page.appendChild(RJ.el('button', {
        class: 'btn btn-flip', text: '🔄 翻面：看骗子的剧本',
        onclick: function () { RJ.go('#/m/' + def.id + '/reveal'); }
      }));
    }

    var rv = def.reveal || {};
    if (rv.tips && rv.tips.length) {
      page.appendChild(RJ.el('div', { class: 'sec-title', text: '识别口诀' }));
      page.appendChild(RJ.el('ul', { class: 'tips' }, rv.tips.map(function (t) { return RJ.el('li', { text: t }); })));
    }
    if (rv.after && rv.after.length) {
      page.appendChild(RJ.el('div', { class: 'sec-title', text: '已经被骗了怎么办' }));
      page.appendChild(RJ.el('ol', { class: 'after' }, rv.after.map(function (t) { return RJ.el('li', { text: t }); })));
    }

    if ((rv.sources && rv.sources.length) || (rv.laws && rv.laws.length)) {
      page.appendChild(RJ.el('div', { class: 'sec-title', text: '真实案例与依据' }));
      page.appendChild(RJ.sourceBlock(rv.sources, rv.laws));
    }

    page.appendChild(galBox(def, RJ.runs(def.id)));
    page.appendChild(RJ.el('div', { class: 'btns' }, [
      RJ.el('button', { class: 'btn btn-primary', text: '再玩一次', onclick: function () { RJ.go('#/m/' + def.id, true); } }),
      RJ.el('button', { class: 'btn btn-ghost', text: '回主屏', onclick: function () { RJ.go('#/home'); } }),
      RJ.el('button', { class: 'btn btn-ghost', text: '🛡️ 反诈中心', onclick: function () { RJ.go('#/center/report'); } })
    ]));
    page.appendChild(RJ.el('p', { class: 'foot-note', text: RJ.COMPLIANCE }));
    host.appendChild(page);
    var sb = page.querySelector('.stagebar');
    if (sb) sb.scrollIntoView && null;
  };

  /* ---------------- 卡片翻页器（35 §4，翻面页与复盘详情共用） ---------------- */

  /* 圆点跳转 · ←/→ · 左右滑动（位移 > 40px）· 课堂模式空格下一页（末页回第一页）· Esc 关闭 */
  function pager(opts) {
    var cards = opts.cards || [];
    var idx = Math.max(0, Math.min(opts.start || 0, Math.max(0, cards.length - 1)));
    var wrap = RJ.el('div', { class: 'rv-wrap' + (RJ.reduceMotion() ? ' rv-reduce' : '') + (opts.overlay ? ' rv-ov' : '') });
    var titleEl = RJ.el('div', { class: 'rv-title', text: opts.title || '' });
    var closeBtn = RJ.el('button', {
      class: 'rv-close', type: 'button', 'aria-label': '关闭', text: '✕ 关闭',
      onclick: function () { destroy(); if (opts.onClose) opts.onClose(); }
    });
    wrap.appendChild(RJ.el('div', { class: 'rv-bar' }, [
      RJ.el('div', { class: 'rv-bar-main' }, [
        RJ.el('div', { class: 'rv-kicker', text: opts.kicker || '' }),
        titleEl
      ]),
      closeBtn
    ]));

    var track = RJ.el('div', { class: 'rv-track' });
    cards.forEach(function (c, i) {
      track.appendChild(RJ.el('div', {
        class: 'rv-card' + (c.cls ? ' ' + c.cls : ''), tabindex: '0',
        role: 'group', 'aria-label': '第 ' + (i + 1) + ' 张 · ' + c.label
      }, c.nodes || []));
    });
    var deck = RJ.el('div', {
      class: 'rv-deck', tabindex: '0', role: 'region',
      'aria-label': (opts.deckLabel || '翻页卡片') + '：左右方向键或左右滑动切换'
    }, [track]);
    wrap.appendChild(deck);

    var dots = RJ.el('div', { class: 'rv-dots' + (cards.length > 10 ? ' dense' : '') });
    cards.forEach(function (c, i) {
      dots.appendChild(RJ.el('button', {
        class: 'rv-dot', type: 'button', 'aria-label': '第 ' + (i + 1) + ' 张 · ' + c.label,
        onclick: function () { go(i); }
      }, [RJ.el('i', {})]));
    });
    if (cards.length > 1) {
      wrap.appendChild(dots);
      wrap.appendChild(RJ.el('p', {
        class: 'rv-hint',
        text: (opts.hint || '← → 或左右滑动切卡') + (RJ.classroom ? ' · 空格 下一张' : '')
      }));
    }

    function render() {
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      var ds = dots.children;
      for (var k = 0; k < ds.length; k++) {
        var on = (k === idx);
        ds[k].className = 'rv-dot' + (on ? ' on' : '');
        if (on) ds[k].setAttribute('aria-current', 'true'); else ds[k].removeAttribute('aria-current');
      }
    }
    function go(i) {
      if (!cards.length) return;
      idx = Math.max(0, Math.min(i, cards.length - 1));
      render();
      if (opts.onIndex) opts.onIndex(idx);
    }
    render();

    var sx = null, sy = null;
    deck.addEventListener('touchstart', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      sx = t ? t.clientX : null; sy = t ? t.clientY : null;
    }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (sx === null || !t) return;
      var dx = t.clientX - sx, dy = t.clientY - sy;
      sx = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;   // 35 §4：位移 > 40px 才算翻页
      go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });

    var dead = false, offKey = null;
    function destroy() {
      if (dead) return;
      dead = true;
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      if (opts.onRouteClose) window.removeEventListener('hashchange', destroy);
      setTimeout(function () { if (offKey) { offKey(); offKey = null; } }, 0);   // 不在键盘遍历中改动监听表
    }
    if (opts.onRouteClose) window.addEventListener('hashchange', destroy);
    offKey = RJ.onKey(function (e) {
      if (dead) return false;
      if (!document.body.contains(wrap)) { destroy(); return false; }   // 页面已重画：自动注销
      if (e.key === 'ArrowLeft') { go(idx - 1); return true; }
      if (e.key === 'ArrowRight') { go(idx + 1); return true; }
      if (RJ.classroom && (e.key === ' ' || e.code === 'Space')) { go(idx + 1 >= cards.length ? 0 : idx + 1); return true; }
      if (e.key === 'Esc' || e.key === 'Escape') { destroy(); if (opts.onClose) opts.onClose(); return true; }
      return false;
    });
    return { wrap: wrap, go: go, titleEl: titleEl, destroy: destroy, index: function () { return idx; } };
  }

  /* 默认折叠的块：点一下展开（翻面页的来源/法条） */
  function foldBox(label, body, count) {
    var bodyWrap = RJ.el('div', { class: 'rv-fold-body', style: { display: 'none' } }, [body]);
    var arrow = RJ.el('span', { class: 'rv-fold-i', text: '展开 ▾' });
    var btn = RJ.el('button', {
      class: 'rv-fold', type: 'button', 'aria-expanded': 'false',
      onclick: function () {
        var open = (bodyWrap.style.display === 'none');
        bodyWrap.style.display = open ? 'block' : 'none';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        arrow.textContent = open ? '收起 ▴' : '展开 ▾';
      }
    }, [
      RJ.el('span', { text: label + (count ? '（共 ' + count + ' 条）' : '') }),
      arrow
    ]);
    return RJ.el('div', null, [btn, bodyWrap]);
  }

  /* 卡 1 · 真相：大字 + 印章（safe/stop/caught）+ 本局损失 */
  function truthBox(def, rv, run) {
    var box = RJ.el('div', null, []);
    box.appendChild(RJ.el('div', { class: 'rv-truth', text: rv.truth || def.title }));
    if (!run) {
      box.appendChild(RJ.el('p', { class: 'muted', text: '你还没有玩过这一局，印章与本局损失等你走完剧本。' }));
      return box;
    }
    var ending = (def.endings || {})[run.ending] || {};
    var grade = run.grade || ending.grade || 'B';
    var kind = ending.stamp || (RJ.GRADES[grade] || {}).stamp || 'caught';
    var victim = (def.role || 'victim') !== 'accomplice';
    var n = victim ? (run.loss || 0) : (run.dirty || 0);
    box.appendChild(RJ.el('div', { class: 'rv-stamprow' }, [
      RJ.stamp(kind),
      RJ.el('div', { class: 'rv-loss' + (n > 0 ? ' bad' : ' ok') }, [
        RJ.el('div', { class: 'rv-loss-k', text: victim ? '本局虚拟损失' : (def.dirtyLabel || '赃款手续费') }),
        RJ.el('div', { class: 'rv-loss-v', text: RJ.yuan(n) })
      ])
    ]));
    box.appendChild(RJ.el('div', {
      class: 'rv-grade',
      text: '档位 ' + grade + ' · ' + ((RJ.GRADES[grade] || {}).label || '') + (ending.title ? ' · ' + ending.title : '')
    }));
    return box;
  }

  /* 卡 2 · 回放：逐句回放 + 红旗回看 + 流水线（太长的内容在本卡内纵向滚动） */
  function backBox(def, rv, run, external) {
    var nodes = [], label = '流水线';
    if (!external && def.nodes) {
      label = '回放';
      if (!run) {
        nodes.push(RJ.el('div', { class: 'card' }, [
          RJ.el('p', { class: 'muted', text: '你还没有玩过这一局，先玩一次再翻面。' }),
          RJ.el('button', { class: 'btn btn-primary', text: '进入模块', onclick: function () { RJ.go('#/m/' + def.id, true); } })
        ]));
      } else {
        nodes.push(RJ.el('div', { class: 'sec-title', text: '逐句回放 · 左边是你的聊天，右边是骗子的目的' }));
        nodes.push(replay(def, run));
        nodes.push(flagReview(def, run));
      }
    }
    if (rv.crew && rv.crew.length) {
      nodes.push(RJ.el('div', { class: 'sec-title', text: '对面不是一个人，是一条流水线' }));
      nodes.push(RJ.el('div', { class: 'crew' }, rv.crew.map(function (c, i) {
        return RJ.el('div', { class: 'crew-cell' }, [
          RJ.el('span', { class: 'crew-n', text: String(i + 1) }),
          RJ.el('div', { class: 'crew-main' }, [
            RJ.el('div', { class: 'crew-role', text: c[0] }),
            RJ.el('div', { class: 'crew-do', text: c[1] })
          ])
        ]);
      })));
    }
    if (!nodes.length) return null;
    return { label: label, nodes: nodes };
  }

  /* 卡 3 · 爆点：单独占满一屏 */
  function boomBox(rv, run) {
    var box = RJ.el('div', { class: 'boom' });
    box.appendChild(RJ.el('div', { class: 'boom-title', text: '💥 ' + (rv.boom.title || '爆点') }));
    var body = RJ.el('div', { class: 'boom-body' });
    if (typeof rv.boom.render === 'function') {
      try { rv.boom.render(body, run); }
      catch (e) { body.appendChild(RJ.el('p', { class: 'muted', text: '渲染出错：' + (e && e.message) })); }
    } else if (rv.boom.html) {
      body.innerHTML = rv.boom.html;
    }
    box.appendChild(body);
    return box;
  }

  /* 卡 4 · 怎么办：tips + after + 来源/法条（来源默认折叠） */
  function howBox(rv) {
    var nodes = [];
    if (rv.tips && rv.tips.length) {
      nodes.push(RJ.el('div', { class: 'sec-title', text: '识别口诀' }));
      nodes.push(RJ.el('ul', { class: 'tips' }, rv.tips.map(function (t) { return RJ.el('li', { text: t }); })));
    }
    if (rv.after && rv.after.length) {
      nodes.push(RJ.el('div', { class: 'sec-title', text: '已经被骗了怎么办' }));
      nodes.push(RJ.el('ol', { class: 'after' }, rv.after.map(function (t) { return RJ.el('li', { text: t }); })));
    }
    var nSrc = ((rv.sources || []).length + (rv.laws || []).length);
    if (nSrc) {
      nodes.push(RJ.el('div', { class: 'sec-title', text: '真实案例与依据' }));
      nodes.push(foldBox('来源与法条 · 点击展开', RJ.sourceBlock(rv.sources, rv.laws), nSrc));
    }
    if (!nodes.length) return null;
    return nodes;
  }

  /* ---------------- 翻面页（#/m/<id>/reveal）：4 张卡左右翻页 ---------------- */

  R.board = function (host, def) {
    document.body.classList.add('skin-dark');
    host.scrollTop = 0;
    var rv = def.reveal || {};
    var run = lastRun(def, null);
    var external = !!def.external;

    var cards = [{ label: '真相', nodes: [truthBox(def, rv, run)] }];   // 卡 1
    var back = backBox(def, rv, run, external);                          // 卡 2
    if (back) cards.push(back);
    if (rv.boom) cards.push({ label: '爆点', cls: 'rv-boomcard', nodes: [boomBox(rv, run)] });   // 卡 3
    var how = howBox(rv);                                                // 卡 4
    if (how) cards.push({ label: '怎么办', nodes: how });

    host.appendChild(pager({
      cards: cards,
      kicker: '翻面 · 骗子的剧本',
      title: def.title,
      deckLabel: '翻面卡片',
      onRouteClose: true,
      onClose: function () { RJ.go('#/home'); }
    }).wrap);
  };

  /* ---------------- 复盘时间线：点开成全屏卡片翻页器（35 §4） ---------------- */

  RJ.review = RJ.review || {};

  var openCard = null;   // 同一时刻只允许一个复盘覆盖层（重复调用时先收掉旧的）

  /* 盖章口径以 inbox.js 的 RJ.inbox.stampOf 为唯一来源（含 40 §1 快速局「没走完」） */
  function stampOf(entry, d) {
    if (RJ.inbox && RJ.inbox.stampOf) return RJ.inbox.stampOf(entry, d);
    if (!d) return { text: entry.kind === 'scam' ? '没理它' : '没处理', cls: 'st-miss' };
    if (entry.kind === 'real') {
      if (d.misjudge) return { text: '误判', cls: 'st-miss' };
      if (d.ok) return { text: '正确处理', cls: 'st-ok' };
      return { text: '漏了', cls: 'st-miss' };
    }
    if (d.action === 'report') return { text: '已识破', cls: 'st-break' };
    if (d.ok === true) return { text: '已识破', cls: 'st-break' };
    if (d.ok === false && d.grade === 'B') return { text: '及时止损', cls: 'st-in' };
    if (d.ok === false) return { text: '已入局', cls: 'st-in' };
    return { text: '处理中', cls: 'st-miss' };
  }

  function reviewCardNodes(e, d, sp) {
    var nodes = [RJ.el('div', { class: 'rv-meta' }, [
      RJ.el('span', { class: 'rv-time', text: e.time }),
      RJ.el('span', { class: 'rv-app', text: (e.icon ? e.icon + ' ' : '') + e.app }),
      RJ.el('span', { class: 'rv-from', text: e.from }),
      RJ.el('span', { class: 'tl-stamp ' + (sp.cls || 'st-miss'), text: sp.text })
    ])];
    nodes.push(RJ.el('div', { class: 'rv-msg', text: e.text }));
    var res = d && (d.result || d.r);
    if (res) nodes.push(RJ.el('div', { class: 'rv-result' }, [
      RJ.el('b', { text: '这条的结果' }),
      RJ.el('div', { class: 'rv-result-t', text: String(res) })
    ]));
    if (e.kind === 'scam') {
      nodes.push(RJ.el('button', {
        class: 'btn btn-primary rv-vsbtn', type: 'button', text: '看骗子的剧本 →',
        onclick: function () { if (e.mod) RJ.go('#/m/' + e.mod + '/reveal', true); }
      }));
    }
    return nodes;
  }

  /* 从被点的那一条开始，在当天全部条目之间左右翻页 */
  RJ.review.card = function (entry, done, stamp, stampCls) {
    var host = document.getElementById('phone') || document.getElementById('screen');
    if (!host) return;
    if (openCard) { openCard.destroy(); openCard = null; }
    var list = (RJ.inboxEntries && RJ.inboxEntries()) || [];
    if (!list.length) list = entry ? [entry] : [];
    if (!list.length) return;

    var st = RJ.store.get('inbox', null) || {};
    var doneMap = {}, k;
    for (k in (st.done || {})) if (Object.prototype.hasOwnProperty.call(st.done, k)) doneMap[k] = st.done[k];
    if (entry && done && !doneMap[entry.id]) doneMap[entry.id] = done;   // 以 store 里的为准，传进来的只作兜底
    var given = {};
    if (entry && stamp) given[entry.id] = { text: stamp, cls: stampCls || '' };   // 调用方给了盖章就用它，没给就按同口径算

    var start = 0;
    var cards = list.map(function (e, i) {
      if (entry && e.id === entry.id) start = i;
      var sp = given[e.id] || stampOf(e, doneMap[e.id]);
      return { label: e.time + ' · ' + e.app, nodes: reviewCardNodes(e, doneMap[e.id], sp) };
    });

    var pg = pager({
      cards: cards,
      start: start,
      overlay: true,
      kicker: '今天的复盘 · 共 ' + cards.length + ' 条',
      title: (start + 1) + ' / ' + cards.length + ' · ' + cards[start].label,
      deckLabel: '复盘卡片',
      hint: '← → 或左右滑动切条目',
      onRouteClose: true,
      onIndex: function (i) {
        pg.titleEl.textContent = (i + 1) + ' / ' + cards.length + ' · ' + cards[i].label;
      }
    });
    host.appendChild(pg.wrap);
    openCard = pg;
  };

  /* 红旗回看（30 §4）：列出全部红旗，标出你当时看到了几个 */
  function flagReview(def, run) {
    var path = run.path || [], picks = (run.picks || []).slice();
    var posOf = {};
    path.forEach(function (n, i) { if (!(n in posOf)) posOf[n] = i; });
    var firstSafe = -1;
    var pi = 0;
    path.forEach(function (nid, idx) {
      var n = def.nodes[nid];
      if (!n) return;
      if (n.choices && n.choices.length) {
        var c = n.choices[picks[pi]];
        pi++;
        if (c && c.safe && firstSafe < 0) firstSafe = idx;
      }
    });
    var firstVerifyOk = -1;
    (run.verify || []).forEach(function (v) {
      if (!v.ok || !v.node) return;
      var p = posOf[v.node];
      if (p !== undefined && (firstVerifyOk < 0 || p < firstVerifyOk)) firstVerifyOk = p;
    });
    var flags = [];
    Object.keys(def.nodes).forEach(function (nid) {
      var n = def.nodes[nid];
      if (!n.flag) return;
      var visited = (nid in posOf);
      var p = visited ? posOf[nid] : 999;
      // 30 §4：在红旗节点之后（含该节点）选了 safe，或做了正确核实，即算“看到”
      var seen = visited && ((firstSafe >= 0 && firstSafe >= p) || (firstVerifyOk >= 0 && firstVerifyOk >= p));
      flags.push({ node: nid, flag: RJ.fill(n.flag), stage: n.stage, visited: visited, seen: seen, pos: p });
    });
    flags.sort(function (a, b) { return a.pos - b.pos; });
    var seenN = flags.filter(function (f) { return f.seen; }).length;
    var box = RJ.el('div', { class: 'flagrev' });
    box.appendChild(RJ.el('div', { class: 'sec-title', text: '红旗回看 · 你当时看到了 ' + seenN + '/' + flags.length + ' 个' }));
    flags.forEach(function (f) {
      box.appendChild(RJ.el('div', { class: 'flagrow ' + (f.seen ? 'seen' : 'miss') }, [
        RJ.el('span', { class: 'flagrow-ico', text: f.seen ? '✅' : '🚩' }),
        RJ.el('div', { class: 'flagrow-main' }, [
          RJ.el('div', { class: 'flagrow-t', text: f.flag }),
          RJ.el('div', { class: 'muted', text: f.stage ? ('阶段：' + (RJ.STAGE_LABEL[f.stage] || f.stage)) : '' })
        ]),
        RJ.el('span', { class: 'flagrow-s', text: f.seen ? '看到了' : (f.visited ? '没看到' : '没走到') })
      ]));
    });
    var vs = run.verify || [], g = 0, b = 0;
    vs.forEach(function (v) { if (v.ok) g++; else b++; });
    if (vs.length) box.appendChild(RJ.el('p', { class: 'muted', text: '这一局你核实了 ' + vs.length + ' 次：走对渠道 ' + g + ' 次、走错渠道 ' + b + ' 次。' }));
    return box;
  }

  function replay(def, run) {
    var wrap = RJ.el('div', { class: 'replay' });
    var cast = def.cast || {};
    var picks = (run.picks || []).slice();
    var pi = 0;
    (run.path || []).forEach(function (nid) {
      var node = def.nodes[nid];
      if (!node) return;
      var left = RJ.el('div', { class: 'rp-say' });
      if (node.flag) {
        wrap.appendChild(RJ.el('div', { class: 'rp-flag' }, [
          RJ.el('span', { class: 'rp-flag-ico', text: '🚩' }),
          RJ.el('span', { text: '你本可以在这里识破：' + node.flag })
        ]));
      }
      (node.say || []).forEach(function (l) {
        var who = l[0], txt = RJ.fill(l[1]), opts = l[2] || {};
        var name = who === 'me' ? '你' : (who === 'sys' ? '' : ((cast[who] && cast[who].name) || who));
        left.appendChild(RJ.el('div', { class: 'rp-line ' + (who === 'me' ? 'me' : who === 'sys' ? 'sys' : ''), text: (name ? name + '：' : '') + (txt || (opts.img ? '[图片]' : opts.link ? '[链接] ' + opts.link : opts.redpack ? '[转账] ' + opts.redpack : opts.voice ? '[语音]' : '')) }));
      });
      var chosenIdx = -1;
      if (node.choices && node.choices.length && pi < picks.length) { chosenIdx = picks[pi]; pi++; }
      var right = RJ.el('div', { class: 'rp-note' }, [
        RJ.el('div', { class: 'rp-stage s-' + (node.stage || 'lure'), text: RJ.STAGE_LABEL[node.stage] || '' }),
        RJ.el('div', { class: 'rp-note-text', text: RJ.fill(node.note) || '' })
      ]);
      if (chosenIdx >= 0) {
        var ch = node.choices[chosenIdx];
        right.appendChild(RJ.el('div', { class: 'rp-pick' + (ch && ch.safe ? ' safe' : ''), text: '你的选择：' + ((ch && ch.text) || '') }));
        var safeTexts = node.choices.filter(function (c) { return c.safe; }).map(function (c) { return c.text; });
        if (safeTexts.length && !(ch && ch.safe)) {
          right.appendChild(RJ.el('div', { class: 'rp-safe', text: '当时你也可以选：' + safeTexts.join(' / ') }));
        }
      }
      wrap.appendChild(RJ.el('div', { class: 'rp-row' }, [left, right]));
    });
    return wrap;
  }
})();
