/* 模块 gouwu · 闲趣二手卖货（你是卖家 → 假客服 → 屏幕共享）—— 规格见 方案/30 §3.2（承 方案/12）
 * 该模块只做一件事：调用 RJ.register(def)。
 */
(function () {
  'use strict';
/* 节点级核实覆盖（30 §1.3/§2.3）：正确渠道永远给真话，只有走错渠道才会被骗 */
var V = {
  search: { ok: false, next: 'n4', text: '搜索结果第一条是广告位，标着“闲趣二手官方客服”。你拨过去，对方说“您的订单确实异常，我们帮您开通担保”。' },
  app: { ok: true, end: 'e_a', text: '你在官方 App 里查这笔订单：状态是“待付款”，对方根本没付过钱。' },
  given: { ok: false, text: '你按对方给的号码拨过去，对方说“核实无误，请配合客服开通担保”。' },
  group: { ok: false, text: '群里几十个人都在说“我刚解冻成功了”，还发了到账截图。' },
  video: { ok: false, text: '对方说摄像头坏了，发来一段录好的短视频。' }
};
RJ.register({
  id: 'gouwu',
  title: '闲趣二手卖货',
  type: '虚假购物服务',
  role: 'victim',
  app: { name: '闲趣二手', icon: '🎧', color: '#ffd60a' },
  inbox: { time: '10:20', app: '闲趣二手', from: '买家 · 小林', text: '你那副耳机我拍下了，平台提示你的店铺没开通担保，钱冻住了。' },
  inbox2: { time: '10:05', app: '闲趣二手', from: '买家 · 小林', text: '你那套考研教材我拍下了，平台提示你的店铺没开通担保，钱冻住了。' },
  lockNotice: { app: '闲趣二手', title: '【闲趣二手】', body: '你的旧耳机有买家拍下了，快去看看吧' },
  cast: {
    s: { name: '买家 · 小林', avatar: '🧑' },
    k: { name: '闲趣二手 · 客服', avatar: '🎧' }
  },
  start: 'n1',

  /* 40 §3 第 2 变体：这一版卖的是二手教材（人物、金额、红旗位置与走向与变体 0 完全一致） */
  variant: {
    n1: {
      say: [
        ['sys', '「闲趣二手」收到一条新私信'],
        ['s', '{name}你好，你挂的那套考研教材还在吗？一整套带真题，价格挺合适的'],
        ['s', '我就在平台里跟你聊，不加好友、也不点外面的链接，你放心'],
        ['s', '我这就拍下，你确认一下书还在就行']
      ]
    },
    n2: {
      say: [
        ['sys', '对方拍下了「考研专业课教材 · 一套」，订单已生成'],
        ['s', '我这边付了 ¥1,280，平台说钱先冻在中转账户里，要你的店铺开通担保才会放款'],
        ['s', '', { img: '🖼️', caption: '对方发来的“平台通知”截图：店铺担保未开通，资金已冻结' }],
        ['s', '你查一下，把担保开通了，钱立马就到你账上'],
        ['s', '不是催你，就是怕时间长了订单自动关了，两个人都麻烦']
      ]
    }
  },

  nodes: {
    n1: {
      stage: 'lure', scene: 'chat', app: '闲趣二手',
      say: [
        ['sys', '「闲趣二手」收到一条新私信'],
        ['s', '{name}你好，你挂的那副旧耳机还在吗？价格挺合适的'],
        ['s', '我就在平台里跟你聊，不加好友、也不点外面的链接，你放心'],
        ['s', '我这就拍下，你确认一下有货就行']
      ],
      note: '他先把自己打扮成“最守规矩的买家”，让这一单看起来和你平时卖的每一单都一样。',
      choices: [
        { text: '回复：还在，你拍吧', next: 'n2', hooks: ['greed'] },
        { text: '只按平台流程走，别的免谈', end: 'e_s', safe: true }
      ]
    },

    n2: {
      stage: 'trust', scene: 'chat', app: '闲趣二手',
      say: [
        ['sys', '对方拍下了「旧耳机 · 一副」，订单已生成'],
        ['s', '我这边付了 ¥1,280，平台说钱先冻在中转账户里，要你的店铺开通担保才会放款'],
        ['s', '', { img: '🖼️', caption: '对方发来的“平台通知”截图：您的店铺未开通担保，资金已冻结' }],
        ['s', '你查一下，把担保开通了，钱立马就到你账上'],
        ['s', '不是催你，就是怕时间长了订单自动关了，两个人都麻烦']
      ],
      note: '截图是做出来的，真平台的系统通知只在 App 里出现——他递过来的是一张图。',
      flag: '“平台通知”是一张转发来的截图，不是 App 里的系统消息',
      verify: V,
      choices: [
        { text: '那你等我问下客服', next: 'n3', hooks: ['urgency'] },
        { text: '打开官方 App 查订单', end: 'e_a', safe: true }
      ]
    },

    n3: {
      stage: 'hook', scene: 'chat', app: '闲趣二手',
      say: [
        ['s', '我刚问了下平台那边的客服，说这种担保没开通的店铺，钱会一直冻着'],
        ['s', '客服让你自己搜一下平台官方电话打过去，报订单号就行'],
        ['s', '你搜个电话问问？我这边一直等着呢'],
        ['s', '他们说十七点之前不处理，订单就自动取消了']
      ],
      note: '“你自己去搜客服电话”是整局最关键的一步：真平台的入口就在 App 里，不需要出去搜。',
      flag: '“资金冻结”要卖家自己去搜电话处理——真平台不会这样要求',
      verify: V,
      choices: [
        { text: '搜个平台客服电话', next: 'n4', hooks: ['urgency'] },
        { text: '回官方 App 里查订单', end: 'e_a', safe: true }
      ]
    },

    n4: {
      stage: 'harvest', scene: 'app', app: '闲趣二手',
      say: [
        ['k', '您好，我是闲趣二手官方客服，工号 7315，您的店铺担保权限没有开通'],
        ['k', '开通担保只要交 ¥1,280 授权金，交完马上解冻，授权金和货款一起退回'],
        ['k', '点下面的开通页付款，一分钟就好']
      ],
      note: '这个“开通页”和真平台长得一模一样，只有收款的账户是他自己的。',
      widget: ['pay', { amount: 1280, to: '闲趣二手 · 担保开通', title: '担保开通 · 授权金' }],
      choices: [
        { text: '确认支付 ¥1,280', next: 'n5', money: -1280, hooks: ['sunk'] },
        { text: '先不交，我再查一下', end: 'e_s', safe: true }
      ]
    },

    n5: {
      stage: 'lock', scene: 'chat',
      say: [
        ['sys', '担保页提示：您的账户未开通担保权限，交易资金已冻结'],
        ['k', '您好，我是闲趣二手客服，工号 7315，负责处理您店铺的冻结资金'],
        ['k', '系统显示您的担保账户没有开通，¥1,280 暂时冻结在中转账户里'],
        ['k', '您只需交 ¥2,560 保证金激活担保账户，激活后保证金和冻结资金一起全额退回'],
        ['s', '我这边还等着收货呢，你快弄一下吧，不然我就申请退款了']
      ],
      note: '先用“资金冻结”制造紧张，再用“全额退回”让你觉得只是走个流程。',
      flag: '这个“客服”是你自己搜出来的号码，不是 App 里的官方入口',
      pressure: true, pressureText: '您还在吗？买家那边一直在催我们。',
      choices: [
        { text: '交 ¥2,560 保证金', next: 'n6', hooks: ['sunk'], money: -2560 },
        { text: '我要申请退款', next: 'n7' },
        { text: '打 110 问一下', end: 'e_b', safe: true }
      ]
    },

    n6: {
      stage: 'lock', scene: 'chat',
      say: [
        ['k', '保证金 ¥2,560 已收到，正在为您激活担保账户'],
        ['k', '不好意思，您刚才的操作有误，账户资金被系统锁定了'],
        ['k', '您先别急，我已经把您的情况提交给退款专员，稍后专员会打电话指导您'],
        ['k', '电话是官方专线，请注意接听，不要漏接']
      ],
      note: '把你从打字聊天换到电话里，是为了有人全程盯着你，随时压住你的疑问。',
      interrupt: { app: '校友圈', from: '辅导员 · 王老师', text: '明早八点年级会，别迟到' },
      choices: [
        { text: '好的，我等他来电', next: 'n7' },
        { text: '停止操作，打 110', end: 'e_b', safe: true }
      ]
    },

    n7: {
      stage: 'trust', scene: 'call', caller: '闲趣二手客服 400****',
      say: [
        ['k', '您好，我是闲趣二手客服专员，工号 7315，现在为您办理退款'],
        ['k', '您的 ¥1,280 和保证金 ¥2,560 都在系统里，需要专员远程协助才能操作'],
        ['k', '流程有点复杂，您先下载一个「云会议」，我们通过屏幕共享一步一步教您'],
        ['k', '这也是为了保障您的资金安全，全程录音，请您配合']
      ],
      note: '让“客服”进到你的手机屏幕里，等于把银行短信和验证码一起交到对方手上。',
      choices: [
        { text: '好，我按你说的做', next: 'n8', hooks: ['authority', 'fear'] },
        { text: '挂断，找官方客服', end: 'e_b', safe: true }
      ]
    },

    n8: {
      stage: 'harvest', scene: 'app', app: '云会议',
      say: [
        ['k', '安装包我发你平台聊天里了，是官方合作的应用，放心下载'],
        ['k', '装好之后用手机号登录一下就行，不用注册'],
        ['k', '会议室号我稍后发您，只有您一个人，很安全']
      ],
      note: '让你从非官方渠道下载软件，是为了先把你带进他控制的那个界面。',
      widget: ['install', { app: '云会议', size: '9.8MB' }],
      choices: [
        { text: '先装上再说', next: 'n8b' },
        { text: '不装这个', end: 'e_b', safe: true }
      ]
    },

    n8b: {
      stage: 'harvest', scene: 'app', app: '云会议',
      say: [
        ['k', '点一下「开始共享」，我来教您操作'],
        ['k', '屏幕上出现什么，您就念给我听，我看着您的屏幕指导'],
        ['k', '您别担心，我们看不到您的隐私，只是帮您操作退款']
      ],
      note: '共享的不是一个窗口，是你整块屏幕：短信、验证码、聊天记录都在上面。',
      widget: ['share', { app: '云会议' }],
      choices: [
        { text: '点一下开始共享', next: 'n9' },
        { text: '不共享屏幕', end: 'e_b', safe: true }
      ]
    },

    n9: {
      stage: 'harvest', scene: 'sms', from: '106****',
      say: [
        ['sys', '【星城银行】您尾号 2741 的账户正在支付 ¥8,000，验证码 8****2，请勿泄露给任何人'],
        ['k', '看到那条短信了吗？那是系统核验用的验证码'],
        ['k', '您念给我核对一下，核对完退款马上打到您的零钱包'],
        ['k', '放心念，我们全程录音，没人敢动您的钱']
      ],
      note: '共享屏幕时对方能看见你手机上弹出的每一条短信，验证码一出口钱就走了。',
      flag: '屏幕共享时，对方看得见你的整个屏幕，包括验证码',
      choices: [
        { text: '把验证码念给他', next: 'n10', hooks: ['authority'], money: -8000 },
        { text: '关共享、关机拔卡', end: 'e_b', safe: true, shareOff: true }
      ]
    },

    n10: {
      stage: 'lock', scene: 'sms', from: '星城银行',
      say: [
        ['sys', '【星城银行】您尾号 2741 的账户支出 ¥8,000'],
        ['sys', '【星城银行】您尾号 2741 的账户支出 ¥8,000'],
        ['k', '刚才那两笔是误扣，是系统操作失误，您千万别慌'],
        ['k', '您再按我说的操作一次，两笔钱会一起退回来，保证金一起退'],
        ['k', '就差最后一步了，现在停下来的话，前面的钱都退不回来了']
      ],
      note: '他们知道你舍不得已经亏掉的钱，于是又给你一次“马上全部退回”的机会。',
      choices: [
        { text: '再操作一次试试', end: 'e_x', hooks: ['sunk'], money: -8000 },
        { text: '关机拔卡，打 110', end: 'e_c', safe: true, shareOff: true }
      ]
    }
  },

  endings: {
    e_s: {
      grade: 'S', title: '只在平台交易', stamp: 'safe',
      text: '你坚持只按平台里的正式流程走：钱没进你的账户，你就不发货；截图、来电、“客服”说的话一律不算数。平台担保是买卖双方之间唯一的中间人，一个卖家最该守住的也正是这一步——不走到平台外面去，也不把“冻结”这种话当真，所以这一局你一分钱都没损失。'
    },
    e_a: {
      grade: 'A', title: '识破伪造通知', stamp: 'safe',
      text: '真平台的订单状态只在 App 里看得到。你打开官方 App 一查，这笔订单还停在“待付款”——对方根本没付过钱，那张“平台通知”截图和所谓的“冻结”都是做给你看的。你在掏钱之前多看了一眼，后面的假客服、保证金、屏幕共享就都没能开始。'
    },
    e_b: {
      grade: 'B', title: '掐断共享', stamp: 'stop',
      text: '你停在了最关键的一步。屏幕共享已经打开时，先尝试关闭；如果没法操作手机，第一时间关机、拔卡、断网。然后用另一台设备联系星城银行冻结账户，保存聊天记录和转账记录，拨打 110 报警。'
    },
    e_c: {
      grade: 'C', title: '被盗刷后报警', stamp: 'caught',
      text: '钱不是你转出去的，是你把屏幕共享给别人之后被划走的。这不怪你，整套流程就是为“想把钱要回来的人”设计的。现在立刻关机、拔卡、断网，联系星城银行冻结账户，然后拨打 110 报警；接到 96110 来电一定要接。'
    },
    e_x: {
      grade: 'X', title: '越退越多', stamp: 'caught',
      text: '“退款”从来都不需要你先操作转账，更不需要你再配合验证一次。他们知道你舍不得已经亏掉的那笔钱，于是又给了你一次“马上全部退回”的机会。现在唯一正确的做法是：停止一切操作，关机、拔卡、断网，联系银行冻结账户，拨打 110 报警。'
    }
  },

  reveal: {
    truth: '你共享出去的不是屏幕，是你的手机。',
    crew: [
      ['买家号', '在二手平台挑正在卖东西的人，用“钱冻结了”把卖家引向假客服'],
      ['假客服', '你搜出来的那个“官方客服”，其实是广告位上的号码'],
      ['“客服”话务员', '用“解冻、保证金、退款”把你从打字拖进电话'],
      ['操作手', '盯着你共享过来的屏幕，你念一次验证码他划走一次钱']
    ],
    boom: {
      title: '屏幕的另一边',
      render: function (host, run) {
        ticketBoom(host, run);
      }
    },
    tips: [
      '①真平台的系统通知只在 App 里出现',
      '②客服电话去 App 里找，别自己搜',
      '③官方客服不会让你下载会议软件共享屏幕',
      '④验证码就是钱，谁要都不给',
      '⑤退款不需要你先付钱'
    ],
    after: [
      '①先尝试关闭屏幕共享',
      '②没法操作就立即关机、拔卡、断网',
      '③联系银行冻结账户',
      '④拨打 110 报警'
    ],
    sources: ['S1', 'S13', 'S2', 'S5'],
    laws: ['L1']
  }
});

/* 爆点「屏幕的另一边」：左边是你的手机，右边是骗子的电脑（分屏回放 n8–n10） */
function ticketBoom(host, run) {
  RJ.clear(host);
  var path = (run && run.path) || [];
  var shared = path.indexOf('n8b') >= 0;
  var codeOut = path.indexOf('n10') >= 0;
  var again = !!(run && run.ending === 'e_x');
  var loss = (run && run.loss) ? run.loss : 0;
  var stolen = (codeOut ? 8000 : 0) + (again ? 8000 : 0);
  var still = RJ.reduceMotion();
  var timers = [];

  host.appendChild(RJ.el('p', {
    class: 'boom-note',
    text: '左边是你的手机，右边是他的电脑。把这两块屏幕连起来，只需要你点一次「开始共享」。'
  }));

  /* ---------- 左：你的手机 ---------- */
  var code = RJ.el('span', {
    class: 'mono',
    style: { position: 'relative', padding: '1px 5px', borderRadius: '6px', background: '#ffe9a8', color: '#3b2f05' },
    text: '8****2'
  });
  var ring = RJ.el('span', { style: {
    position: 'absolute', left: '-9px', top: '-8px', right: '-9px', bottom: '-8px',
    border: '2.5px solid #e5484d', borderRadius: '999px', opacity: '0',
    transform: 'rotate(-5deg) scale(.7)',
    transition: still ? 'none' : 'opacity .4s ease, transform .4s ease',
    pointerEvents: 'none'
  } });
  code.appendChild(ring);

  var phone = RJ.el('div', { style: {
    width: '186px', flex: '0 0 auto', border: '7px solid #1c2534', borderRadius: '26px',
    background: '#f7f9fc', padding: '10px 9px', boxShadow: '0 12px 26px rgba(0,0,0,.4)'
  } }, [
    RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8494ab', marginBottom: '7px' } }, [
      RJ.el('span', { text: '09:41' }),
      RJ.el('span', { text: '📶 🔋 76%' })
    ]),
    RJ.el('div', { style: { background: '#eef2f8', borderRadius: '12px', padding: '8px', fontSize: '11px', lineHeight: '1.7', color: '#42536b' } }, [
      RJ.el('div', { style: { fontWeight: '700', color: '#26364d' }, text: '星城银行' }),
      RJ.el('span', { text: '您尾号 2741 的账户正在支付 ¥8,000' }),
      RJ.el('div', {}, [
        RJ.el('span', { text: '验证码 ' }),
        code
      ])
    ]),
    RJ.el('div', { style: { marginTop: '9px', fontSize: '11px', color: '#42536b' } }, [
      RJ.el('span', { text: '零钱包 ' }),
      RJ.el('b', { class: 'mono', text: RJ.yuan(RJ.wallet().left) })
    ]),
    RJ.el('div', { style: { fontSize: '10px', color: '#9aa7ba', marginTop: '2px' }, text: '以上金额均为模拟数据' }),
    RJ.el('div', { style: { marginTop: '8px', textAlign: 'center', fontSize: '10px', color: '#e5484d' }, text: '● 这块屏幕正在被共享' })
  ]);

  /* ---------- 右：他的电脑 ---------- */
  var cursor = RJ.el('div', { style: {
    position: 'absolute', left: '10%', top: '72%', fontSize: '20px', pointerEvents: 'none',
    transition: still ? 'none' : 'left 1s ease, top 1s ease'
  }, text: '🖱️' });

  var feed = RJ.el('div', { style: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '82px' } });

  var pc = RJ.el('div', { style: { width: '216px', flex: '0 0 auto' } }, [
    RJ.el('div', { style: {
      position: 'relative', height: '172px', border: '7px solid #2b3446', borderRadius: '12px',
      background: '#0c1420', padding: '7px', overflow: 'hidden'
    } }, [
      RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8fa6c8', marginBottom: '6px' } }, [
        RJ.el('span', { text: '云会议 · 正在观看对方屏幕' }),
        RJ.el('span', { style: { color: '#e5484d' }, text: '● REC' })
      ]),
      RJ.el('div', { style: { background: '#e8eef8', borderRadius: '8px', padding: '7px', fontSize: '10px', lineHeight: '1.7', color: '#33455e' } }, [
        RJ.el('div', { style: { fontWeight: '700' }, text: '星城银行' }),
        RJ.el('div', {}, [
          RJ.el('span', { text: '验证码 ' }),
          RJ.el('span', { class: 'mono', style: { background: '#ffe9a8', padding: '0 3px', borderRadius: '3px' }, text: '8****2' })
        ])
      ]),
      cursor
    ]),
    RJ.el('div', { style: { margin: '0 auto', width: '52px', height: '11px', background: '#2b3446', borderRadius: '0 0 8px 8px' } }),
    feed
  ]);

  host.appendChild(RJ.el('div', {
    style: { display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '10px' }
  }, [phone, pc]));

  var sayEl = RJ.el('div', { style: { marginTop: '10px', fontSize: '12.5px', color: '#cdd7e5', minHeight: '20px' } });
  host.appendChild(sayEl);

  host.appendChild(RJ.el('div', { class: 'kpi-row', style: { marginTop: '12px' } }, [
    RJ.el('div', { class: 'kpi' }, [
      RJ.el('div', { class: 'kpi-big ' + (stolen > 0 ? 'bad' : 'ok'), text: RJ.yuan(stolen) }),
      RJ.el('div', { class: 'kpi-label', text: '他隔着一块屏幕划走的（模拟数据）' })
    ]),
    RJ.el('div', { class: 'kpi' }, [
      RJ.el('div', { class: 'kpi-big', text: RJ.yuan(loss) }),
      RJ.el('div', { class: 'kpi-label', text: '本局虚拟损失合计（模拟数据）' })
    ])
  ]));

  var replay = RJ.el('button', { class: 'btn btn-primary', text: '↻ 重放这几秒', style: { marginTop: '10px' } });
  replay.addEventListener('click', function () { play(); });
  host.appendChild(replay);

  function focusCode() {
    ring.style.opacity = '1';
    ring.style.transform = 'rotate(-5deg) scale(1)';
    cursor.style.left = '44%';
    cursor.style.top = '26%';
  }

  function addFeed(text, color) {
    var row = RJ.el('div', { style: {
      display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: color || '#cdd7e5',
      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: '8px', padding: '4px 8px', opacity: '0'
    } }, [
      RJ.el('span', { text: '›' }),
      RJ.el('span', { text: text })
    ]);
    feed.appendChild(row);
    setTimeout(function () {
      row.style.transition = 'opacity .35s';
      row.style.opacity = '1';
    }, still ? 0 : 30);
  }

  var beats;
  if (!shared) {
    beats = [
      { at: 200, fn: function () {
        sayEl.textContent = '这一局你没有把屏幕共享出去 —— 他的电脑上，什么也看不到。';
        addFeed('屏幕未共享', '#6fe3cf');
      } }
    ];
  } else if (!codeOut) {
    beats = [
      { at: 200, fn: function () {
        focusCode();
        sayEl.textContent = '他先看到的，是你屏幕上弹出的那条短信。';
      } },
      { at: 1100, fn: function () {
        addFeed('👀 验证码短信已被看到', '#ffd88a');
        sayEl.textContent = '共享屏幕时，对方看得见你手机上的一切，包括弹出的验证码。';
      } },
      { at: 2100, fn: function () {
        addFeed('⚠️ 验证码没有念出去', '#6fe3cf');
        sayEl.textContent = '你没有念、直接断网关机，所以他只能看，不能动。';
      } },
      { at: 3000, fn: function () {
        sayEl.textContent = '这就是处置屏幕共享的第一步：关共享、关机、拔卡、断网。';
      } }
    ];
  } else {
    beats = [
      { at: 200, fn: function () {
        focusCode();
        sayEl.textContent = '他先看到的，是你屏幕上弹出的那条短信。';
      } },
      { at: 1100, fn: function () {
        addFeed('✅ 验证码 8****2 已获取', '#e5484d');
        sayEl.textContent = '你念出来的每一个数字，他在自己屏幕上先看到了。';
      } },
      { at: 2000, fn: function () {
        addFeed('🔓 正在登录星城银行…', '#ffd88a');
      } },
      { at: 2900, fn: function () {
        addFeed('💸 转出 ¥8,000（模拟数据）', '#e5484d');
      } },
      { at: 3800, fn: function () {
        if (again) {
          addFeed('💸 又转出 ¥8,000（模拟数据）', '#e5484d');
          sayEl.textContent = '你越想把钱要回来，他手里的键盘就动得越快。';
        } else {
          sayEl.textContent = '他不需要你转账，只需要你在屏幕前面坐着。';
        }
      } },
      { at: 4700, fn: function () {
        sayEl.textContent = '整个过程里，你没有转错一笔钱 —— 你只是把屏幕借给了他。';
      } }
    ];
  }

  function play() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    ring.style.opacity = '0';
    ring.style.transform = 'rotate(-5deg) scale(.7)';
    cursor.style.left = '10%';
    cursor.style.top = '72%';
    RJ.clear(feed);
    sayEl.textContent = '';
    beats.forEach(function (b) {
      timers.push(setTimeout(b.fn, still ? 0 : b.at));
    });
  }

  play();
}
})();
