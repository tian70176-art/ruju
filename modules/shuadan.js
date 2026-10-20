/* 模块 shuadan · 反诈宣传员招募（刷单返利）—— 高手局版，规格见 方案/30 §3.1
 * 该模块只做一件事：调用 RJ.register(def)。
 */
(function () {
  'use strict';
RJ.register({
  id: 'shuadan',
  title: '反诈宣传员招募',
  type: '刷单返利',
  role: 'victim',
  app: { name: '兼职猫', icon: '🐱', color: '#ff9f1c' },
  lockNotice: { app: '兼职猫', title: '【兼职猫】', body: '在家点赞就能赚！日结 200+，学生党首选' },
  inbox: {
    time: '09:12', app: '校友圈', from: '反诈宣传志愿者 · 小林',
    text: '{name}同学，学校反诈宣传月招志愿者，转发反诈视频每条 ¥3，试试吗？'
  },
  inbox2: {
    time: '09:26', app: '校友圈', from: '反诈宣传志愿者 · 小林',
    text: '{name}同学，学校反诈宣传月招线上助力，帮忙转反诈短片、点个赞，一条 ¥3，要做吗？'
  },
  cast: {
    a: { name: '反诈宣传志愿者 小林', avatar: '🙋' },
    t: { name: '志愿队组长 阿杰', avatar: '🧑‍🏫' },
    k: { name: '点点赚客服', avatar: '🎧' },
    l: { name: '维权律师 王律', avatar: '⚖️' }
  },
  verifyText: {
    orig: '你翻了校友圈：发招募的是个人号，主页只有几条转发，学校官方号没有发过这条。',
    app: '应用商店里搜不到「点点赚」，能打开它的只有聊天里发来的那个安装包。'
  },
  start: 'n1',

  /* 40 §3 第 2 变体：只换开场（inbox 文案 + n1/n2 的 say），节点结构、选项、去向一概不动 */
  variant: {
    n1: {
      say: [
        ['a', '{name}同学你好，我是{school}反诈宣传月的学生志愿者小林'],
        ['a', '这个月我们组在冲宣传量，帮转几条反诈短片、顺手点个赞，一条给 ¥3 补贴'],
        ['a', '补贴从宣传经费里出，当天结清，我们组昨天刚结过一批'],
        ['a', '不用交任何东西，转发加点赞，一分钟一条。要不要先试一条？']
      ]
    },
    n2: {
      say: [
        ['sys', '「小林」邀请你加入了群聊：反诈宣传志愿二群（36）'],
        ['a', '欢迎新同学，今天群里还有 15 条短片要转'],
        ['a', '做完的同学在下面报一下条数，我好对上账'],
        ['sys', '阿豪：今天转了 10 条，¥30 到账了'],
        ['sys', '小南：我 5 条，谢谢小林～'],
        ['a', '大家看，都是当天结的。{name}同学先跟着做几条试试？']
      ]
    }
  },

  nodes: {
    n1: {
      stage: 'lure', scene: 'chat', app: '校友圈', contact: '反诈宣传志愿者 · 小林',
      say: [
        ['a', '{name}同学你好呀，我是{school}的反诈宣传志愿者小林'],
        ['a', '这个月是学校反诈宣传月，我们帮转几条反诈短视频、点点赞，一条给 ¥3 补贴'],
        ['a', '钱是宣传经费里出的，当天就结，已经好多同学做完了'],
        ['a', '不用交任何东西，转发加点赞，一分钟一条。要不要先试一条？']
      ],
      note: '用“反诈”这两个字做敲门砖：越是在意反诈的同学，越容易在这里放下戒心。',
      verify: {
        ask: { text: '你问辅导员：学校这个月是有反诈宣传，但没有“转发视频给补贴”的招募，更不可能是个人号在发', ok: true, end: 'e_s' },
        police: { text: '接警员说：以“反诈宣传”“志愿者补贴”为名招募、再让你充值做任务的，是刷单类最常见的开场', ok: true, end: 'e_s' },
        orig: { text: '你翻校友圈：发来招募的是个人号，主页只有几条转发，学校官方号没有发过这条', ok: true },
        app: { text: '你把学校官方公众号翻了一圈：没有这条招募，也没有“转发补贴”这回事', ok: true },
        search: { text: '搜索结果第一条是广告位，点进去是同一个兼职平台的注册页', ok: false },
        given: { text: '你按小林给的“志愿队核实电话”打过去，接起来的是他们自己人，说招募是真的', ok: false },
        group: { text: '你在群里问了一句，立刻有三个人回你“我做过，真的到账”', ok: false },
        video: { text: '小林说在宿舍不方便开视频，让你放心', ok: false }
      },
      choices: [
        { text: '怎么参加？', next: 'n1h' },
        { text: '最近没空，下次吧', end: 'e_s', safe: true }
      ]
    },

    n1h: {
      if: 'hint96110', stage: 'lure', scene: 'chat', app: '国家反诈中心', contact: '96110 预警',
      say: [
        ['sys', '📢 系统通知：国家反诈中心提醒'],
        ['sys', '警惕以“反诈宣传”“志愿招募”为名的兼职：先给几块钱小额补贴取得信任，再要求你充值做任务。'],
        ['sys', '正规招募不会让你先交钱，也不会让你下载来源不明的 App。']
      ],
      note: '来自 96110 的公平提示：接过预警电话的人，在这里会比别人多一层清醒。',
      next: 'n2'
    },

    n2: {
      stage: 'lure', scene: 'chat', app: '微聊', contact: '校园反诈宣传志愿群',
      say: [
        ['sys', '「小林」邀请你加入了群聊：校园反诈宣传志愿群（48）'],
        ['a', '欢迎新同学，今天群里还有 12 条短片要转'],
        ['a', '做好的同学在下面报一下条数，我好对上账'],
        ['sys', '小齐：今天转了 8 条，¥24 已经到账了'],
        ['sys', '可可：我 6 条，谢谢小林～'],
        ['a', '大家看，都是当天结的。{name}同学先跟着做几条试试？']
      ],
      note: '群里不停报数、晒小额到账，让你觉得“身边同学都在做”这件事本身就等于安全。',
      choices: [
        { text: '继续看看', next: 'n3' },
        { text: '退群', end: 'e_s', safe: true }
      ]
    },

    n3: {
      stage: 'trust', scene: 'chat',
      say: [
        ['a', '今天先给你排三条，都是保卫处发的反诈短片'],
        ['a', '第 3、5、7 条，转发到朋友圈，再点个赞，截图发我就行'],
        ['a', '', { img: '🖼️', caption: '待转发的反诈短片：刷单篇 / 校园贷篇 / 冒充客服篇' }],
        ['a', '一条 ¥3，三条一起结，做完截图给我']
      ],
      note: '任务内容是真的、钱也是真的——用“真”先把第一步的戒心磨掉。',
      choices: [
        { text: '三条都完成了', next: 'n4' },
        { text: '先不做了', end: 'e_s', safe: true }
      ]
    },

    n4: {
      stage: 'trust', scene: 'chat', money: 9,
      say: [
        ['a', '截图收到啦，三条都合格，辛苦'],
        ['a', '', { redpack: '¥3.00' }],
        ['a', '', { redpack: '¥3.00' }],
        ['a', '', { redpack: '¥3.00' }],
        ['sys', '零钱包到账 ¥9.00（3 条 × ¥3）'],
        ['a', '对了，我们这个志愿小队是几个同学自己弄的，不是学校官方号发的哈，官方那条走流程慢，单子都从我这边走']
      ],
      note: '先返小钱是固定开场；“不是学校官方号”这句话，是全流程第一个可以查证的破绽。',
      flag: '招募方是个人号，不是学校官方号——“宣传月”是真的，这个“志愿小队”不是学校的',
      choices: [
        { text: '继续跟着做', next: 'n5', hooks: ['greed'] },
        { text: '够了，今天到这', end: 'e_a', safe: true }
      ]
    },

    n5: {
      stage: 'hook', scene: 'chat',
      say: [
        ['sys', '「志愿队组长阿杰」加入了群聊'],
        ['t', '大家好，我是组长阿杰，宣传效果好的同学由我带着做'],
        ['t', '今天还剩 3 个名额：升级成“正式宣传员”，充 ¥100 到宣传账户，做完返 ¥130'],
        ['t', '多出来的 30 是宣传补贴，名额满了今天就没了']
      ],
      note: '换个组长身份增加专业感，把“先交钱”包装成宣传账户，再用名额压缩你的犹豫。',
      flag: '“进阶任务”开始要你先充值：反诈宣传变成了要你往账户里交钱',
      verify: {
        ask: { text: '辅导员说：学校没有让人先交钱的反诈宣传招募，加你的那个号也不是学校的', ok: true, end: 'e_a' },
        police: { text: '接警员说：先交钱再返利的兼职，基本都是刷单那一套，别再转钱', ok: true, end: 'e_a' },
        orig: { text: '你翻校友圈：小林是个人号，认证栏写着“个人”，学校官方号从没提过这个志愿队', ok: true },
        app: { text: '你在应用商店搜这个“志愿队”：没有任何官方账号或小程序', ok: true },
        search: { text: '你搜“反诈宣传志愿者 招募”：前两条是广告，点进去是同一个兼职平台的注册页', ok: false },
        given: { text: '小林发来一个“志愿队官方核实电话”，接起来的人是阿杰本人', ok: false },
        group: { text: '群里三个人马上回你“我们都做了，放心充”', ok: false },
        video: { text: '小林说在宿舍不方便开视频，让你别想太多', ok: false }
      },
      choices: [
        { text: '充 ¥100 试试', next: 'n6', hooks: ['greed', 'urgency'], money: -100 },
        { text: '还要先交钱？算了', end: 'e_a', safe: true }
      ]
    },

    n6: {
      stage: 'trust', scene: 'chat', money: 130,
      say: [
        ['t', '收到，马上给你排上'],
        ['t', '单子跑完了，返利 ¥130 现在打给你'],
        ['t', '', { redpack: '¥130.00' }],
        ['sys', '零钱包到账 ¥130.00'],
        ['t', '跟着做就行，我说过不会亏你的']
      ],
      note: '第二次甜头是加码：让你亲眼看到“充得多、返得多”，为大额铺路。',
      flag: '第二次甜头专为大额充值铺路',
      choices: [
        { text: '继续', next: 'n7' },
        { text: '提现走人', end: 'e_a', safe: true }
      ]
    },

    n7: {
      stage: 'hook', scene: 'app', app: '点点赚',
      say: [
        ['t', '群里单子太多，光靠我发太慢了'],
        ['t', '你下载我们的任务 App「点点赚」，自己抢单，单价还高一点'],
        ['t', '', { link: '点点赚.apk', linkTip: '点击下载安装' }],
        ['t', '装好我拉你进内部派单群，单子多一点']
      ],
      note: '让你脱离应用商店下载，是为了把你带进他控制的那个界面里。',
      flag: '要求在非官方渠道下载 App：应用商店里根本没有这个软件',
      widget: ['install', { app: '点点赚', size: '18.6MB' }],
      verify: {
        app: { text: '应用商店里搜不到「点点赚」，只有一个同名的记账小工具，评论区说提现不到账', ok: true },
        ask: { text: '辅导员说：学校从没让大家装过什么任务 App，也没听说过点点赚', ok: true, end: 'e_a' },
        police: { text: '接警员说：让你去非应用商店下载 App 做任务的，基本都是刷单诈骗', ok: true, end: 'e_a' },
        search: { text: '搜索结果第一条是广告位，页面标题写着「点点赚官方下载」', ok: false },
        given: { text: '你打阿杰给的“官方客服”号码，接起来的人说软件绝对安全', ok: false },
        video: { text: '阿杰说视频就不开了，先把 App 装上再说', ok: false }
      },
      choices: [
        { text: '安装', next: 'n8' },
        { text: '不装了', end: 'e_a', safe: true }
      ]
    },

    n8: {
      stage: 'harvest', scene: 'app', app: '点点赚',
      say: [
        ['k', '您好，我是点点赚客服，负责您的进阶任务'],
        ['k', '首单进阶任务：充 ¥1,000 返 ¥1,300，做完一起结算'],
        ['k', '这个名额是组长给您留的，别浪费哦']
      ],
      note: '把“宣传任务”升级成“进阶任务”，要你把自己的钱放进来。',
      interrupt: { app: '校友圈', from: '班级群 · 辅导员', text: '本周反诈主题班会，周三晚 7 点，记得来' },
      widget: ['task', {
        balance: 139,
        tasks: [
          { name: '进阶任务 · 首单', cost: 1000, ret: 1300, sec: true },
          { name: '宣传任务 · 已完成', tag: '已结算' },
          { name: '点赞任务 · 已完成', tag: '已结算' }
        ],
        locked: false
      }],
      verify: {
        search: { text: '搜索结果第一条是广告位，接起来的人自称「点点赚客服」，说充值任务确实要完成才能结算', ok: false },
        app: { text: '应用商店里没有「点点赚」，你只能从聊天里的安装包打开它', ok: true },
        ask: { text: '你问辅导员：学校从没听过什么“宣传账户”，也没让大家往里充钱', ok: true, end: 'e_a' },
        police: { text: '接警员说：先充值再返利、提现还要再做任务的，就是刷单那一套，别再转钱', ok: true, end: 'e_b' },
        given: { text: '你按客服给的“财务专线”打过去，对方说充值通道正常，放心转', ok: false },
        group: { text: '群里三个人立刻回你“我充了，返利已经到账”', ok: false },
        video: { text: '客服说公司规定不能和用户视频', ok: false }
      },
      choices: [
        { text: '充值 ¥1,000', next: 'n9', hooks: ['greed'], money: -1000 },
        { text: '先提现我那 ¥139', next: 'n8b' },
        { text: '不玩了，退出', end: 'e_a', safe: true }
      ]
    },

    n8b: {
      stage: 'harvest', scene: 'chat',
      say: [
        ['k', '您的余额要完成当前任务后才能一起提现'],
        ['k', '平台规则是任务全部完成才结算的哦'],
        ['k', '现在单独提现会被系统判为异常，账户会被冻结']
      ],
      note: '把“提现”变成有条件的动作：钱进得去，出不来。',
      flag: '钱进得去出不来——提现被“平台规则”挡住，是收割期的标准动作',
      choices: [
        { text: '那我充', next: 'n9', hooks: ['sunk'], money: -1000 },
        { text: '打 110 问一下', end: 'e_b', safe: true }
      ]
    },

    n9: {
      stage: 'lock', scene: 'app', app: '点点赚',
      say: [
        ['sys', '您的任务进度：1 / 3（三连单）'],
        ['k', '任务一完成，返利已记入余额 ¥1,300'],
        ['k', '三连单要全部完成才能提现，任务二需充 ¥3,000'],
        ['k', '完成后返 ¥3,900，连本带利一起到账']
      ],
      note: '账户里显示的钱是画给你的：提现按钮下面永远还有“下一单”。',
      pressure: true,
      pressureText: '在吗？任务二的名额我给您留着了，别人都在抢。',
      widget: ['task', {
        balance: 1300,
        tasks: [
          { name: '三连单 · 任务二', cost: 3000, ret: 3900, sec: true },
          { name: '三连单 · 任务三', tag: '待解锁' }
        ],
        locked: true
      }],
      verify: {
        police: { text: '接警员说：以“三连单”“卡单”为由让你继续充钱的，就是刷单诈骗，马上停手', ok: true, end: 'e_b' },
        ask: { text: '辅导员看了一眼就说：正规兼职没有“三连单”这种说法，别再转钱', ok: true, end: 'e_b' }
      },
      choices: [
        { text: '再充一单', next: 'n10', hooks: ['sunk'], money: -3000 },
        { text: '申请提现', next: 'n9b' },
        { text: '去趟派出所', end: 'e_b', safe: true }
      ]
    },

    n9b: {
      stage: 'lock', scene: 'chat',
      say: [
        ['k', '您刚才操作超时，系统卡单了'],
        ['k', '订单已经锁定，需要补单 ¥3,000 解冻'],
        ['k', '解冻后本金和返利一起提现，一分不会少您的']
      ],
      note: '“卡单、超时、冻结”都是话术，目的只有一个：再要一笔钱。',
      choices: [
        { text: '补单', next: 'n10', hooks: ['sunk', 'fear'], money: -3000 },
        { text: '去趟派出所', end: 'e_b', safe: true }
      ]
    },

    n10: {
      stage: 'lock', scene: 'app', app: '点点赚',
      say: [
        ['sys', '系统提示：您的信誉分 42，低于提现门槛 60'],
        ['k', '需要缴纳 ¥5,000 信誉保证金，提现后原路退回'],
        ['k', '保证金不是收费，是风控要求，完成提现就退您']
      ],
      note: '每一次接近提现，都会多出一个新的收费名目。',
      pressure: true,
      pressureText: '就差这一笔了，交完马上就能提现，您别让我难做。',
      widget: ['task', {
        balance: 5400,
        tasks: [{ name: '信誉保证金', cost: 5000, ret: 5000, sec: true }],
        locked: true
      }],
      verify: {
        police: { text: '接警员说：提现前要交“保证金”“信誉分”的，都是诈骗，别再转钱了', ok: true, end: 'e_b' }
      },
      choices: [
        { text: '借钱交', next: 'n11', hooks: ['sunk', 'urgency'] },
        { text: '收手，去派出所', end: 'e_c', safe: true }
      ]
    },

    n11: {
      stage: 'lock', scene: 'app', app: '青橙分期',
      say: [
        ['k', '额度已经给您批好了，先用青橙分期的钱交保证金'],
        ['k', '等您提现到账马上还上，等于没借过'],
        ['k', '名额只剩最后一个了，现在弄还来得及']
      ],
      note: '开始让你借钱：从骗你的积蓄，变成骗你的债务。',
      widget: ['pay', { amount: 5000, to: '点点赚 · 信誉保证金', title: '借款并支付' }],
      choices: [
        { text: '确认支付', next: 'n12', hooks: ['sunk'], money: -5000 },
        { text: '不借了，去派出所', end: 'e_b', safe: true }
      ]
    },

    n12: {
      stage: 'lock', scene: 'chat', app: '微聊',
      say: [
        ['sys', '你点开点点赚：账户已冻结，客服无响应'],
        ['sys', '组长阿杰退出了群聊'],
        ['sys', '一个陌生号码通过手机号添加了你'],
        ['l', '同学你好，我是王律，专做被骗资金追回，成功过很多单'],
        ['l', '先付 ¥2,000 服务费，追不回来全额退您'],
        ['l', '很多同学都是这么把血汗钱要回来的']
      ],
      note: '二次诈骗：他们知道你现在最想“把损失拿回来”。',
      flag: '“付费追回被骗资金”的，是专门盯着受害者的二次诈骗',
      pressure: true,
      pressureText: '今天最后一个名额了，过了今晚我就不接了。',
      choices: [
        { text: '付费追回', end: 'e_x', hooks: ['sunk'], money: -2000 },
        { text: '打 110 报警', end: 'e_c', safe: true }
      ]
    }
  },

  endings: {
    e_s: {
      grade: 'S', title: '一眼识破', stamp: 'safe',
      text: '正规的志愿招募不会用个人号加你、更不会给“转发日结”发补贴。学校反诈宣传月是真的，但那不是任何人加你好友的理由——你少的不只是几块钱，你从他们的“意向客户”名单里消失了一次。'
    },
    e_a: {
      grade: 'A', title: '白赚 9 块？', stamp: 'safe',
      text: '你拿了一点甜头就抽身，这一局你没亏钱。但你在他们的名单上已经被标记为“意向客户”：愿意为小钱动手的人，才有可能为大钱动心。这一次你没损失，不代表下一个骗局的名单里没有你。'
    },
    e_b: {
      grade: 'B', title: '及时止损', stamp: 'stop',
      text: '不管你转出去多少，停在“提现还要再交钱”这一步都是对的——这是这类诈骗唯一正确的刹车点。接下来做三件事：保存聊天记录和转账记录、截图 App 界面、拨打 110 报警。'
    },
    e_c: {
      grade: 'C', title: '连单深渊', stamp: 'caught',
      text: '你付出了几千甚至上万，才看清那个永远提不出来的余额。这不怪你，整条流程就是为“不甘心的人”设计的。现在最要紧的是停止转账、保存所有记录、拨打 110；接到 96110 来电一定要接。'
    },
    e_x: {
      grade: 'X', title: '被骗两次', stamp: 'caught',
      text: '能帮你追回被骗钱款的只有公安机关，任何收费“追回”都是诈骗。你在被骗之后，又被同一条产业链收割了一次。现在唯一正确的做法是：停止一切转账，带着聊天记录和转账记录去派出所。'
    }
  },

  reveal: {
    truth: '你赚到的 ¥139，是他们花得最值的一笔钱。',
    crew: [
      ['发单号', '在校友圈以“反诈志愿者”的名义拉人进群'],
      ['托儿', '群里 47 个“同学”，只负责报数和喊单'],
      ['接待员', '派小额任务，先给你返几块钱'],
      ['组长', '推“正式宣传员”“进阶任务”要你充值'],
      ['客服', '用“卡单”“保证金”不断要钱']
    ],
    boom: {
      title: '骗子最喜欢的伪装，就是你最信任的那个词。',
      render: function (host, run) {
        host.appendChild(RJ.el('p', { class: 'boom-note', text: '你是群里唯一的真人。' }));
        host.appendChild(RJ.el('p', { class: 'boom-note muted', text: '（情景推演：基于 S1 刷单引流与“先返小钱”的常见手法推演，不是真实案例）' }));
        var box = RJ.el('div', { class: 'boomgrid' });
        var cells = [];
        var names = ['朵朵', '阿宇', '小齐', '琪琪', '老周', '小南', '大鹏', '可可', '思思', '阿凯'];
        for (var i = 0; i < 48; i++) {
          var me = (i === 47);
          var cell = RJ.el('div', { class: 'gm' + (me ? ' me' : '') }, [
            RJ.el('span', { class: 'gm-av', text: me ? '🙋' : ['🧑', '👩', '🧓', '👨', '👧'][i % 5] }),
            RJ.el('span', { class: 'gm-tag', text: me ? '真人' : '' }),
            RJ.el('span', { class: 'gm-name', text: me ? '你' : names[i % names.length] })
          ]);
          cells.push(cell);
          box.appendChild(cell);
        }
        host.appendChild(box);
        var noteEl = RJ.el('p', { class: 'boom-note', text: '群成员 48 人 —— 你点开每一个头像，他们都在晒同一批截图。' });
        host.appendChild(noteEl);
        var btn = RJ.el('button', { class: 'btn btn-primary', text: '🔍 翻面：看看这 48 个人是谁' });
        host.appendChild(btn);

        var ledger = RJ.el('div', { class: 'ledger' });
        host.appendChild(ledger);

        btn.addEventListener('click', function () {
          btn.disabled = true;
          btn.textContent = '正在翻面…';
          cells.forEach(function (c, i) {
            if (i === 47) return;
            later(function () {
              if (!c.parentNode) return;
              c.classList.add('fake');
              var t = c.querySelector('.gm-tag'); if (t) t.textContent = '托';
            }, RJ.reduceMotion() ? 0 : i * 22);
          });
          later(function () {
            btn.textContent = '他们是托，你是名单上的第 48 个';
            var me = cells[47];
            if (me) me.classList.add('pop');
            noteEl.textContent = '群里 47 个“同学”都是托儿，只负责报数和喊单。真正在转发反诈视频的，只有你一个人。';
            fillLedger(ledger, run);
          }, RJ.reduceMotion() ? 0 : 48 * 22 + 200);
        });

        function later(fn, ms) { setTimeout(fn, ms); }
      }
    },
    tips: [
      '①凡是先交钱的兼职都是诈骗',
      '②“充得越多返得越多”必是骗局',
      '③不在非官方渠道下载 App',
      '④提现要交钱 = 钱已经没了'
    ],
    after: [
      '①立即停止转账，不要“再充一单解冻”',
      '②保存聊天记录、转账记录、App 截图',
      '③拨打 110 报警；接到 96110 来电一定要接',
      '④声称能“追回损失”的收费服务都是二次诈骗'
    ],
    sources: ['S1', 'S3'],
    laws: ['L1']
  }
});

function fillLedger(host, run) {
  RJ.clear(host);
  var paid = run && run.loss ? run.loss : 0;
  host.appendChild(RJ.el('div', { class: 'ledger-title', text: '骗子账本（模拟数据）' }));
  var table = RJ.el('table', { class: 'ledger-table' }, [
    RJ.el('tr', {}, [RJ.el('th', { text: '支出' }), RJ.el('th', { text: '收入' })]),
    RJ.el('tr', {}, [RJ.el('td', { text: '给你的返利 ¥139' }), RJ.el('td', { text: '你的充值合计 ' + RJ.yuan(paid) })])
  ]);
  host.appendChild(table);
  var rate = paid > 0 ? (139 / paid * 100).toFixed(2) + '%' : '—';
  host.appendChild(RJ.el('div', { class: 'ledger-rate' }, [
    RJ.el('span', { text: '返利率 = 139 ÷ 你的充值 = ' }),
    RJ.el('b', { text: rate })
  ]));
  host.appendChild(RJ.el('p', { class: 'boom-note', text: '他们给你的每一块钱甜头，都在为下一笔更大的收割铺路。' }));
}
})();
