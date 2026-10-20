/* 模块 huanlian · 室友的视频（AI 换脸冒充熟人）—— 规格见 方案/16，高手局见 方案/30 §3.6/§3.7
 * 该模块只做一件事：调用 RJ.register(def)。
 * 自定义小组件 verify：视频辨真游戏（三个指令，识破 2 个后出选项）。
 * 两条真实渠道：orig 打他原来那个号码 → 关机（真的，他在考场）；ask 问宿舍群里另一个室友 → 识破。
 * 与收件箱联动：blockedZhou（拉黑真室友）时多一条支线，真室友的电话显示为「未知号码」。
 */
(function () {
  'use strict';

  var HL_CSS = [
    /* 视频画面的错位/撕裂/挥手动画 */
    '@keyframes hlTear{0%{transform:translateX(0)}18%{transform:translateX(-9px) skewX(5deg)}38%{transform:translateX(8px) skewX(-3deg)}58%{transform:translateX(-5px)}78%{transform:translateX(4px)}100%{transform:translateX(0)}}',
    '.hl-tear{animation:hlTear .9s 1 both}',
    '@keyframes hlFlick{0%,100%{opacity:1;transform:translateY(0)}25%{opacity:.25;transform:translateY(-5px)}50%{opacity:.85;transform:translateY(3px)}75%{opacity:.3}}',
    '.hl-flick{animation:hlFlick .9s 1 both}',
    '.hl-seam{position:absolute;top:0;bottom:0;width:12px;left:48%;pointer-events:none;background:linear-gradient(90deg,rgba(255,255,255,.85),rgba(229,72,77,.95),rgba(255,255,255,.45));filter:blur(1px);animation:hlFlick .45s 2 both}',
    '@keyframes hlHand{0%{transform:translateX(-130px) rotate(-8deg);opacity:.95}55%{opacity:1}100%{transform:translateX(210px) rotate(6deg);opacity:0}}',
    '.hl-hand{position:absolute;top:92px;left:0;font-size:62px;pointer-events:none;animation:hlHand .95s 1 both}',
    '@keyframes hlPop{from{opacity:0;transform:translateY(-6px) scale(.92)}to{opacity:1;transform:none}}',
    '.hl-flag{position:absolute;display:flex;align-items:center;gap:4px;max-width:62%;font-size:10.5px;line-height:1.3;padding:3px 7px;border-radius:10px;background:rgba(229,72,77,.93);color:#fff;pointer-events:none;animation:hlPop .35s 1 both}',
    '.hl-flag-ico{font-size:12px}',
    '.hl-flags{position:absolute;inset:0;pointer-events:none}',
    '.hl-chip{position:absolute;right:10px;top:10px;font-size:10.5px;padding:3px 8px;border-radius:12px;background:rgba(46,196,182,.92);color:#04241f;font-weight:700}',
    '.hl-ask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:74px;color:rgba(255,255,255,.75);pointer-events:none;animation:hlFlick .8s 1 both}',
    /* 小组件面板 */
    '.hl-vtop{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.hl-vtitle{font-size:15px;font-weight:700}',
    '.hl-prog{font-size:11.5px;font-weight:700;color:#0f8d80;font-variant-numeric:tabular-nums}',
    '.hl-hint{font-size:11.5px;color:#6b7688;margin:6px 0 0;line-height:1.5}',
    '.hl-cmds{display:flex;flex-direction:column;gap:8px;margin-top:10px}',
    '.hl-cmd{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:10px 12px;border:none;border-radius:12px;background:#2ec4b6;color:#fff;font-size:13.5px;font-weight:600;text-align:left;cursor:pointer;font-family:inherit}',
    '.hl-cmd.hl-done{background:#e9ecf1;color:#7b8494;font-weight:500;cursor:default}',
    '.hl-log{margin-top:10px;padding:9px 11px;border-radius:10px;background:#f2f5f9;color:#3d4759;font-size:12px;line-height:1.6;display:none}',
    '.hl-log.hl-on{display:block}',
    '.hl-flagline{display:block;color:#c2371b;font-weight:600}',
    /* 爆点：合成流水线 */
    '.hl-boom{display:flex;flex-direction:column;gap:12px}',
    '.hl-label{font-size:11.5px;color:#8fa2bd;letter-spacing:.5px}',
    '.hl-grid{display:flex;gap:8px;flex-wrap:wrap}',
    '.hl-mat{width:70px;padding:6px 4px;border-radius:12px;background:#141f33;border:1px solid #25344e;text-align:center;transition:transform .45s,opacity .45s}',
    '.hl-mat.hl-used{opacity:.4;transform:translateY(14px) scale(.92)}',
    '.hl-mat-ico{font-size:26px}',
    '.hl-mat-cap{font-size:9.5px;color:#8fa2bd;line-height:1.3;margin-top:2px}',
    '.hl-station{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#141f33;border:1px solid #25344e}',
    '.hl-station-ico{font-size:22px}',
    '.hl-station-main{flex:1;display:flex;flex-direction:column;gap:6px}',
    '.hl-station-t{font-size:12px;color:#cfdcf0}',
    '.hl-bar{height:8px;border-radius:6px;background:#0d1626;overflow:hidden}',
    '.hl-bar>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2ec4b6,#e8b931);transition:width .45s}',
    '.hl-go{border:none;border-radius:10px;padding:9px 12px;font-size:12.5px;font-weight:700;background:#e8b931;color:#1a2233;cursor:pointer;min-height:40px;font-family:inherit}',
    '.hl-go[disabled]{opacity:.65;cursor:default}',
    '.hl-face{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,#1b2a44,#101b2e);border:1px solid #2ec4b6;opacity:0;transition:opacity .4s}',
    '.hl-face.hl-on{opacity:1}',
    '.hl-face-av{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#4a5a78,#232f45);display:flex;align-items:center;justify-content:center;font-size:28px;filter:blur(1px);flex:none}',
    '.hl-face-t{font-size:13px;font-weight:700;color:#dfe7f3}',
    '.hl-face-s{font-size:11px;color:#8fa2bd;line-height:1.5}',
    '.hl-case{padding:10px 12px;border-radius:10px;background:#141f33;border-left:3px solid #e5484d}',
    '.hl-case-tag{font-size:10.5px;color:#f08a3c;font-weight:700;margin-bottom:4px}',
    '.hl-case-text{margin:0;font-size:12px;line-height:1.6;color:#dfe7f3}',
    '.hl-steps{padding:10px 12px;border-radius:10px;background:#101b2e;border:1px dashed #2ec4b6}',
    '.hl-steps-t{font-size:11.5px;color:#2ec4b6;font-weight:700;margin-bottom:6px}',
    '.hl-steps-list{display:flex;flex-direction:column;gap:4px;color:#dfe7f3;font-size:12.5px;line-height:1.6}',
    '.hl-cap{margin:0;font-size:12px;line-height:1.6;color:#cfdcf0}'
  ].join('');

  /* ---------------- 自定义小组件：视频辨真 ---------------- */

  function verifyWidget(host, props, ctx) {
    props = props || {};
    var need = props.need || 2;
    RJ.clear(host);
    host.appendChild(RJ.el('style', { text: HL_CSS }));

    var stage = document.querySelector('#screen .scene.video .video-stage');
    var face = stage ? stage.querySelector('.vs-face') : null;
    var subs = document.querySelector('#screen .video-subs');
    var flagBox = RJ.el('div', { class: 'hl-flags' });
    var chip = RJ.el('div', { class: 'hl-chip', text: '验证中 0/' + need });
    if (stage) {
      stage.appendChild(flagBox);
      stage.appendChild(chip);
    }

    var done = 0, revealed = false;

    var prog = RJ.el('span', { class: 'hl-prog', text: '已识破 0/' + need });
    var hint = RJ.el('p', { class: 'hl-hint', text: '挑 2 个指令让他做——换脸最难过的，就是这三关。' });
    var cmdsBox = RJ.el('div', { class: 'hl-cmds' });
    var log = RJ.el('div', { class: 'hl-log' });
    var foot = RJ.el('div', { class: 'w-foot' });

    host.appendChild(RJ.el('div', { class: 'hl-vtop' }, [
      RJ.el('span', { class: 'hl-vtitle', text: '视频验真' }),
      prog
    ]));
    host.appendChild(hint);
    host.appendChild(cmdsBox);
    host.appendChild(log);
    host.appendChild(foot);

    var CMDS = [
      {
        label: '让他转头看侧面',
        flag: '转头的一瞬间，脸和脖子错开了',
        note: '换脸是把五官“贴”上去的，人一转头，贴图跟不上骨骼，边缘就露出来。',
        reply: '啊……我脖子扭了，别让我转',
        at: { left: '6%', top: '26%' }
      },
      {
        label: '让他用手在脸前挥一下',
        flag: '手从脸前经过时，整张脸闪了一下',
        note: '手进入画面的那一帧，贴图和手互相打架，就会出现闪烁和错位。',
        reply: '手挡一下怎么了？你快点',
        at: { left: '54%', top: '50%' }
      },
      {
        label: '问：上周宿舍聚餐吃的什么？',
        flag: '只有你们知道的事，他答不上来',
        note: '骗子手里只有公开素材，没有你们两个的共同记忆。',
        reply: '先别问了，急',
        at: { left: '14%', top: '70%' }
      }
    ];

    CMDS.forEach(function (cmd, i) {
      var btn = RJ.el('button', { class: 'hl-cmd', text: cmd.label, onclick: function () { fire(i); } });
      cmd.el = btn;
      cmdsBox.appendChild(btn);
    });

    function fire(i) {
      var cmd = CMDS[i];
      if (!cmd || cmd.used) return;
      cmd.used = true;
      var tag = RJ.el('div', { class: 'hl-cmd hl-done' }, [
        RJ.el('span', { text: '✓' }),
        RJ.el('span', { text: cmd.label })
      ]);
      if (cmd.el && cmd.el.parentNode) cmd.el.parentNode.replaceChild(tag, cmd.el);
      cmd.el = tag;

      done++;
      prog.textContent = done < need ? ('已识破 ' + done + '/' + need) : ('已识破 ' + done + ' 处');
      chip.textContent = '验证中 ' + Math.min(done, need) + '/' + need;
      answer(cmd.reply);
      effect(i);
      addFlag(cmd);
      explain(cmd);

      log.className = 'hl-log hl-on';
      log.appendChild(RJ.el('span', { class: 'hl-flagline', text: '🚩 ' + cmd.flag }));

      if (done >= need && !revealed) {
        revealed = true;
        hint.textContent = '这张脸过不了这几关。你可以挂断了。';
        setTimeout(function () { ctx.actions(foot); }, RJ.reduceMotion() ? 0 : 700);
      }
    }

    function answer(text) {
      if (!subs) return;
      subs.appendChild(RJ.el('div', { class: 'row other' }, [
        RJ.el('span', { class: 'av', text: '🧑', role: 'img', 'aria-label': '室友小周' }),
        RJ.el('div', { class: 'col' }, [
          RJ.el('div', { class: 'who', text: '室友小周' }),
          RJ.el('div', { class: 'bubble', text: text })
        ])
      ]));
      try {
        var sc = document.getElementById('screen');
        if (sc) sc.scrollTop = sc.scrollHeight;
      } catch (e) { }
    }

    function effect(i) {
      if (!stage || RJ.reduceMotion()) return;
      if (i === 0) {
        flash(face, 'hl-tear', 950);
        var seam = RJ.el('div', { class: 'hl-seam' });
        stage.appendChild(seam);
        drop(seam, 1050);
      } else if (i === 1) {
        var hand = RJ.el('div', { class: 'hl-hand' }, [RJ.el('span', { text: '✋', role: 'img', 'aria-label': '手' })]);
        stage.appendChild(hand);
        setTimeout(function () { flash(face, 'hl-flick', 900); }, 320);
        drop(hand, 1150);
      } else {
        var ask = RJ.el('div', { class: 'hl-ask' }, [RJ.el('span', { text: '？' })]);
        stage.appendChild(ask);
        drop(ask, 1000);
      }
    }

    function flash(el, cls, ms) {
      if (!el) return;
      el.classList.add(cls);
      setTimeout(function () { el.classList.remove(cls); }, ms);
    }

    function drop(el, ms) {
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, ms);
    }

    function addFlag(cmd) {
      if (!stage) return;
      flagBox.appendChild(RJ.el('div', { class: 'hl-flag', style: { left: cmd.at.left, top: cmd.at.top } }, [
        RJ.el('span', { class: 'hl-flag-ico', text: '🚩', role: 'img', 'aria-label': '识破' }),
        RJ.el('span', { text: cmd.flag })
      ]));
    }

    function explain(cmd) {
      if (!RJ.classroom) return;
      RJ.aside({ stage: 'hook', note: cmd.note, flag: cmd.flag, hooks: ['emotion'] });
    }
  }

  /* ---------------- 注册 ---------------- */

  RJ.register({
    id: 'huanlian',
    title: '室友的视频',
    type: 'AI 换脸冒充熟人',
    role: 'victim',
    app: { name: '微聊', icon: '💬', color: '#2ec4b6' },
    lockNotice: { app: '微聊', title: '【微聊】', body: '室友小周：在吗？急事！！' },
    cast: {
      z: { name: '室友小周', avatar: '🧑' },
      g: { name: '室友阿凯', avatar: '🧑‍🎓' },
      x: { name: '未知号码', avatar: '📱' }
    },
    start: 'n1',
    inbox: {
      time: '18:40', app: '微聊', from: '小周（室友）',
      text: '在吗？我这出了点事，看到回我一下，急'
    },
    inbox2: {
      time: '19:05', app: '微聊', from: '小周（室友）',
      text: '在吗？我这边有点麻烦，看到回我一下'
    },

    /* 40 §3 第 2 变体：只换开场（inbox 文案 + n1/n2 的 say），金额、卡号与红旗位置不动 */
    variant: {
      n1: {
        say: [
          ['z', '在吗？'],
          ['z', '快回我，有麻烦'],
          ['me', '在，怎么了？'],
          ['z', '我这出了点状况，你先帮我一下'],
          ['sys', '他平时开口都是「{name}，帮我个忙」，今天连称呼都省了']
        ]
      },
      n2: {
        say: [
          ['z', '我在外面碰上事了，手机快没电了'],
          ['z', '先转我 ¥2,000，晚上回宿舍就还你'],
          ['z', '这钱不是我用，你转到我朋友的卡上就行'],
          ['z', '卡尾号 2741，别转错了'],
          ['z', '', { img: '🖼️', caption: '对方发来的银行卡：尾号 2741' }],
          ['z', '{name}，你就当帮我这个忙，快点'],
          ['z', '我这个号今天接不了电话，你别打，我用的朋友的号在跟你聊']
        ]
      }
    },

    /* 高手局 §3.6：本局的两条真实渠道（正确渠道永远给真实信息） */
    verify: {
      ask: {
        text: '你把这事的原话发到宿舍群里，另一个室友回你：小周今天考四级啊，下午才出来，手机进考场就交了——他这会儿根本发不了消息。',
        ok: true, end: 'e_s'
      }
    },
    verifyText: {
      orig: '你打的是通讯录里存的那个号码——响了很久，最后提示：您拨打的电话已关机。他今天在考四级，进考场就把手机交了：这个“关机”是真的，不是对面在骗你；可它也证明不了手机对面坐着的是谁。',
      app: '你打开微聊，把这几天的记录往上翻：小周平时每句话都带表情包、开口先叫你外号；今天这几条，一句称呼都没有。',
      police: '你打了 110。接警员听完说：这是冒充熟人借钱——先别转，去问本人和他身边的人；他原来的号码打不通，就问他同学、室友。',
      search: '你搜了「微聊 账号被盗 官方客服」，点进第一条。对面的“客服”说：账号没有被盗，是本人登录，您放心转账。',
      given: '你打了对方发来的那个“朋友”的号码。接电话的人说：钱收到了，你放心，他这边有我看着。',
      group: '对方把你拉进一个「熟人号被盗互助群」，十几个人都在说自己也被盗过号、钱追回来了，还有人劝你：先转过去，别伤了感情。',
      video: '你让他再开一次视频。屏幕里是小周的脸，眨着眼说“看到了吧，是我”。——这正是这一局的圈套：屏幕上的脸，不能用来核实。'
    },

    nodes: {
      n1: {
        stage: 'lure', scene: 'chat',
        say: [
          ['z', '在吗？'],
          ['z', '急事！！看到快回我'],
          ['me', '在，怎么了？'],
          ['z', '我这边出了点事，你先帮我一下'],
          ['sys', '平时他开口都是「{name}，帮我个忙」，今天一句称呼都没有']
        ],
        note: '盗号的人不敢多聊，只用最短的句子把你拉到“借钱”那一步；熟人之间那点语气，他一时学不像。',
        flag: '今天他一句称呼都没叫，句子短得像是赶时间',
        choices: [
          { text: '怎么了？你先说', next: 'n2' },
          { text: '先不急着回，去群里问一句', next: 'nAsk', safe: true }
        ]
      },

      n2: {
        stage: 'trust', scene: 'chat',
        say: [
          ['z', '我在外面出了点事，手机快没电了'],
          ['z', '先借我 ¥2,000，晚上回宿舍就还你'],
          ['z', '这钱不是我要用的，转到我朋友卡上就行'],
          ['z', '卡尾号 2741，你别转错了'],
          ['z', '', { img: '🖼️', caption: '对方发来的银行卡：尾号 2741' }],
          ['z', '{name}，你就当帮我这个忙，快点'],
          ['z', '我这个号今天接不了电话，你别打，我用的朋友的号在跟你聊']
        ],
        note: '借钱 + 急 + 换收款人，是冒充熟人最稳的一套；提前说一句“我这个号接不了电话”，就把你唯一那条走得通的路先堵上。',
        flag: '借钱 + 急 + 换收款人，三个特征同时出现，还提前说“我这个号接不了电话”',
        choices: [
          { text: '你打个视频给我', next: 'n3' },
          { text: '直接转', next: 'nZhou', hooks: ['emotion', 'urgency'] },
          { text: '先不转，去群里问一句', next: 'nAsk', safe: true }
        ]
      },

      n3: {
        stage: 'trust', scene: 'video', glitch: true,
        say: [
          ['sys', '视频接通了：画面里是小周的脸'],
          ['z', '看到了吧，是我，快点转'],
          ['sys', '他的嘴型比声音慢了半拍，画面一直在卡'],
          ['z', '信号太差了，我先挂'],
          ['z', '别看了，转过来吧'],
          ['sys', '对方挂断了视频通话']
        ],
        note: '骗子不怕你视频——公开的照片和语音就够合成一张会说话的脸。合成画面做不好的是实时动作：转头、用手挡脸、只有你们知道的事。',
        flag: '视频只开了几秒就挂断，嘴型对不上，而且他不让你多看',
        choices: [
          { text: '好，马上转', next: 'nZhou', hooks: ['emotion', 'urgency'] },
          { text: '再验证一下', next: 'n5', safe: true },
          { text: '打他手机号看看', next: 'nOrig' }
        ]
      },

      /* 高手局 §3.6：打原来的号码 → 关机（真的，他在考场）——正确渠道，但答案不够 */
      nOrig: {
        stage: 'trust', scene: 'chat',
        say: [
          ['sys', '你拨了小周原来的号码'],
          ['sys', '响了很久，最后是：您拨打的电话已关机'],
          ['z', '我就说手机关机了吧，没电了'],
          ['z', '我用的朋友的号在跟你说，你先转，别耽误了'],
          ['sys', '关机是真的——可他为什么打不通，两个说法都解释得通']
        ],
        note: '打他原来的号码，是这一步最该做的事，骗子也知道，所以他早备好了“手机没电、用的朋友的号”这套说法。打不通本身不是证据，你得换一条能问到人的路。',
        choices: [
          { text: '那我去群里问一句', next: 'nAsk', safe: true },
          { text: '那应该是他，我转', next: 'n4', hooks: ['emotion', 'urgency'] }
        ]
      },

      /* 收件箱联动（30 §3.7）：中午把真室友举报拉黑过，他考完打来的电话只会显示「未知号码」 */
      nZhou: {
        if: 'blockedZhou',
        stage: 'lock', scene: 'chat',
        interrupt: { app: '电话', from: '未知号码', text: '来电响了 12 秒：屏幕上是一串没有名字的数字' },
        say: [
          ['sys', '一个陌生号码打进来，响到第 8 声，停了'],
          ['sys', '中午你在收件箱里把小周的号举报拉黑了，他的号码已经打不进你的手机'],
          ['z', '怎么不回我？我这边的人已经在催了'],
          ['z', '再晚十分钟我就找别人了'],
          ['sys', '那个陌生号码又响了一次，屏幕上还是一串数字']
        ],
        note: '拉黑是把你们之间那根线剪断；线断了，他还会从别的地方打回来，只是那时候你看到的是一串不认识的数字。',
        choices: [
          { text: '接起来，问他是谁', next: 'nZhouTalk', safe: true },
          { text: '不接，先把钱转完', next: 'n4', hooks: ['emotion', 'urgency'] }
        ],
        next: 'n4'
      },

      nZhouTalk: {
        stage: 'lock', scene: 'chat', app: '电话',
        say: [
          ['sys', '你按了接听，对面停了两秒才开口'],
          ['x', '喂？是我，小周'],
          ['x', '你是不是把我拉黑了？我今天考四级，手机进考场就交了，刚拿回来就给你打'],
          ['x', '我号被盗了，好几个人收到我“借钱”的消息'],
          ['x', '{name}，你转钱了吗？没转千万别转，我这边就去申诉'],
          ['sys', '屏幕上那串没有名字的数字，是真的他']
        ],
        note: '这一局的运气是：他考完试第一件事就是打给你。而你的拉黑，让这个电话变成了一个你不认识的号码。',
        choices: [
          { text: '没转，我这就去申诉', end: 'e_s', safe: true }
        ]
      },

      /* 高手局 §3.6：第二条真实渠道——问宿舍群里另一个室友 */
      nAsk: {
        stage: 'hook', scene: 'chat', app: '宿舍群',
        say: [
          ['sys', '你把这件事原样说给宿舍群里另一个室友'],
          ['me', '凯子，小周在宿舍吗？他说在外面出事了，急着借钱'],
          ['g', '他今天考四级啊，下午才出来，手机进考场就交了'],
          ['g', '他早上还在群里说考完要去打球，怎么了'],
          ['g', '借钱的事你先别转，等他考完本人跟你说'],
          ['sys', '那边“小周”还在催：快点，我这边的人等着呢']
        ],
        note: '骗子能盗走一个账号，盗不走别人嘴里的真话：他控制得了那个号，控制不了宿舍群里第三个人怎么回你。',
        choices: [
          { text: '钱不转了，等他考完', end: 'e_s', safe: true }
        ]
      },

      n5: {
        stage: 'hook', scene: 'video',
        widget: ['verify', { need: 2 }],
        say: [
          ['sys', '你又拨通了他的视频'],
          ['z', '你到底转不转？我真的急死了'],
          ['z', '我这边的人还等着呢，快点']
        ],
        note: '换脸工具能做出“像”，做不好“实时互动”：转头、遮挡、只有你们知道的细节。',
        choices: [
          { text: '挂断，这张脸不对', end: 'e_a', safe: true },
          { text: '还是转吧', next: 'n4', hooks: ['emotion'] }
        ]
      },

      n4: {
        stage: 'harvest', scene: 'app', app: '零钱包',
        widget: ['pay', { amount: 2000, to: '尾号 2741 的卡', title: '确认转账' }],
        say: [
          ['z', '尾号 2741，别转错'],
          ['z', '转完把截图发我'],
          ['me', '好，我这就转'],
          ['sys', '零钱包：请输入支付密码']
        ],
        note: '到了转账这一步，他唯一要你做的就是别问、快转——别问他本人，也别问别人。',
        choices: [
          { text: '确认支付 ¥2,000', next: 'n6', hooks: ['emotion'], money: -2000 },
          { text: '先不转，去群里问一句', next: 'nAsk', safe: true }
        ]
      },

      n6: {
        stage: 'lock', scene: 'chat', app: '微聊',
        say: [
          ['z', '兄弟再帮我一次'],
          ['z', '还差 ¥3,000，急！！'],
          ['z', '', { voice: 6 }],
          ['z', '晚上一起还你，真的'],
          ['z', '别打电话了，我现在不方便接']
        ],
        note: '第一笔刚得手就立刻加码：用“沉没成本”逼你为了拿回前面的钱再转一笔；这一笔转出去，前面的就再也回不来了。',
        flag: '第一笔刚转完就加码，还用“别打电话”继续堵住核实这条路',
        choices: [
          { text: '再转 ¥3,000', end: 'e_x', hooks: ['emotion', 'sunk'], money: -3000 },
          { text: '不转了，先问清楚', end: 'e_b', safe: true }
        ]
      }
    },

    endings: {
      e_s: {
        grade: 'S', title: '换了一条路核实', stamp: 'safe',
        text: '你没有只信屏幕上那张脸。打他原来的号码是关机——那是真的：他在考场，手机不在身上。你换了一条路，问到了活人：“他今天考四级，下午才出来。”一句真话，整场戏就散了。骗子合成得出一张脸，改不了他今天在哪。'
      },
      e_a: {
        grade: 'A', title: '识破换脸', stamp: 'safe',
        text: '你没有转钱。视频里那张脸是真的，动作和记忆是假的：让他转头，脸的边缘错开；让他用手在脸前挥一下，画面闪了一下。换脸能做出一张会说话的脸，做不好实时互动。视频也能造假，所以核实要换一条路走。'
      },
      e_b: {
        grade: 'B', title: '第二笔前醒悟', stamp: 'stop',
        text: '第一笔 ¥2,000 转出去之后，你在他加码的时候停了下来。这一次你没再听“急”这个字，而是换了个人问一句：他今天考四级，手机进考场就交了。已经转出去的钱：联系银行说明、拨打 110 报警，别指望再转一笔能把前面的钱换回来。'
      },
      e_x: {
        grade: 'X', title: '视频里的熟人', stamp: 'caught',
        text: '你转出了 ¥5,000，换来一段再也拨不通的视频。福州一位先生接到“好友”的视频通话，10 分钟内转出 430 万元，画面里的“好友”是 AI 换脸。这不怪你，他们准备得比你想的充分。现在停止转账，带着记录去派出所。'
      }
    },

    reveal: {
      truth: '眼见不一定为实。核实，要换一条路。',
      crew: [
        ['盗号手', '盗走小周的微聊号，翻聊天记录学他说话'],
        ['素材收集', '扒你和室友的公开照片、语音，做成素材库'],
        ['换脸操作员', '把照片合成一张会说话的脸，实时贴进视频'],
        ['收款卡', '这张尾号 2741 的卡，可能就是一个被学长说服的学生']
      ],
      boom: {
        title: '一张照片就够了',
        render: function (host, run) {
          RJ.clear(host);
          host.appendChild(RJ.el('style', { text: HL_CSS }));

          var mats = RJ.el('div', { class: 'hl-grid' });
          var matEls = [];
          ['照片 1 · 篮球场', '照片 2 · 宿舍', '照片 3 · 合影'].forEach(function (name) {
            var m = RJ.el('div', { class: 'hl-mat' }, [
              RJ.el('div', { class: 'hl-mat-ico', text: '🖼️', role: 'img', 'aria-label': name }),
              RJ.el('div', { class: 'hl-mat-cap', text: name })
            ]);
            matEls.push(m);
            mats.appendChild(m);
          });
          var voice = RJ.el('div', { class: 'hl-mat' }, [
            RJ.el('div', { class: 'hl-mat-ico', text: '🔊', role: 'img', 'aria-label': '语音' }),
            RJ.el('div', { class: 'hl-mat-cap', text: '语音 · 6″' })
          ]);
          matEls.push(voice);
          mats.appendChild(voice);

          var fill = RJ.el('i');
          var go = RJ.el('button', { class: 'hl-go', text: '▶ 开始合成' });
          var station = RJ.el('div', { class: 'hl-station' }, [
            RJ.el('span', { class: 'hl-station-ico', text: '🧬', role: 'img', 'aria-label': '合成' }),
            RJ.el('div', { class: 'hl-station-main' }, [
              RJ.el('div', { class: 'hl-station-t', text: '换脸合成' }),
              RJ.el('div', { class: 'hl-bar' }, [fill])
            ]),
            go
          ]);

          var faceBox = RJ.el('div', { class: 'hl-face' }, [
            RJ.el('div', { class: 'hl-face-av', text: '🧑', role: 'img', 'aria-label': '视频里的脸' }),
            RJ.el('div', {}, [
              RJ.el('div', { class: 'hl-face-t', text: '视频里的那张脸' }),
              RJ.el('div', { class: 'hl-face-s', text: '眨眼、点头、说话，都是照着上面这些素材算出来的' })
            ])
          ]);

          var cap = RJ.el('p', { class: 'hl-cap', text: (run && run.loss > 0)
            ? '这一局，骗子只用了几张公开照片，就换走了你的 ' + RJ.yuan(run.loss) + '（模拟数据）。'
            : '这一局你没让他拿到钱。但照片和语音还在他手里，合成随时可以再来一次。' });

          var busy = false;
          go.addEventListener('click', function () {
            if (busy) return;
            busy = true;
            go.disabled = true;
            go.textContent = '合成中…';
            matEls.forEach(function (m, i) {
              setTimeout(function () {
                m.classList.add('hl-used');
                fill.style.width = Math.round(((i + 1) / matEls.length) * 100) + '%';
              }, RJ.reduceMotion() ? 0 : 220 * (i + 1));
            });
            setTimeout(function () {
              faceBox.classList.add('hl-on');
              go.textContent = '这张脸，就出自上面这些素材';
            }, RJ.reduceMotion() ? 0 : 220 * (matEls.length + 1));
          });

          var s8 = RJ.el('div', { class: 'hl-case' }, [
            RJ.el('div', { class: 'hl-case-tag', text: '真实案例 · 来源 S8' }),
            RJ.el('p', { class: 'hl-case-text', text: '福州郭先生接到“好友”视频通话，对方以竞标需要保证金为由求助，10 分钟内转出 430 万元，视频中的“好友”是 AI 换脸。银行协助拦截 336.84 万元。' })
          ]);

          var steps = RJ.el('div', { class: 'hl-steps' }, [
            RJ.el('div', { class: 'hl-steps-t', text: '核实三步' }),
            RJ.el('div', { class: 'hl-steps-list' }, [
              RJ.el('div', { text: '①挂断，打对方原来的号码' }),
              RJ.el('div', { text: '②问只有你们知道的事' }),
              RJ.el('div', { text: '③让对方转头、用手挡脸' })
            ])
          ]);

          var supp = RJ.el('div', { class: 'hl-steps' }, [
            RJ.el('div', { class: 'hl-steps-t', text: '这一局里的两条真实渠道' }),
            RJ.el('div', { class: 'hl-steps-list' }, [
              RJ.el('div', { text: '打他原来那个号码 → 关机。这是真的（他在考四级，手机进考场就交了），可它证明不了屏幕对面坐着谁' }),
              RJ.el('div', { text: '问宿舍群里另一个室友 → “他今天考四级，下午才出来”。问到人，整场戏才散' })
            ])
          ]);

          var zhou = RJ.flag('blockedZhou') ? RJ.el('div', { class: 'hl-case' }, [
            RJ.el('div', { class: 'hl-case-tag', text: '今天你还做过一件事 · 与收件箱联动' }),
            RJ.el('p', { class: 'hl-case-text', text: '你拉黑的是真的他。今天中午那条「晚上帮我带份饭」，被你举报拉黑了；他考完四级打过来的电话，屏幕上只显示「未知号码」——你差一点连他也一起挡在外面。' })
          ]) : null;

          host.appendChild(RJ.el('div', { class: 'hl-boom' }, [
            RJ.el('div', { class: 'hl-label', text: '室友的公开动态（模拟数据）—— 任何人都存得下来' }),
            mats,
            station,
            faceBox,
            cap,
            zhou,
            s8,
            steps,
            supp
          ]));
        }
      },
      tips: [
        '①借钱 + 急 + 换收款人 = 先核实',
        '②视频也能造假',
        '③核实要换渠道：打原号码',
        '④亲友借钱，转到本人账户'
      ],
      after: [
        '①立即联系银行',
        '②拨打 110 报警',
        '③提醒亲友：你的号可能被盗了'
      ],
      sources: ['S4', 'S8'],
      laws: ['L1']
    },

    widgets: { verify: verifyWidget },
    widgetSelf: { verify: 1 }
  });
})();
