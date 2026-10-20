/* 模块 bangxin · 看店兼职（出借银行卡 / 帮信）—— 你是帮凶，规格见 方案/30 §3.4 + 方案/14
 * 全站唯一 role: 'accomplice' 的模块：玩家不是受害者，而是被利用的工具人。
 * 来源 S11：用本人身份办营业执照、对公账户和收款机，替团伙接收赃款。
 * 该模块只做一件事：调用 RJ.register(def)。
 */
(function () {
  'use strict';
RJ.register({
  id: 'bangxin',
  title: '学长的兼职',
  type: '出借银行卡（帮信）',
  role: 'accomplice',
  app: { name: '校友圈', icon: '🎓', color: '#4361ee' },
  lockNotice: { app: '校友圈', title: '【校友圈】', body: '学长阿伟：有个看店的兼职，月薪八千，来不来？' },
  inbox: { time: '14:05', app: '校友圈', from: '学长阿伟', text: '学弟，给你找了个看店的活，月薪八千，干不干？' },
  inbox2: { time: '13:20', app: '校友圈', from: '学长阿伟', text: '学弟，我朋友的水果店缺个守店的，月薪八千，去不去？' },
  cast: {
    w: { name: '学长阿伟', avatar: '😎' },
    b: { name: '店主', avatar: '🕶️' },
    p: { name: '派出所民警', avatar: '👮' }
  },
  start: 'n1',

  /* 40 §3 第 2 变体：只换开场（inbox 文案 + n1/n2 的 say），借身份办证的红旗位置不动 */
  variant: {
    n1: {
      say: [
        ['w', '{name}，这学期课不多吧？我给你找了个白天看店的活'],
        ['w', '我一个熟人开水果店，缺个守店的，月薪 ¥8,000'],
        ['w', '就是看店、收钱、对对账，比在奶茶店站一天轻松'],
        ['w', '他要找个靠谱的同学，我第一个就想到你']
      ]
    },
    n2: {
      say: [
        ['sys', '「店主」加入了聊天'],
        ['b', '{school}的同学是吧，阿伟跟我提过你，说你人实在'],
        ['b', '我这店要接单位的团购单，走对账报销，得有个对公账户收钱'],
        ['b', '我名下那个账户还在限额，一时半会儿办不了'],
        ['b', '想借你的身份办一套：营业执照、对公账户、收款机，账走店里'],
        ['w', '就是挂个名，钱不进你口袋，你按月拿工资就行']
      ]
    }
  },

  nodes: {
    n1: {
      stage: 'lure', scene: 'chat', app: '校友圈',
      say: [
        ['w', '{name}，课不多吧？我给你找了个看店的活'],
        ['w', '我一个熟人在这边开烟酒店，缺个白天看店的，月薪 ¥8,000'],
        ['w', '就是守着店、收收钱、对对账，比在奶茶店站一天轻松'],
        ['w', '他要找个靠谱的同学，我第一个就想到你']
      ],
      note: '先不碰“钱从哪来”，用一份正常的看店工作开场：不出钱、不押金，让你觉得只是问问。',
      flag: '本地店员月薪多在 ¥3,000–4,000，这份“轻松看店”开出 ¥8,000（模拟数据）',
      verify: {
        orig: { text: '你拨通讯录里阿伟原来的号，是他本人接的。他说这活他也在做、工资照发，可店主到底姓什么、店在哪，他也说不上来。', ok: true },
        app: { text: '你打开校友圈的账号主页：阿伟是个人号，不是学校的官方号，主页里也没有一条和这家店有关的消息。', ok: true },
        ask: { text: '你把这事说给家里听，家里人只问了三句：店在哪、老板是谁、工资谁发——你一句都答不上来。', ok: true },
        police: { text: '你打 110 问了一下：只要用你本人的名字去办证、开户，账上出的问题找的都是你，别掺和。', ok: true },
        search: { text: '你搜“看店兼职 月薪八千”，第一条是广告位的兼职中介：“本地门店直招，交 ¥200 介绍费当天上岗”。', ok: false }
      },
      choices: [
        { text: '工资怎么这么高？', next: 'n2', hooks: ['greed'] },
        { text: '我自己找活干', end: 'e_s', safe: true }
      ]
    },

    n2: {
      stage: 'trust', scene: 'chat',
      say: [
        ['sys', '「店主」加入了聊天'],
        ['b', '{school}的同学是吧，阿伟跟我说过你，人挺实在'],
        ['b', '店我准备再开一家，走团购和报销，得有个对公账户收钱'],
        ['b', '我名下有笔老账没结清，账户还在限额，暂时办不了'],
        ['b', '想用你的身份办一套：营业执照、对公账户、收款机，账走店里'],
        ['w', '就是挂个名，钱不进你口袋，你按月拿工资就行']
      ],
      note: '把“借账户”说成“帮忙挂个名”，真正的目标是借你的身份过银行和平台的核验。',
      flag: '要用你本人的身份办营业执照、对公账户和收款机——账户上写的是你的名字',
      verify: {
        orig: { text: '你给阿伟打电话，他说的还是那套：钱不过你的手，他干了半年工资一分没少——可他也说不清店主是谁。', ok: true },
        ask: { text: '你把“借身份办执照和对公账户”原样说给辅导员，他说这种事从来不让学生去办，让你别掺和。', ok: true },
        police: { text: '你去派出所当面问了：账户写谁的名字，进来的钱就算在谁头上，出了事第一个找的也是他。', ok: true },
        given: { text: '你打店主给的“公司固话”，接电话的人说“岗位真实，正常办就行，别多想”。', ok: false },
        search: { text: '你搜“帮人挂名 办营业执照”，第一条是广告位的中介：“正规流程、当天出证”，一直催你加他私聊。', ok: false }
      },
      choices: [
        { text: '那我试试', next: 'n3', hooks: ['greed', 'emotion'] },
        { text: '我问问辅导员', end: 'e_a', safe: true }
      ]
    },

    n3: {
      stage: 'hook', scene: 'chat', app: '校友圈',
      say: [
        ['b', '我把要办的东西列一下，跑两趟就下来了'],
        ['b', '身份证、手机号，再刷个脸做实名核验，剩下的我去跑'],
        ['b', '执照下来当天就给你结第一笔工资，月薪按说好的来']
      ],
      note: '办执照、开对公账户只是第一步，要“刷脸”才是关键：用你的身份替他们过实名核验。',
      flag: '提供实名核验帮助是《反电信网络诈骗法》明令禁止的（L5）',
      widget: ['form', {
        title: '办证登记 · 实名信息',
        fields: [
          { label: '开户人', value: '本人（身份证已核验）' },
          { label: '手机号', value: '171****0000' },
          { label: '刷脸核验', value: '人脸核验 · 待完成' }
        ]
      }],
      verify: {
        app: { text: '你在星城银行 App 里看到：新开的对公账户开户人写的是你的名字，预留手机号尾号 6321 不是你的。', ok: true },
        police: { text: '接警员说：把身份证和刷脸借给别人过实名核验，本身就在法律禁止之列，赶紧停下。', ok: true },
        ask: { text: '你把“刷脸认证”说给辅导员听，他说：人脸和证件一旦借出去，就不再是你的了。', ok: true },
        given: { text: '你打店主留的“业务电话”，对方说“都是常规流程，办完就给你结工资”，一直在催。', ok: false }
      },
      choices: [
        { text: '把资料交过去', next: 'n4' },
        { text: '这事我不掺和', end: 'e_a', safe: true }
      ]
    },

    n4: {
      stage: 'harvest', scene: 'app', app: '星城银行', money: 66,
      pressure: true, pressureText: '钱都到账了，你先按我说的转出去，别让钱在账上过夜。',
      say: [
        ['b', '执照和收款机都下来了，对公账户今天开始收单'],
        ['b', '你在店里盯着，钱一到账就转给供货商，别在账上停'],
        ['b', '工资一分不少，手续费也照结给你']
      ],
      note: '被骗的人把钱打到你名下的对公账户，再转出去——你成了赃款链条上“看着干净”的那一环。',
      widget: ['bank', {
        feeRate: 0.01,
        items: [
          { from: '王**', amt: 1000, memo: '点点赚任务充值' },
          { from: '李**', amt: 2560, memo: '票多多担保保证金' },
          { from: '张**', amt: 3000, memo: '' }
        ]
      }],
      choices: [
        { text: '继续', next: 'n5' },
        { text: '不转了，停手', end: 'e_b', safe: true }
      ]
    },

    n5: {
      stage: 'hook', scene: 'chat', app: '校友圈',
      interrupt: { app: '校友圈', from: '室友小周', text: '晚上帮我带份饭，钱回来转你' },
      say: [
        ['b', '你这边做得干净，店里还想再招两个看店的'],
        ['b', '你介绍一个同学来，账户办下来我给你 ¥500 介绍费'],
        ['w', '就是喊个人来一起看店，你现在不就挺好的嘛']
      ],
      note: '从“用你的账户”升级成“用你的人”：介绍费让你变成他们的招募渠道。',
      flag: '你想跟同学说清楚这份工作，才发现你只见过店主一个头像：他姓什么、店在哪条街，你一次都没问过',
      choices: [
        { text: '拉室友', next: 'n6', hooks: ['greed'], set: 'recruited' },
        { text: '不干了', end: 'e_b', safe: true }
      ]
    },

    n6: {
      stage: 'harvest', scene: 'app', app: '星城银行', money: 130,
      pressure: true, pressureText: '这两天金额大，你转快一点，别一笔笔拖。',
      say: [
        ['b', '这两天进来的钱比之前大得多，你照顺序转就行，别多问'],
        ['b', '老规矩，到一笔转一笔，工资和手续费一起结'],
        ['w', '你看，这活一个月顶我两份工']
      ],
      note: '金额变大不是生意变好，是被骗的人越来越多、单笔越来越大，而你名下的账户全记着。',
      widget: ['bank', {
        feeRate: 0.01,
        items: [
          { from: '陈**', amt: 6000, memo: '金融监管中心核验' },
          { from: '周**', amt: 2000, memo: '急用，晚上还你' },
          { from: '赵**', amt: 5000, memo: '金沙娱乐充值' }
        ]
      }],
      choices: [
        { text: '继续', next: 'n7' },
        { text: '停手，不转了', end: 'e_b', safe: true }
      ]
    },

    n7: {
      stage: 'lock', scene: 'sms', from: '星城银行',
      say: [
        ['sys', '【星城银行】您尾号 2741 的账户因异常交易已被冻结，请携带本人证件到网点核实。'],
        ['b', '别慌，就是银行例行风控而已'],
        ['b', '明天去柜台就说是你自己的钱，别提帮别人收账'],
        ['b', '说多了反而麻烦，记住了']
      ],
      note: '教你撒谎，是把你从“被利用的人”变成“帮他掩饰赃款的人”。',
      flag: '按上线要求撒谎、帮忙掩饰，这是掩饰、隐瞒犯罪所得（L4）',
      choices: [
        { text: '照老板说的办', next: 'n8', hooks: ['fear'] },
        { text: '主动去派出所说明', end: 'e_b', safe: true }
      ]
    },

    n8: {
      stage: 'lock', scene: 'call', caller: '来电 · 星城 · 尾号 2741',
      say: [
        ['p', '{name}同学你好，我是星城派出所的民警'],
        ['p', '我们在办理一起电信网络诈骗案件时，查到了你名下的对公账户'],
        ['p', '请你带上身份证，尽快到派出所配合调查、说明情况'],
        ['p', '我们不会要求你转账，也不会让你下载任何东西，别信自称能“帮你处理”的人']
      ],
      note: '真警察只请你到派出所说明：不要钱、不要验证码、不让你下载任何东西。',
      choices: [
        { text: '如实说明', end: 'e_c', safe: true },
        { text: '说是自己的钱', end: 'e_x', hooks: ['fear'] }
      ]
    }
  },

  endings: {
    e_s: {
      grade: 'S', title: '一口回绝', stamp: 'safe',
      text: '你一句“我自己找活干”，把这门月薪八千的看店活挡在了门外。营业执照、对公账户、收款机，只要用你的名字办，进来的每一笔钱都记在你名下。你少的不只是那份工资，你把自己从一份已经在运转的名单里划掉了。'
    },
    e_a: {
      grade: 'A', title: '守住了身份', stamp: 'safe',
      text: '执照、对公账户和刷脸，你一样都没交出去，这一局你零参与。刷脸是用你的身份替别人过核验，账户一旦写上你的名字，就不再是你的了。你没做错任何事，但你的名字已经进了他们的“意向名单”，下一个找你的人，未必还叫你学弟。'
    },
    e_b: {
      grade: 'B', title: '及时抽身', stamp: 'stop',
      text: '你在钱还没转完的时候停了手，或者主动去说明了情况——这是这条路上唯一正确的刹车点。已经流过的钱、你拿过的“工资”都在记录里；用你名字开的账户也可能被限制功能、停止非柜面业务（L5）。马上停手，带上记录去派出所如实说明。'
    },
    e_c: {
      grade: 'C', title: '如实说明', stamp: 'caught',
      text: '你已经用本人的名字替他们收钱、转钱了。你没有再撒谎，如实说明、配合调查是唯一正确的做法。为他人提供账户和实名核验帮助，可能构成帮信罪（L3）；账户会被限制功能、停止非柜面业务（L5），违法所得会被没收并处罚款（L6）。'
    },
    e_x: {
      grade: 'X', title: '越陷越深', stamp: 'caught',
      text: '你按老板教的说法，把账说成“自己的钱”——这一步是从帮信走向掩饰、隐瞒犯罪所得（L4）。S11 里那个人也说自己只是“受朋友高薪聘请看店”的，却始终说不出雇主是谁，最后因帮信罪被判三年多。如实说明、配合调查，是唯一正确的做法。'
    }
  },

  reveal: {
    truth: '你赚的每一笔手续费，都是另一个模块里那个“你”被骗走的钱。',
    crew: [
      ['招募人', '学长阿伟，拿人头奖励，专挑熟人下手'],
      ['“店主”', '谈工资、要身份，让你去办证开户'],
      ['你（工具人）', '营业执照、对公账户、收款机都写你的名字'],
      ['诈骗集团', '把骗来的钱打进来再转走，查不到源头']
    ],
    boom: {
      title: '钱从哪里来',
      render: function (host, run) {
        moneyFlow(host, run);
      }
    },
    tips: [
      '①银行卡、手机卡、账号，不租不借不卖',
      '②拿你名字开的账户，账算你的',
      '③不替任何人刷脸认证',
      '④说得出的“老板”才算老板'
    ],
    after: [
      '①立即停止转账',
      '②主动到派出所如实说明',
      '③不要听上线“教你怎么说”',
      '④告诉被你介绍的人立刻停手'
    ],
    sources: ['S2', 'S9', 'S11'],
    laws: ['L3', 'L4', 'L5', 'L6']
  }
});

/* 爆点「钱从哪里来」：6 位受害者 → 你名下的对公账户 → 老板的卡 → 境外。
 * 玩过的模块，对应受害者高亮并标注；金额全部为模拟数据。 */
function moneyFlow(host, run) {
  RJ.clear(host);
  var played = {};
  (RJ.runs() || []).forEach(function (r) { if (r && r.mod) played[r.mod] = true; });

  var victims = [
    { name: '王**', amt: 1000, memo: '点点赚任务充值', mod: 'shuadan',
      story: '他在“点点赚”里一单接一单地充钱，只想把余额提出来。' },
    { name: '李**', amt: 2560, memo: '票多多担保保证金', mod: 'gouwu',
      story: '他买演唱会门票，被告知“交易失败要交保证金”，钱转进了别人的账户。' },
    { name: '张**', amt: 3000, memo: '', mod: 'jiaoyou',
      story: '他下载了对方给的“视频软件”，之后对方拿着通讯录和视频向他要钱。' },
    { name: '陈**', amt: 6000, memo: '金融监管中心核验', mod: 'xiaodai',
      story: '“客服”说他名下有校园贷记录，不注销就影响征信，他照着对方说的把钱转了出去。' },
    { name: '周**', amt: 2000, memo: '急用，晚上还你', mod: 'huanlian',
      story: '他收到“室友”的视频和消息说急用钱，晚上就还，他把钱转了过去。' },
    { name: '赵**', amt: 5000, memo: '金沙娱乐充值', mod: 'wangdu',
      story: '他在“金沙娱乐”里越投越多，总想着赢一把就收手。' }
  ];

  var total = 0;
  victims.forEach(function (v) { total += v.amt; });

  host.appendChild(RJ.el('p', { class: 'boom-note', text: '点开下面每一笔，你会看到这个人是怎么把钱打进你用本人身份开的那个对公账户的（金额为模拟数据）。' }));

  var flow = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '6px' } });
  var col = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } });

  victims.forEach(function (v) {
    var seen = !!played[v.mod];
    var story = RJ.el('div', {
      style: { display: 'none', marginTop: '4px', fontSize: '11px', lineHeight: '1.6', color: '#c9d6e8', fontWeight: '400' },
      text: v.story
    });
    var btn = RJ.el('button', {
      type: 'button', 'aria-expanded': 'false',
      style: {
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
        padding: '6px 9px', borderRadius: '10px', color: '#e8eef7',
        background: seen ? 'rgba(232, 185, 49, .12)' : 'rgba(255, 255, 255, .04)',
        border: '1px solid ' + (seen ? '#e8b931' : '#2c3d5c')
      },
      onclick: function () {
        var open = story.style.display === 'none';
        story.style.display = open ? 'block' : 'none';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    }, [
      RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '6px', fontSize: '12.5px', fontWeight: '700' } }, [
        RJ.el('span', { text: v.name + ' 转入' }),
        RJ.el('span', { style: { color: '#8fe3d6' }, text: RJ.yuan(v.amt) })
      ]),
      RJ.el('div', { style: { fontSize: '10.5px', color: '#8fa0b8' }, text: '备注：' + (v.memo || '（空）') }),
      seen ? RJ.el('div', { style: { fontSize: '10.5px', color: '#e8b931', marginTop: '2px' }, text: '你在那个模块里见过他' }) : null,
      story
    ]);
    col.appendChild(btn);
  });

  flow.appendChild(col);
  flow.appendChild(RJ.el('div', { style: { textAlign: 'center', color: '#8fa0b8', fontSize: '11.5px', lineHeight: '1.6' } }, [
    RJ.el('div', { style: { fontSize: '17px' }, text: '↓' }),
    RJ.el('div', { text: '6 笔钱都先打进了你名下的对公账户' })
  ]));
  flow.appendChild(RJ.el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' } }, [
    box('你的账户', '尾号 2741 · 本人身份开的对公账户', '#e5484d'),
    arrow(),
    box('老板的卡', '上线收款的账户', '#f08a3c'),
    arrow(),
    box('境外', '钱到了这里，几乎追不回来', '#e5484d')
  ]));
  host.appendChild(flow);

  host.appendChild(RJ.el('p', { class: 'boom-note', text: '6 笔合计 ' + RJ.yuan(total) + '（模拟数据）——每一笔备注，都是另一个模块里某个人的一次转账；你按 1% 留下来的“手续费”是 ' + (run ? RJ.yuan(run.dirty) : '—') + '（模拟数据）。' }));

  host.appendChild(RJ.el('div', { class: 'sec-title', style: { marginTop: '16px' }, text: '代价清单' }));
  var costs = [
    '银行卡、支付账户可能被限制功能，停止非柜面业务、暂停新业务（L5）',
    '没收违法所得，并处罚款；情节严重的拘留（L6）',
    '明知他人利用信息网络犯罪仍提供支付结算帮助，可能构成帮信罪（L3）',
    '按上线要求撒谎、帮忙转移赃款，可能构成掩饰、隐瞒犯罪所得罪（L4）',
    '帮信罪约三分之一的被告人不满 25 岁（S9）'
  ];
  var list = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '7px' } });
  costs.forEach(function (c) {
    list.appendChild(RJ.el('div', {
      style: { fontSize: '12.5px', lineHeight: '1.6', color: '#dfe7f3', paddingLeft: '9px', borderLeft: '3px solid #e5484d' },
      text: c
    }));
  });
  host.appendChild(list);

  host.appendChild(RJ.el('div', { class: 'sec-title', style: { marginTop: '16px' }, text: '现实里发生了什么（S11）' }));
  var real = [
    '2024 年，一名男子在自贡租下门面开烟酒店，用实体店资质办了营业执照、对公账户和 POS 机，交给电诈团伙接收赃款。',
    '这套资质用了两天，进账超 500 万元，随即被银行风控冻结。到案后他编造“受朋友高薪聘请帮忙看店，月薪 8000 余元”，却始终说不出雇主是谁。',
    '最终他因帮信罪被判有期徒刑三年多。他不是被骗的人，是替人收钱的那个人——和这一局里的你，位置一样。'
  ];
  var realBox = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '7px' } });
  real.forEach(function (t) {
    realBox.appendChild(RJ.el('div', {
      style: { fontSize: '12.5px', lineHeight: '1.6', color: '#dfe7f3', paddingLeft: '9px', borderLeft: '3px solid #e8b931' },
      text: t
    }));
  });
  host.appendChild(realBox);

  host.appendChild(RJ.el('div', { class: 'sec-title', style: { marginTop: '16px' }, text: '「惊弓之鸟」' }));
  host.appendChild(RJ.el('p', { class: 'boom-note', text: '民警联系受害人退赃时，很多人以为民警是新的骗子，直接挂断电话。多疑也有代价：你把来退钱的警察，也当成了骗子。' }));

  host.appendChild(RJ.el('p', { class: 'boom-note', text: '这 6 个人，都是被同一个剧本骗的：引流、建信、设饵、收割、锁死。你替他们收了最后那一步的钱。' }));
}

function arrow() {
  return RJ.el('div', { style: { color: '#8fa0b8', fontSize: '17px', flex: '0 0 auto' }, text: '→' });
}

function box(title, sub, color) {
  return RJ.el('div', {
    style: {
      flex: '0 0 auto', minWidth: '86px', padding: '7px 9px', borderRadius: '10px', textAlign: 'center',
      background: 'rgba(255, 255, 255, .04)', border: '1px solid ' + color
    }
  }, [
    RJ.el('div', { style: { fontSize: '13px', fontWeight: '700', color: '#e8eef7' }, text: title }),
    RJ.el('div', { style: { fontSize: '10.5px', color: '#8fa0b8', marginTop: '2px', lineHeight: '1.4' }, text: sub })
  ]);
}
})();
