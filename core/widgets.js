/* 入局 · 大学生反诈沉浸实验室 —— widgets.js
 * 内置小组件（01 §5.3）。交互型小组件自己渲染按钮（用 ctx.actions(el)），
 * 展示型小组件渲染完内容后由引擎在其下方渲染按钮。
 * 交互型：pay / perm / install / share / doc / form
 * 展示型：task / bank / contacts / notify
 */
(function () {
  'use strict';
  var RJ = window.RJ;
  var W = RJ.widgets = {};
  RJ.widgetSelf = { pay: 1, perm: 1, install: 1, share: 1, doc: 1, form: 1 };

  function alive(host) { return !!(host && document.body && document.body.contains(host)); }
  function later(fn, ms) { return setTimeout(function () { if (fn) fn(); }, ms); }
  function foot(host, cls) { var f = RJ.el('div', { class: 'w-foot ' + (cls || '') }); host.appendChild(f); return f; }

  function pay(host, props, ctx) {
    props = props || {};
    var amount = Number(props.amount || 0);
    var left = RJ.wallet().left;
    var short = amount > left;
    host.appendChild(RJ.el('div', { class: 'w-title', text: props.title || '确认支付' }));
    host.appendChild(RJ.el('div', { class: 'pay-amt', text: RJ.yuan(amount) }));
    var rows = RJ.el('div', { class: 'kv' });
    rows.appendChild(RJ.el('div', { class: 'kv-row' }, [RJ.el('span', { text: '收款方' }), RJ.el('b', { text: props.to || '—' })]));
    rows.appendChild(RJ.el('div', { class: 'kv-row' }, [RJ.el('span', { text: '付款方式' }), RJ.el('b', { text: short ? '青橙分期（借款）' : '零钱包' })]));
    rows.appendChild(RJ.el('div', { class: 'kv-row' }, [RJ.el('span', { text: '支付密码' }), RJ.el('b', { class: 'dots', id: 'pay-pwd', text: '●●●●●●' })]));
    host.appendChild(rows);
    if (short) {
      host.appendChild(RJ.el('div', { class: 'warn-strip' }, [
        RJ.el('span', { text: '⚠️' }),
        RJ.el('span', { text: '零钱包只剩 ' + RJ.yuan(Math.max(0, left)) + '，余额不足 → 去青橙分期借款' })
      ]));
    }
    if (props.to) host.appendChild(RJ.el('p', { class: 'w-note', text: '这是一笔模拟交易，不会发生任何真实转账。' }));
    var f = foot(host);
    if (ctx) ctx.actions(f);
  }

  function perm(host, props, ctx) {
    props = props || {};
    var icon = { '通讯录': '📇', '相册': '🖼️', '麦克风': '🎤', '摄像头': '📷', '短信': '✉️', '位置': '📍' };
    host.appendChild(RJ.el('div', { class: 'w-title', text: (props.app || '应用') + ' 请求权限' }));
    var list = RJ.el('div', { class: 'perm-list' });
    host.appendChild(list);
    (props.items || []).forEach(function (it, i) {
      var row = RJ.el('div', { class: 'perm-row', style: { opacity: 0 } }, [
        RJ.el('span', { class: 'perm-ico', text: icon[it] || '🔐', role: 'img', 'aria-label': it }),
        RJ.el('div', { class: 'perm-main' }, [
          RJ.el('div', { class: 'perm-name', text: it }),
          RJ.el('div', { class: 'perm-sub', text: '允许 ' + (props.app || '应用') + ' 访问您的' + it })
        ]),
        RJ.el('span', { class: 'perm-state', text: '待确认' })
      ]);
      list.appendChild(row);
      later(function () {
        if (!alive(host)) return;
        row.style.transition = RJ.reduceMotion() ? 'none' : 'opacity .3s';
        row.style.opacity = 1;
        var s = row.querySelector('.perm-state'); if (s) s.textContent = '已列出';
      }, RJ.reduceMotion() ? 0 : i * 260);
    });
    var f = foot(host);
    if (ctx) ctx.actions(f);
  }

  function install(host, props, ctx) {
    props = props || {};
    host.appendChild(RJ.el('div', { class: 'w-title', text: '下载' }));
    host.appendChild(RJ.el('div', { class: 'apk' }, [
      RJ.el('span', { class: 'apk-ico', text: '📦' }),
      RJ.el('div', { class: 'apk-main' }, [
        RJ.el('div', { class: 'apk-name', text: (props.app || 'app') + '.apk' }),
        RJ.el('div', { class: 'apk-sub', text: (props.size || '12.4MB') + ' · 来自浏览器下载' })
      ])
    ]));
    host.appendChild(RJ.el('div', { class: 'warn-strip' }, [
      RJ.el('span', { text: '⚠️' }),
      RJ.el('span', { text: '该应用来自未知来源，安装可能带来风险。' })
    ]));
    var f = foot(host);
    if (ctx) ctx.actions(f);
  }

  function share(host, props, ctx) {
    props = props || {};
    host.appendChild(RJ.el('div', { class: 'w-title', text: (props.app || '云会议') + ' 请求共享您的屏幕' }));
    host.appendChild(RJ.el('div', { class: 'share-card' }, [
      RJ.el('div', { class: 'sc-screen' }, [
        RJ.el('div', { class: 'sc-bar' }), RJ.el('div', { class: 'sc-line' }), RJ.el('div', { class: 'sc-line short' }),
        RJ.el('div', { class: 'sc-badge', text: '将实时显示' })
      ]),
      RJ.el('p', { class: 'w-note', text: '共享后，对方能看到您手机屏幕上的一切内容，包括弹出的短信和验证码。' })
    ]));
    var f = foot(host);
    if (ctx) ctx.actions(f);
  }

  function task(host, props, ctx) {
    props = props || {};
    var locked = !!props.locked;
    host.appendChild(RJ.el('div', { class: 'task-head' }, [
      RJ.el('div', { class: 'th-app', text: '点点赚 · 任务平台' }),
      RJ.el('div', { class: 'th-bal' }, [RJ.el('span', { text: '余额 ' }), RJ.el('b', { text: RJ.yuan(props.balance || 0) })])
    ]));
    var list = RJ.el('div', { class: 'task-list' });
    (props.tasks || []).forEach(function (t, i) {
      list.appendChild(RJ.el('div', { class: 'task-row' + (t.sec ? ' sec' : '') }, [
        RJ.el('div', { class: 'tr-main' }, [
          RJ.el('div', { class: 'tr-name', text: t.name }),
          RJ.el('div', { class: 'tr-sub', text: t.cost ? ('需充值 ' + RJ.yuan(t.cost)) : (t.sub || '') })
        ]),
        RJ.el('div', { class: 'tr-ret', text: t.ret ? ('返 ' + RJ.yuan(t.ret)) : (t.tag || '') })
      ]));
    });
    host.appendChild(list);
    var wd = RJ.el('div', { class: 'task-wd' }, [
      RJ.el('button', { class: 'btn ' + (locked ? 'btn-locked' : 'btn-primary'), disabled: locked ? true : null, text: locked ? '完成连单后可提现' : '立即提现' })
    ]);
    host.appendChild(wd);
  }

  function bank(host, props, ctx) {
    props = props || {};
    var items = props.items || [];
    var rate = props.feeRate != null ? Number(props.feeRate) : null;
    var feeEach = props.fee != null ? Number(props.fee) : null;
    host.appendChild(RJ.el('div', { class: 'bank-head' }, [RJ.el('div', { class: 'bh-t', text: '星城银行 · 到账提醒' })]));
    var list = RJ.el('div', { class: 'bank-list' });
    host.appendChild(list);
    var total = 0;
    var footEl = RJ.el('div', { class: 'bank-total' }, [RJ.el('span', { text: '手续费累计 ' }), RJ.el('b', { id: 'bank-fee', text: RJ.yuan(0) })]);
    host.appendChild(footEl);
    items.forEach(function (it, i) {
      var fee = rate != null ? Math.round((it.amt || 0) * rate) : (feeEach != null ? feeEach : 0);
      var row = RJ.el('div', { class: 'bank-row', style: { opacity: 0 } }, [
        RJ.el('div', { class: 'br-l' }, [
          RJ.el('div', { class: 'br-from', text: (it.from || '') + ' 转入' }),
          it.memo ? RJ.el('div', { class: 'br-memo', text: '备注：' + it.memo }) : RJ.el('div', { class: 'br-memo muted', text: '备注：（空）' })
        ]),
        RJ.el('div', { class: 'br-amt', text: '+' + RJ.yuan(it.amt || 0) })
      ]);
      list.appendChild(row);
      later(function () {
        if (!alive(host)) return;
        row.style.transition = RJ.reduceMotion() ? 'none' : 'opacity .35s';
        row.style.opacity = 1;
        total += fee;
        var b = document.getElementById('bank-fee');
        if (b && alive(host)) b.textContent = RJ.yuan(total);
      }, RJ.reduceMotion() ? 0 : 220 * (i + 1));
    });
    later(function () {
      if (!alive(host)) return;
      var out = RJ.el('div', { class: 'bank-out', text: '按指示转出 → 对方账户' });
      list.appendChild(out);
    }, RJ.reduceMotion() ? 0 : 220 * (items.length + 1));
  }

  function contacts(host, props, ctx) {
    props = props || {};
    host.appendChild(RJ.el('div', { class: 'w-title', text: '通讯录上传中…' }));
    var list = RJ.el('div', { class: 'ct-list' });
    host.appendChild(list);
    (props.names || []).forEach(function (n, i) {
      var barEl = RJ.el('div', { class: 'ct-bar' });
      var row = RJ.el('div', { class: 'ct-row' }, [
        RJ.el('span', { class: 'ct-av', text: '👤' }),
        RJ.el('span', { class: 'ct-name', text: n }),
        RJ.el('span', { class: 'ct-state', text: '等待中' })
      ]);
      list.appendChild(row);
      later(function () {
        if (!alive(host)) return;
        var s = row.querySelector('.ct-state'); if (s) { s.textContent = '上传 100%'; s.className = 'ct-state done'; }
      }, RJ.reduceMotion() ? 0 : 180 * (i + 1));
    });
    later(function () {
      if (!alive(host)) return;
      list.appendChild(RJ.el('div', { class: 'ct-done', text: '共 ' + (props.names || []).length + ' 位联系人已同步到服务器' }));
    }, RJ.reduceMotion() ? 0 : 180 * ((props.names || []).length + 1));
  }

  function doc(host, props, ctx) {
    props = props || {};
    var fields = props.fields || [];
    if (!Array.isArray(fields)) {
      fields = Object.keys(fields).map(function (k) { return { label: k, value: fields[k] }; });
    }
    host.appendChild(RJ.el('div', { class: 'doc' }, [
      RJ.el('div', { class: 'doc-head' }, [
        RJ.el('div', { class: 'doc-kind', text: props.kind || '通知' }),
        RJ.el('div', { class: 'doc-title', text: props.title || '' })
      ]),
      RJ.el('div', { class: 'doc-body' }, fields.map(function (f) {
        return RJ.el('div', { class: 'kv-row' }, [RJ.el('span', { text: f.label }), RJ.el('b', { text: f.value })]);
      })),
      RJ.el('div', { class: 'doc-stamp', text: props.seal || '（电子送达）' })
    ]));
    var f = foot(host);
    if (ctx) ctx.actions(f);
  }

  function notify(host, props, ctx) {
    props = props || {};
    host.appendChild(RJ.el('div', { class: 'notify-drop' }, [
      RJ.el('div', { class: 'nd-app', text: props.app || '系统' }),
      RJ.el('div', { class: 'nd-text', text: props.text || '' })
    ]));
  }

  function form(host, props, ctx) {
    props = props || {};
    host.appendChild(RJ.el('div', { class: 'w-title', text: props.title || '填写信息' }));
    var box = RJ.el('div', { class: 'form' });
    (props.fields || []).forEach(function (f) {
      box.appendChild(RJ.el('label', { class: 'form-row' }, [
        RJ.el('span', { class: 'form-label', text: f.label }),
        RJ.el('input', { class: 'input', type: 'text', readonly: true, value: RJ.fill(f.value || ''), 'aria-label': f.label })
      ]));
    });
    host.appendChild(box);
    host.appendChild(RJ.el('p', { class: 'w-note', text: '演示数据，只读，站点不收集任何信息。' }));
    var fht = foot(host);
    if (ctx) ctx.actions(fht);
  }

  W.pay = pay; W.perm = perm; W.install = install; W.share = share;
  W.task = task; W.bank = bank; W.contacts = contacts; W.doc = doc;
  W.notify = notify; W.form = form;
})();
