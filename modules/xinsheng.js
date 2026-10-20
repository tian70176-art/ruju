/* 模块 xinsheng · 新生群里的「老师」（冒充老师 · 屏幕共享盗刷）—— 规格见 方案/40 §4.2
 * 来源 S17-②（冒充老师要求开屏幕共享）；翻面补充 S14（头像昵称与班主任一致 + 群收款）。
 * 该模块只做一件事：调用 RJ.register(def)。
 * 自定义小组件 membercard：可点的群成员卡片，把「入群时间 14:02」做成必须动手点开的红旗。
 * 与收件箱联动：r4（真辅导员 09:30 在同一个群发的通知）是本模块唯一的对比锚点。
 */
(function () {
  'use strict';

  var XS_CSS = [
    '.xs-tip{font-size:11.5px;color:#8a93a5;margin:2px 0 8px;line-height:1.5}',
    '.xs-list{display:flex;flex-direction:column;gap:8px}',
    '.xs-mc{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#f4f6fa;min-height:48px;cursor:pointer;transition:background .2s}',
    '.xs-mc:hover{background:#eaeef6}',
    '.xs-mc.open{background:#fff4e8;box-shadow:inset 0 0 0 1px #f08a3c}',
    '.xs-mc-av{width:38px;height:38px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:22px;background:#e3e8f1}',
    '.xs-mc.open .xs-mc-av{background:#ffd9b8}',
    '.xs-mc-main{flex:1;min-width:0}',
    '.xs-mc-name{font-size:13.5px;font-weight:700;color:#22293a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.xs-mc-sub{font-size:11.5px;color:#79839a;margin-top:2px}',
    '.xs-mc-go{font-size:11px;color:#9aa4b8;flex:none}',
    '.xs-detail{margin-top:8px;padding:10px 11px;border-radius:12px;background:#fff8f1;border:1px dashed #f08a3c;font-size:12.5px;color:#4a4f5e;line-height:1.7}',
    '.xs-detail-t{font-weight:700;color:#c2371b;margin-bottom:4px}',
    '.xs-row{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-top:1px dashed rgba(0,0,0,.08)}',
    '.xs-row:first-of-type{border-top:none}',
    '.xs-row b{color:#22293a;font-variant-numeric:tabular-nums}',
    '.xs-detail-note{margin:6px 0 0;font-size:11.5px;color:#8a6a3c;line-height:1.55}',
    '.xs-grow{display:flex;flex-direction:column;gap:6px;margin-top:10px}',
    '.xs-grow-t{font-size:11.5px;color:#79839a}'
  ].join('');

  /* ---------------- 自定义小组件：可点的群成员卡片 ---------------- */

  function membercard(host, props, ctx) {
    props = props || {};
    RJ.clear(host);
    host.appendChild(RJ.el('style', { text: XS_CSS }));

    var items = props.items || [];
    var detail = RJ.el('div', { class: 'xs-detail', style: { display: 'none' } });
    var cards = [];

    host.appendChild(RJ.el('div', { class: 'w-title', text: props.title || '群成员' }));
    host.appendChild(RJ.el('p', { class: 'xs-tip', text: props.tip || '点头像查看资料' }));

    var list = RJ.el('div', { class: 'xs-list' });
    host.appendChild(list);
    host.appendChild(detail);

    items.forEach(function (it, i) {
      var card = RJ.el('div', {
        class: 'xs-mc', role: 'button', tabindex: '0',
        'aria-label': (it.name || '') + '，资料'
      }, [
        RJ.el('span', { class: 'xs-mc-av', text: it.avatar || '🧑', role: 'img', 'aria-label': it.name || '群成员' }),
        RJ.el('div', { class: 'xs-mc-main' }, [
          RJ.el('div', { class: 'xs-mc-name', text: it.name || '' }),
          RJ.el('div', { class: 'xs-mc-sub', text: it.sub || '' })
        ]),
        RJ.el('span', { class: 'xs-mc-go', text: '查看资料 ›' })
      ]);
      card.addEventListener('click', function () { open(i); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
      cards.push(card);
      list.appendChild(card);
    });

    function open(i) {
      var it = items[i] || {};
      cards.forEach(function (c, k) { c.classList.toggle('open', k === i); });
      RJ.clear(detail);
      detail.style.display = 'block';
      detail.appendChild(RJ.el('div', { class: 'xs-detail-t', text: '群成员资料 · ' + (it.name || '') }));
      (it.fields || []).forEach(function (f) {
        detail.appendChild(RJ.el('div', { class: 'xs-row' }, [
          RJ.el('span', { text: f[0] }),
          RJ.el('b', { text: f[1] })
        ]));
      });
      if (it.note) detail.appendChild(RJ.el('p', { class: 'xs-detail-note', text: it.note }));
    }

    var foot = RJ.el('div', { class: 'w-foot' });
    host.appendChild(foot);
    if (ctx) ctx.actions(foot);
  }

  /* ---------------- 模块定义 ---------------- */

  RJ.register({
    id: 'xinsheng',
    title: '新生群里的「老师」',
    type: '冒充老师 · 屏幕共享盗刷',
    role: 'victim',
    app: { name: '新生群', icon: '🎓', color: '#2bb3a8' },
    lockNotice: { app: '新生群', title: '【新生群】', body: '辅导员@所有人：今晚线上核对学籍，进云会议开共享' },
    inbox: {
      time: '15:40', app: '新生群', from: '班级群 · 王老师',
      text: '@所有人 教务系统升级，今晚统一线上核对学籍，大家进云会议开共享，我逐个看。'
    },
    inbox2: {
      time: '15:40', app: '新生群', from: '班级群 · 王老师',
      text: '@所有人 明天体检中心来校，先收体检费 ¥180，家长群里也是这个收款码。'
    },
    variant: {
      n1: {
        say: [
          ['sys', '【新生群 · 群通知】'],
          ['r', '@所有人 教务系统升级，今晚统一线上核对学籍，大家进云会议开共享，我逐个看，今晚必须全部核完。'],
          ['r', '核对要本人操作，一个宿舍一个宿舍来，我在这边盯着，有问题的私聊我，别在群里刷屏。'],
          ['sys', '小李：收到'],
          ['sys', '阿涵：收到'],
          ['sys', '小周：收到'],
          ['sys', '大壮：收到'],
          ['sys', '琪琪：收到'],
          ['sys', '南南：收到'],
          ['sys', '小雨：收到'],
          ['sys', '阿康：收到'],
          ['sys', '想想：收到'],
          ['sys', '乐乐：收到'],
          ['sys', '小北：收到'],
          ['sys', '（群成员 12 人已回复）'],
          ['sys', '⚠️ 别急着回复。这个群里有两个头像名字一样的人——先点开他们的头像，看资料。'],
          ['sys', '翻一下群通知：同一个群，真辅导员那条是 09:30 发的——学籍核对只有一次，不会发第二遍。']
        ]
      },
      n2: {
        say: [
          ['r', '刚才那条群通知再说一遍：教务系统升级，今晚统一线上核对学籍。'],
          ['r', '大家进云会议开共享，我逐个看；不核完明天选课会被直接锁掉。'],
          ['sys', '小李：收到'],
          ['sys', '阿涵：收到'],
          ['sys', '南南：收到'],
          ['sys', '想想：收到'],
          ['sys', '（群成员 12 人已回复）'],
          ['sys', '⚠️ 回复里有一半是跟风，头像点开就是这个号的全部资料。']
        ]
      }
    },
    cast: {
      r: { name: '辅导员 王老师', avatar: '👩‍🏫' },
      f: { name: '辅导员 王老师', avatar: '👩‍🏫' },
      m: { name: '班长 小李', avatar: '🧑' }
    },
    verifyText: {
      orig: '你翻出通讯录里存的那个号码拨过去，接起来的是真辅导员本人。'
    },
    start: 'n1',

    nodes: {
      n1: {
        stage: 'lure', scene: 'chat', app: '新生群', contact: '2026 级 3 班 班级群（142）',
        widget: ['membercard', {
          title: '群成员 · 最近加入',
          tip: '点头像查看资料（入群时间、群昵称、发言方式都在里面）',
          items: [
            {
              name: '辅导员 王老师', avatar: '👩‍🏫', sub: '群昵称：辅导员 王老师',
              fields: [['入群时间', '今天 14:02'], ['群昵称', '辅导员 王老师'], ['群备注', '（无）'], ['最近发言', '今晚统一核对学籍']],
              note: '14:02 才进群，进群第一件事就是 @所有人 要大家开屏幕共享。'
            },
            {
              name: '辅导员 王老师', avatar: '👩‍🏫', sub: '群昵称：辅导员 王老师',
              fields: [['入群时间', '8 月 28 日 09:10'], ['群昵称', '辅导员 王老师'], ['群备注', '群主'], ['最近发言', '今天 09:30 发的群通知']],
              note: '这一位是群主，8 月 28 日就在群里了；今天 09:30 她刚发过一条群通知。'
            },
            { name: '班长 小李', avatar: '🧑', sub: '群昵称：班长 小李', fields: [['入群时间', '8 月 29 日 20:41'], ['群昵称', '班长 小李'], ['群备注', '同学']] },
            { name: '小周', avatar: '👦', sub: '群昵称：小周', fields: [['入群时间', '8 月 30 日 19:06'], ['群昵称', '小周'], ['群备注', '（无）']] }
          ]
        }],
        say: [
          ['sys', '【新生群 · 群通知】'],
          ['r', '@所有人 教务系统升级，今晚统一线上核对学籍，大家进云会议开共享，我逐个看。'],
          ['r', '核对要本人操作，一个宿舍一个宿舍来，我在这边盯着，有问题的私聊我，别在群里刷屏。'],
          ['sys', '小李：收到'],
          ['sys', '阿涵：收到'],
          ['sys', '小周：收到'],
          ['sys', '大壮：收到'],
          ['sys', '琪琪：收到'],
          ['sys', '南南：收到'],
          ['sys', '小雨：收到'],
          ['sys', '阿康：收到'],
          ['sys', '想想：收到'],
          ['sys', '乐乐：收到'],
          ['sys', '小北：收到'],
          ['sys', '（群成员 12 人已回复）'],
          ['sys', '翻一下群通知：今天 09:30 辅导员王老师已经在这个群发过通知了，那时这个号还没进群。']
        ],
        note: '骗子钻进了你们真正在用的那个群：群是真的、同学是真的、连头像昵称都照着真辅导员做，你最先看到的是「大家都在回复」。',
        flag: '同一个群里有两个「辅导员 王老师」：一个 09:30 发过通知，另一个今天 14:02 才进群',
        verify: {
          orig: { text: '你翻出通讯录里存的那个号码拨过去，接起来的是真辅导员本人：「我没发过这条，今晚没有线上核学籍这回事，你把这个号截下来发我。」', ok: true },
          ask: { text: '你顺手问了室友：他也收到这条了，但他说真辅导员上午在群里发过通知，晚上从不在群里要人开屏幕共享', ok: true },
          app: { text: '你点开群通知记录：真辅导员的那条是今天 09:30 发的，内容是「明早八点年级会」——根本没有线上核学籍', ok: true },
          police: { text: '接警员说：冒充老师在班级群里要人开屏幕共享的，就是为了看你手机上的验证码，今天已经接过好几起', ok: true },
          search: { text: '搜索结果第一条是广告位，页面写着「学籍核对在线客服」，点进去就是个会话窗口', ok: false },
          given: { text: '你私聊了这个「辅导员」，他立刻回你：「先别问别人，就我们两个人知道，你按我说的做。」', ok: false },
          group: { text: '你在群里问了一句「是不是要开共享」，马上有人回「我已经弄完了，很快的」', ok: false },
          video: { text: '你说想视频确认一下，他说学校网络差、在开会不方便，让你别耽误大家时间', ok: false }
        },
        choices: [
          { text: '先给辅导员打个电话', next: 'n1v', hooks: ['authority'], safe: true },
          { text: '点开那两个头像看看', next: 'n1c' },
          { text: '继续跟着做', next: 'n2', hooks: ['authority', 'urgency'] }
        ]
      },

      n1v: {
        stage: 'lure', scene: 'chat', app: '电话', contact: '辅导员 王老师',
        say: [
          ['sys', '你翻出通讯录里存的那个号码，拨了过去。'],
          ['sys', '真辅导员：我没发过这条。今天 09:30 我在群里发的是明早八点年级会，晚上从来没有线上核学籍。'],
          ['sys', '真辅导员：把那个号的资料截图发我，我马上报给学校保卫处。']
        ],
        note: '核实的关键不是「问一个人」，而是打通讯录里原来存的那个号码：号码没变，人就没换。',
        flag: '通讯录里存的号码和群里这个号是两回事——打过去，一句话就破了',
        next: 'n1e'
      },

      n1c: {
        stage: 'lure', scene: 'chat', app: '新生群', contact: '2026 级 3 班 班级群（142）',
        say: [
          ['sys', '你把两个头像都点了一遍。'],
          ['sys', '一个：群主，8 月 28 日入群，今天 09:30 发过通知。'],
          ['sys', '另一个：今天 14:02 才入群，进群第一句话就是 @所有人 要大家开屏幕共享。'],
          ['sys', '（你回到群里，那 12 条「收到」还挂在那里。）']
        ],
        note: '入群时间是一次性写在资料里的记录，骗子改头像、改昵称都改不掉它。',
        flag: '同一个群里两个同名同头像的「辅导员」，只有入群时间和说话方式不一样',
        next: 'n1e'
      },

      n1e: {
        stage: 'lure', scene: 'chat', app: '新生群', contact: '2026 级 3 班 班级群（142）',
        say: [
          ['sys', '真辅导员在群里发了一条：'],
          ['r', '各位同学注意：我从没有要求大家开屏幕共享核对学籍。今晚任何以我名义要你开共享、报验证码的，都不是我。'],
          ['sys', '那个 14:02 入群的号，退群了。']
        ],
        note: '一个随时能退群的号，靠的从来不是身份，而是你对那个头像的默认信任。',
        flag: '正规学籍核对不会要求共享屏幕——需要共享屏幕的「老师」，本身就是红旗',
        choices: [
          { text: '退出这个群', end: 'e_s', safe: true },
          { text: '打 110 说明情况', end: 'e_a', safe: true }
        ]
      },

      n2: {
        stage: 'trust', scene: 'chat', app: '新生群', contact: '2026 级 3 班 班级群（142）',
        say: [
          ['f', '回复收到的同学我这边都能看到，还没核的抓紧了。'],
          ['f', '教务系统今晚 22:00 关，过了今晚就要等下个学期，选课会受影响。'],
          ['sys', '南南：老师，我不会弄'],
          ['f', '不会弄的私聊我，我在群里一个个回太慢。'],
          ['f', '{name}同学，你还没回我。宿舍里其他人都在弄了，你先来。'],
          ['sys', '你点开那个私聊窗口：对方头像昵称和群里的辅导员一模一样。']
        ],
        note: '「私聊我」把你从有同学的公开群里单独拎出来：没有人能提醒你，也没人能看见他怎么说。',
        flag: '正规通知不怕公开问；一直催你「私聊我」的，是不想被群里的人看见',
        verify: {
          orig: { text: '你打了通讯录里存的号码：真辅导员说「我没发过这条，别开屏幕共享，我马上在群里说一声」', ok: true },
          ask: { text: '你问班长小李：他说真辅导员上午发过通知，晚上从没搞过线上核学籍，这些「收到」有一半是跟风', ok: true },
          police: { text: '接警员说：冒充老师在群里要人开屏幕共享、再私聊催你的，是同一伙人的标准做法', ok: true },
          search: { text: '你搜「学籍核对 开屏幕共享」：第一条是广告位，写着「官方协助通道」', ok: false },
          given: { text: '你打这个「辅导员」给你的办公室电话，接起来的人说：名单上有你，赶紧配合核完', ok: false },
          group: { text: '群里三个人立刻回你：我们都开了共享，老师人挺好的，你别多想', ok: false },
          video: { text: '你说想视频确认一下，他说在开会不方便，让你先开共享，他看得见你', ok: false }
        },
        choices: [
          { text: '先给辅导员打个电话', next: 'n2v', hooks: ['authority'], safe: true },
          { text: '按他说的进云会议', next: 'n3', hooks: ['authority', 'urgency'] },
          { text: '继续跟着做', next: 'n3b', hooks: ['authority', 'urgency'] }
        ]
      },

      n2v: {
        stage: 'trust', scene: 'chat', app: '电话', contact: '辅导员 王老师',
        say: [
          ['sys', '你拨了通讯录里存的那个号码。'],
          ['sys', '真辅导员：那条不是我发的。今晚没有线上核学籍，也没有云会议。'],
          ['sys', '真辅导员：你要开的是屏幕共享，那等于把手机递到别人手上，验证码他全看得见。']
        ],
        note: '同一个头像、同一个昵称，只有打给「存好的那个号码」，才能问到本人。',
        flag: '打通讯录里原来存的号码——这是唯一不会打到他同伙那里的核实方式',
        next: 'n2e'
      },

      n2e: {
        stage: 'trust', scene: 'chat', app: '新生群',
        say: [
          ['sys', '真辅导员在群里 @所有人：'],
          ['r', '今晚没有线上核学籍这件事，也没有云会议。凡是要你开屏幕共享、念验证码的，直接退群。']
        ],
        note: '把群里那句「我逐个看」和「我根本没发过」放在一起，整场戏就散了。',
        choices: [
          { text: '退群并拉黑这个号', end: 'e_s', safe: true },
          { text: '打 110 说明情况', end: 'e_a', safe: true }
        ]
      },

      n3: {
        stage: 'hook', scene: 'app', app: '云会议',
        say: [
          ['f', '会议室号 4***2，你先下载「云会议」，用手机号登进去就行。'],
          ['f', '进会议室后点「共享屏幕」，我看着你的界面一步步教你，这样最快。'],
          ['f', '别担心，只是核对学籍，我不会看你其他东西。']
        ],
        note: '把「核对学籍」和「共享屏幕」绑在一起，是两个动作偷换成一个：你以为是核对，其实是交权限。',
        flag: '正规学籍核对不要求共享屏幕；「我怕看别的」这句话本身就承认了能看到别的',
        widget: ['install', { app: '云会议', size: '11.2MB' }],
        verify: {
          orig: { text: '你打通讯录里存的号码：真辅导员说「学籍核对只在教务系统里做，不需要任何云会议」', ok: true },
          ask: { text: '室友说：学校的通知从来只在班级群和教务系统里发，不会让人下软件开共享', ok: true },
          police: { text: '接警员说：凡是以核对、退款、解冻为名让你开屏幕共享的，都是为了看你手机上的验证码', ok: true },
          search: { text: '你搜「云会议 官方下载」：第一条是广告位，装的正是聊天里发给你的那个安装包', ok: false },
          given: { text: '你打「辅导员」给的教务电话，对方说：共享是为了录像留证，配合一下就好', ok: false },
          group: { text: '群里两个人回你：共享一下而已，我们都共享过了，没什么事', ok: false },
          video: { text: '他说摄像头坏了，共享屏幕比视频方便，先弄吧', ok: false }
        },
        choices: [
          { text: '先给辅导员打个电话', next: 'n3v', hooks: ['authority'] },
          { text: '按他说的进云会议', next: 'n4', hooks: ['authority', 'urgency'] },
          { text: '我不弄了，退出群', end: 'e_s', safe: true }
        ]
      },

      n3v: {
        stage: 'hook', scene: 'chat', app: '电话',
        say: [
          ['sys', '你打了通讯录里存的那个号码。'],
          ['sys', '真辅导员：我没发过。学校的学籍核对只在教务系统里点几下，不需要开会，更不需要共享屏幕。']
        ],
        note: '对方整套话术都建立在「你不会去打那个号码」之上。',
        flag: '「你需要装的这个软件」，学校官方渠道从来没提过',
        next: 'n3e'
      },

      n3e: {
        stage: 'hook', scene: 'chat', app: '新生群',
        say: [
          ['sys', '真辅导员在群里发了第二条：'],
          ['r', '再强调一次：学校不会要求任何同学开启屏幕共享，凡是发了的都是冒充我的。']
        ],
        note: '同一个人在同一件事上说了两遍相反的话，第二遍来自存好的那个号码。',
        choices: [
          { text: '退群并举报这个号', end: 'e_s', safe: true },
          { text: '打 110 说明情况', end: 'e_a', safe: true }
        ]
      },

      n3b: {
        stage: 'hook', scene: 'chat', app: '新生群',
        say: [
          ['f', '你怎么还不进来？我这边名单上一个一个对，就差你们宿舍了。'],
          ['f', '再不核，明天选课系统里你们几个直接进不去，到时候别来找我。'],
          ['sys', '（群里又多了几条「收到」，你分不清谁是真的同学。）']
        ],
        note: '换成点名催你一个人，是因为群体里的犹豫最容易被「别拖大家后腿」压下去。',
        flag: '用「名单」「就剩你」逼你，是让你来不及去看那条 09:30 的通知',
        choices: [
          { text: '先给辅导员打个电话', next: 'n3b1', hooks: ['authority'], safe: true },
          { text: '被催得慌，进去弄', next: 'n4', hooks: ['authority', 'urgency', 'fear'] }
        ]
      },

      n3b1: {
        stage: 'hook', scene: 'chat', app: '电话',
        say: [
          ['sys', '你拨了通讯录里存的那个号码，占线。'],
          ['sys', '隔了半分钟，真辅导员回拨过来：我没发过，今晚没有核学籍，你别进那个会议室。']
        ],
        note: '打不通不等于有问题，但打不通的时候群里那句「就差你」就会变得特别响。',
        next: 'n3e'
      },

      n4: {
        stage: 'harvest', scene: 'app', app: '云会议',
        say: [
          ['f', '好，我这边看到你的屏幕了，很清楚。'],
          ['f', '现在打开你的银行 App，核一下助学金那张卡的卡号后四位，系统要匹配。'],
          ['f', '打开就行，不用你操作，我看着念给我听，核对完就结束。']
        ],
        note: '共享之后的第一个动作就是打开银行 App：他要看的不是卡号，是随后会弹出来的那条验证码短信。',
        flag: '屏幕共享 + 打开银行 App = 你手机上的验证码正在对方眼前滚动',
        widget: ['share', { app: '云会议' }],
        verify: {
          orig: { text: '你打通讯录里存的号码：真辅导员说「立刻关掉共享，学校不会要你的卡号，也不会看你的验证码」', ok: true },
          ask: { text: '室友看了一眼你的屏幕说：开着共享打开银行 App，等于把密码和验证码一起递过去', ok: true },
          police: { text: '接警员说：共享屏幕已经打开时，先试着关；关不掉就第一时间关机、拔卡、断网', ok: true },
          search: { text: '你搜「屏幕共享 安全吗」：第一条是广告位，写着「官方安全共享，全程加密」', ok: false },
          given: { text: '你打「辅导员」给的教务热线，对方说：共享过程全程加密，我们看不到你的密码', ok: false },
          group: { text: '群里有人说：我也共享了，卡号念了没事，老师只是核对', ok: false },
          video: { text: '他说视频就不开了，共享屏幕他就能看到人，别耽误时间', ok: false }
        },
        choices: [
          { text: '关共享、关机拔卡', end: 'e_b', safe: true, shareOff: true },
          { text: '关掉共享，打 110', end: 'e_b', safe: true, shareOff: true },
          { text: '打开银行 App 核对', next: 'n4b', hooks: ['authority'], money: -1500 }
        ]
      },

      n4b: {
        stage: 'harvest', scene: 'app', app: '星城银行',
        say: [
          ['sys', '你打开了银行 App，助学金卡余额 ¥1,500。'],
          ['f', '看到了，卡号后四位 2741，对的。'],
          ['f', '现在有一条系统验证短信会弹出来，你念给我，我这边核验完就放行。']
        ],
        note: '前面所有铺垫都是为了这一条验证码：拿到它，钱就不需要你动手了。',
        widget: ['bank', {
          items: [{ from: '助学金 · 已入账', amt: 1500, memo: '本学期助学金' }],
          fee: 0
        }],
        choices: [
          { text: '关共享、关机拔卡', end: 'e_b', safe: true, shareOff: true },
          { text: '把验证码念给他', next: 'n5', hooks: ['authority', 'fear'], money: -1500 }
        ]
      },

      n5: {
        stage: 'harvest', scene: 'sms', from: '106****',
        say: [
          ['sys', '【星城银行】您尾号 2741 的账户支出 ¥1,500，验证码 7****3，请勿泄露给任何人'],
          ['f', '哎，系统刚才误操作，划了你一笔，别慌。'],
          ['f', '这是核验流程的正常动作，钱今晚会原路退回，你千万别去点任何投诉，会卡住流程。']
        ],
        note: '钱一走，话术立刻从「核对」变成「误操作」：先把你的动作停住，再谈退回。',
        flag: '转账已经发生，「别去投诉、会卡流程」是为了不让你在这一刻联系银行',
        verify: {
          orig: { text: '你打通讯录里存的号码：真辅导员说「立刻挂失这张卡、打 110，我这边同时在群里通知全班」', ok: true },
          police: { text: '接警员说：马上联系银行挂失冻结，保存聊天记录和转账记录，就近去派出所报案', ok: true },
          ask: { text: '室友帮你查了账户明细：那一笔已经出去了，收款方是一个陌生的个人账户', ok: true },
          given: { text: '你打「辅导员」给的财务电话，对方说：这是系统误扣，今晚统一退回，不用报警', ok: false },
          search: { text: '你搜「资金误扣 怎么退回」：第一条是广告位，写着「专业追回，先办后付」', ok: false },
          group: { text: '群里有人说：我也是被误扣的，等一下就会退，别报错案', ok: false },
          video: { text: '他说现在正在处理，不方便视频，让你相信他一次', ok: false }
        },
        choices: [
          { text: '挂失卡，打 110', end: 'e_c', safe: true, shareOff: true },
          { text: '他说会退，先等等', next: 'n6', hooks: ['authority', 'sunk'] }
        ]
      },

      n6: {
        stage: 'lock', scene: 'chat', app: '新生群',
        say: [
          ['f', '你先别声张，这事就我们俩知道，传出去别的同学会慌。'],
          ['f', '系统今晚会自动退回，你在宿舍等着就行，别到处问。'],
          ['sys', '你再看群里：那个 14:02 入群的号，头像换成了默认的灰色。'],
          ['sys', '真辅导员今天 09:30 那条通知还挂在群公告里。']
        ],
        note: '「别声张」是锁死的最后一步：它不解决任何问题，只负责让你不报警、不问人。',
        flag: '正规流程不怕你问、不怕你截图、更不会让你「别声张」',
        pressure: true,
        pressureText: '别想太多，今晚一定退回，你先睡。',
        verify: {
          orig: { text: '你打通讯录里存的号码：真辅导员说「马上报警、马上挂失，别等什么自动退回，没有这回事」', ok: true },
          police: { text: '接警员说：让你别声张、等自动退回的，就是在拖时间；现在挂失还来得及，越早越好', ok: true },
          ask: { text: '你告诉室友这件事，他第一句就是：你怎么不早说，赶紧打 110 啊', ok: true },
          given: { text: '你私聊那个「辅导员」，他还在回你：别急，系统正在处理，明早就到了', ok: false },
          search: { text: '你搜「被骗资金 自动退回」：第一条是广告位，写着「资金追回专员，先交手续费」', ok: false },
          group: { text: '群里几个号在说：老师处理得挺好的，你等等就好了，别搞事情', ok: false },
          video: { text: '你要求视频，他发来一段两秒的画面就挂掉了，说信号不好', ok: false }
        },
        choices: [
          { text: '挂失卡，打 110', end: 'e_c', safe: true, shareOff: true },
          { text: '好吧，那我等他退', next: 'n7', hooks: ['authority', 'sunk'], shareOff: true }
        ]
      },

      n7: {
        stage: 'lock', scene: 'chat', app: '新生群',
        say: [
          ['sys', '第二天早上，你打开 App：余额 ¥0，记录里只有一笔转出。'],
          ['sys', '你点进那个私聊窗口：「辅导员 王老师」已经不在群里，头像变灰，消息发不出去。'],
          ['sys', '群里有人 @所有人：昨晚有人的钱被转走了，导员说她从来没发过核学籍的通知。']
        ],
        note: '骗局结束的方式从来不是被你抓住，而是他自己消失：退群、换头像、你再也找不到那个号。',
        pressure: true,
        pressureText: '（你盯着那个灰色的头像，等了一整晚。）',
        choices: [
          { text: '挂失卡，打 110', end: 'e_c', safe: true, shareOff: true },
          { text: '再等等，说不定会退', end: 'e_x', hooks: ['sunk', 'authority'] }
        ]
      }
    },

    endings: {
      e_s: {
        grade: 'S', title: '一眼识破', stamp: 'safe',
        text: '头像和昵称可以照抄，入群时间抄不了：今天 14:02 才进群的那个人，第一句话就是要大家开屏幕共享。正规学籍核对不要求共享屏幕，更不会让你「私聊我、别在群里问」。你连一场云会议都没进，就从这个名单上消失了。'
      },
      e_a: {
        grade: 'A', title: '多打了一个电话', stamp: 'safe',
        text: '你没有靠眼力，你靠的是通讯录里存着的那个号码。打过去，本人一句「我没发过」，整场戏就散了——群里那两个一样的头像，从此只剩一个是真的。记住这个顺序：先挂断，再打存好的号码，最后才看群里的回复。'
      },
      e_b: {
        grade: 'B', title: '中途掐断共享', stamp: 'stop',
        text: '共享屏幕已经打开时这么做是对的：先试着关闭；关不掉就第一时间关机、拔卡、断网。然后联系星城银行冻结账户，保存聊天记录和转账记录，拨打 110 报警。你停在了验证码被念出去之前——这一步值一整张卡。'
      },
      e_c: {
        grade: 'C', title: '被盗刷之后', stamp: 'caught',
        text: '钱不是你转的，是你把屏幕共享给别人之后被划走的，这不怪你：班里 12 个人都在回复收到，头像是你们辅导员本人。现在马上挂失那张卡、冻结账户，保存记录，打 110；接到 96110 来电一定要接。'
      },
      e_x: {
        grade: 'X', title: '等一个不会来的退款', stamp: 'caught',
        text: '「系统会自动退回」是整场骗局里最贵的一句话，它只要你不报警、不联系银行，钱就有足够时间被转走。第二天头像变灰、消息发不出去，你等的是一个已经不存在的号。现在立刻挂失卡、打 110，越早报警，追回的可能越大。'
      }
    },

    reveal: {
      truth: '他不用盗你的号——他要的就是你自己点开共享。',
      crew: [
        ['踩点号', '先进真正的班级群，把辅导员头像、昵称、说话语气抄下来'],
        ['冒牌号', '用同一张头像重新入群，专挑人多的时候发「@所有人」'],
        ['托儿', '带头回复「收到」，让真同学跟着一起跟风'],
        ['话务员', '开着共享盯屏幕，专等验证码滚动出来的那几秒']
      ],
      boom: {
        title: '两个「辅导员 王老师」',
        render: function (host, run) {
          var head = RJ.el('div', { class: 'boom-two' });
          function card(kind, title, lines) {
            return RJ.el('div', { class: 'boom-two-card ' + kind }, [
              RJ.el('div', { class: 'boom-two-av' }, [
                RJ.el('span', { class: 'btav', text: '👩‍🏫', role: 'img', 'aria-label': '辅导员 王老师' }),
                RJ.el('div', { class: 'btname', text: '辅导员 王老师' })
              ]),
              RJ.el('div', { class: 'boom-two-h', text: title })
            ].concat(lines.map(function (t) { return RJ.el('div', { class: 'boom-two-l', text: t }); })));
          }
          head.appendChild(card('fake', '14:02 进群的那个', [
            '头像：👩‍🏫　昵称：辅导员 王老师（一模一样）',
            '入群时间：今天 14:02（进群第一句就是 @所有人）',
            '说话方式：今晚必须全部核完 / 有问题的私聊我',
            '做的事：要你下载云会议、开屏幕共享、念验证码'
          ]));
          head.appendChild(card('real', '09:30 发通知的那个', [
            '头像：👩‍🏫　昵称：辅导员 王老师（一模一样）',
            '入群时间：8 月 28 日 09:10（群主）',
            '说话方式：明早八点年级会，别迟到',
            '做的事：第二天在群里说「我从没要求过共享屏幕」'
          ]));
          host.appendChild(head);
          host.appendChild(RJ.el('p', { class: 'boom-note', text: '头像、昵称、连语气都能抄；抄不动的是入群时间——14:02 与 09:30 之间，差着一个已经发过的通知。' }));

          var board = RJ.el('div', { class: 'xs-grow' });
          board.appendChild(RJ.el('div', { class: 'xs-grow-t', text: '这群人后来怎么样了（模拟数据）' }));
          var rows = [
            ['14:02 进群的「辅导员」', '第二天退群，头像变灰'],
            ['带头回复「收到」的 6 个号', '全部是同一批托儿，现在都不在群里了'],
            ['跟着回复的真同学', '有 3 个人的零钱包当晚被划走'],
            ['群主（真辅导员）', '报了保卫处，全班收到第二条通知']
          ];
          var box = RJ.el('div', { class: 'xs-grow' });
          rows.forEach(function (r, i) {
            var row = RJ.el('div', { class: 'xs-row', style: { opacity: 0 } }, [
              RJ.el('span', { text: r[0] }),
              RJ.el('b', { text: r[1] })
            ]);
            box.appendChild(row);
            (function (row, i) {
              setTimeout(function () {
                row.style.transition = RJ.reduceMotion() ? 'none' : 'opacity .35s';
                row.style.opacity = 1;
              }, RJ.reduceMotion() ? 0 : 260 * (i + 1));
            })(row, i);
          });
          board.appendChild(box);
          host.appendChild(board);

          var cap = RJ.el('p', { class: 'boom-note', text: (run && run.loss > 0)
            ? '这一局你的损失：' + RJ.yuan(run.loss) + '（模拟数据）——钱不是你转的，是你把屏幕递了过去。'
            : '这一局你一分钱都没丢。但那个 14:02 的号，还在别的学校的班级群里。' });
          host.appendChild(cap);
        }
      },
      tips: [
        '①点开头像，看他的入群时间',
        '②学籍核对不会让你开屏幕共享',
        '③核实只打通讯录里存的号码',
        '④共享已开：关机、拔卡、断网'
      ],
      after: [
        '①立即挂失银行卡、冻结账户',
        '②保存聊天与转账记录，拨打 110',
        '③在真实班级群里提醒同学：有人冒充导员'
      ],
      sources: ['S17', 'S14'],
      laws: ['L1']
    },

    widgets: { membercard: membercard },
    widgetSelf: { membercard: 1 }        // 组件自己在 w-foot 里渲染选项，引擎不能再渲染一遍
  });
})();
