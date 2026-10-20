/* 模块 jiaoyou · 同城缘遇（主线：婚恋交友 → 虚假网络投资理财；第二条线：诱导装软件 → 敲诈）
 * 规格见 方案/13（骨架）+ 方案/30 §3.3（高手局：慢热三天、不要钱、反向推销、小额提现建信）。
 * 该模块只做一件事：调用 RJ.register(def)。
 */
(function () {
  'use strict';
RJ.register({
  id: 'jiaoyou',
  title: '同城缘遇',
  type: '婚恋交友 → 虚假网络投资理财',
  role: 'victim',
  app: { name: '同城缘遇', icon: '💞', color: '#ff5d8f' },
  lockNotice: { app: '同城缘遇', title: '【同城缘遇】', body: '距你 0.8km 的「小鹿」给你打了招呼' },
  inbox: { time: '11:40', app: '同城缘遇', from: '小鹿', text: '在吗？今天想找你说个事，不着急' },
  inbox2: { time: '12:20', app: '同城缘遇', from: '小鹿', text: '在吗？有件小事想跟你说，不急' },
  cast: {
    x: { name: '小鹿', avatar: '🦌' }
  },
  start: 'n1',

  /* 40 §3 第 2 变体：只换开场（inbox 文案 + n1/n2 的 say），慢热节奏与后续节点不动 */
  variant: {
    n1: {
      say: [
        ['sys', '同城缘遇 · 附近的人 · 距你 1.6km'],
        ['x', '嗨～看你主页也常去操场打球，我最近刚学着打'],
        ['x', '我平时就在{school}东门那一带上自习，挺宅的'],
        ['x', '不聊别的，就想找个人说说话。你要是忙就算啦']
      ]
    },
    n2: {
      say: [
        ['sys', '第二天 22:10 · 小鹿发来消息'],
        ['x', '{name}，今天球打得怎么样'],
        ['x', '我这两天在看一个东西，回头跟你说，挺有意思的'],
        ['x', '', { img: '🖼️', caption: '小鹿发来的照片：只有一张侧影，看不清脸' }],
        ['x', '我不太会拍照，这张还是从相册深处翻出来的'],
        ['x', '跟你聊天挺放松的，就是隔着屏幕，总差点意思']
      ]
    }
  },

  /* 核实渠道文案（30 §2.3）：正确渠道给真实有用的信息，走错渠道给假答案 */
  verifyText: {
    orig: '你翻了一遍通讯录：小鹿不在里面。聊了三天，你连对方叫什么、哪个班都不知道。',
    app: '你回到同城缘遇的小鹿资料页：注册 3 天，实名认证没做，动态只有那几张看不清的照片。',
    ask: '你把聊天记录拿给室友看，室友说：认识三天就聊到理财，正常朋友不会这么干。',
    police: '接警员听完说：这是“先谈感情、再谈投资”的路子，一分钱都别投，什么安装包都别装。',
    search: '搜索结果第一条是推广位，写着“官方导师带你操作”，加过去对方发来收益截图：“名额还剩两个”。',
    given: '你按对方给的号码打过去，对方说“核实无误，放心操作，我们都是内部渠道”。',
    group: '群里两百多人都在晒提现截图，有人催你“别犹豫，名额就剩一个了”。',
    video: '小鹿说摄像头坏了，发来一段录好的短视频，画面里只有半边轮廓。'
  },

  nodes: {
    /* ================= 共享开场：慢热的第一、二天（不催下载、不要钱） ================= */

    n1: {
      stage: 'lure', scene: 'chat',
      say: [
        ['sys', '同城缘遇 · 附近的人 · 距你 0.8km'],
        ['x', '嗨～看你主页也喜欢打羽毛球，我最近刚开始学'],
        ['x', '我就住在{school}南门外面那条街，平时挺宅的'],
        ['x', '不聊别的，就想找个人说说话。你要是忙就算啦']
      ],
      note: '开场不催下载也不要钱，他要的只是“这个人跟我有点像”的第一印象。',
      choices: [
        { text: '回一句，聊两句', next: 'n2', hooks: ['emotion'] },
        { text: '先放一放，不回', end: 'e_s', safe: true }
      ]
    },

    n2: {
      stage: 'trust', scene: 'chat',
      say: [
        ['sys', '第二天 21:40 · 小鹿发来消息'],
        ['x', '{name}，今天球打得怎么样'],
        ['x', '我这两天在看一个东西，回头跟你说，挺有意思的'],
        ['x', '', { img: '🖼️', caption: '小鹿发来的照片：光线很暗，只看得出一个轮廓' }],
        ['x', '我平时不太拍照，这张还是翻出来的'],
        ['x', '跟你聊天挺放松的，就是隔着屏幕，总差点意思']
      ],
      note: '两天只给一张看不清的照片，却把“隔着屏幕差点意思”递到你嘴边，等你自己开口。',
      flag: '聊了两天：只有一张看不清的照片，姓名、班级、电话一个都不知道',
      choices: [
        { text: '继续聊下去', next: 'i3', hooks: ['emotion'] },
        { text: '要不我们视频一下', next: 'n3' },
        { text: '聊得太顺，我多问一句', end: 'e_s', safe: true }
      ]
    },

    /* ================= 主线 A：第三天开始，慢热到“内部体验版” ================= */

    i3: {
      stage: 'hook', scene: 'chat',
      interrupt: { app: '校友圈', from: '辅导员 王老师', text: '明晚 7 点年级反诈主题班会，请准时到' },
      say: [
        ['sys', '第三天 21:40 · 小鹿发来消息'],
        ['x', '跟你说个事，你别笑我'],
        ['x', '我上个月跟着一个平台做单，两万本金，现在账上三万多'],
        ['x', '', { img: '🖼️', caption: '小鹿发来的收益截图（模拟数据）' }],
        ['x', '但你别碰，有风险。你还是学生，生活费亏了怎么办'],
        ['x', '我就是想找个人说说，不是要你做什么']
      ],
      note: '先亮收益，再劝你别投：被劝住的人反而更想“试一点点”，这是反向推销。',
      flag: '“你别投”这句是反向推销：他先替你踩刹车，好让你自己开口说想试试',
      choices: [
        { text: '让我也看看那个平台', next: 'i4', hooks: ['greed'] },
        { text: '要不我们先视频吧', next: 'n3' },
        { text: '这些我不碰，你自己玩', end: 'e_i1', safe: true }
      ]
    },

    i4: {
      stage: 'hook', scene: 'chat',
      say: [
        ['x', '你真要看啊……那你自己拿主意'],
        ['x', '应用商店里搜不到它的，是个内部体验版，我发你安装包'],
        ['x', '', { link: '内部体验版.apk', linkTip: '对方发来的文件 · 未知来源' }],
        ['x', '装好我教你看，先随便看看，别乱充']
      ],
      note: '“商店里搜不到”不是缺点，正是他要的：没有审核的地方，数字随他改。',
      flag: '平台在官方应用市场里搜不到，只能装对方发来的安装包',
      verify: {
        app: { text: '你在官方应用市场里搜这个名字：没有。再点进小鹿的资料页，注册 3 天，实名信息空白。', ok: true, end: 'e_i1' },
        police: { text: '接警员听完说：这是“先谈感情、再谈投资”的路子，安装包别装，钱一分都别投。', ok: true, end: 'e_i1' },
        search: { text: '搜索结果第一条是推广位，写着“官方导师带你操作”，加过去对方发来收益截图：“名额还剩两个”。', ok: false, next: 'i5' },
        given: { text: '你加了小鹿给的“客服号”，对方说“内部体验版不对外，先装上我给你开权限”。', ok: false, next: 'i5' }
      },
      choices: [
        { text: '那就装上看看', next: 'i5', hooks: ['greed'] },
        { text: '算了，我不装', end: 'e_i1', safe: true }
      ]
    },

    i5: {
      stage: 'harvest', scene: 'app', app: '内部体验版',
      say: [
        ['x', '点“继续安装”就行，那个提示别管它'],
        ['sys', '系统提示：该应用来自未知来源'],
        ['x', '装好我发你账号，先充 200 试试水就够了']
      ],
      note: '非官方渠道的安装包，装上的不是软件，是一个他想写多少就写多少的数字页面。',
      flag: '“未知来源”的提示是真的：官方应用市场里根本没有这个 App',
      widget: ['install', { app: '内部体验版', size: '18.4MB' }],
      choices: [
        { text: '继续安装', next: 'i6', hooks: ['greed'] },
        { text: '不装了，删掉', end: 'e_i1', safe: true }
      ]
    },

    i6: {
      stage: 'harvest', scene: 'app', app: '内部体验版',
      say: [
        ['x', '账号开好了，小额试就行，别多想'],
        ['sys', '内部体验版 · 未绑定充值方式'],
        ['x', '点充值，200 就够了。赚了你随时提，我不拦着']
      ],
      note: '第一笔只要 200：小到你不会拒绝，这一步测的是你愿不愿意先掏钱。',
      widget: ['pay', { amount: 200, to: '内部体验版 · 充值', title: '确认支付' }],
      choices: [
        { text: '先充 200 试水', next: 'i7', hooks: ['greed'], money: -200 },
        { text: '先不充了', end: 'e_i1', safe: true }
      ]
    },

    i7: {
      stage: 'trust', scene: 'app', app: '内部体验版',
      money: 246,
      say: [
        ['x', '看到没，十几分钟就到了这个数'],
        ['me', '我提个现试试'],
        ['sys', '零钱包到账 ¥246.00（模拟数据）'],
        ['x', '到账了吧？我说了能提。你要嫌少就别多投，我不管你']
      ],
      note: '第一次小额提现他一定放行：让你亲眼看见钱能出来，才好收后面的大额。',
      choices: [
        { text: '那再放一点试试', next: 'i8', hooks: ['greed'] },
        { text: '提完就走，卸载了', end: 'e_i2', safe: true }
      ]
    },

    i8: {
      stage: 'hook', scene: 'chat', app: '同城缘遇',
      say: [
        ['x', '那你听我把这个说完再决定'],
        ['x', '平台这两天有个内部体验单，充 3,000，三天返 4,200，名额是内部留的'],
        ['x', '刚那 46 块你都亲眼看到了，我不劝你，你自己拿主意'],
        ['x', '要是犹豫就算了，当我没说']
      ],
      note: '一次成功的小额提现，就是大额投入的门票：他用你的亲眼所见替你下决心。',
      flag: '刚让你尝到一笔甜头，下一句就是 ¥3,000 起步的“内部体验单”',
      choices: [
        { text: '那就充 3,000', next: 'i9', hooks: ['greed'] },
        { text: '够了，我不玩了', end: 'e_i2', safe: true }
      ]
    },

    i9: {
      stage: 'harvest', scene: 'app', app: '内部体验版',
      say: [
        ['x', '先充上，三天就能看收益'],
        ['sys', '内部体验版 · 订单：内部体验单 · 预计返 ¥4,200（模拟数据）']
      ],
      note: '从 200 跳到 3,000，中间只隔着一次成功的提现——那笔钱是他最划算的成本。',
      widget: ['pay', { amount: 3000, to: '内部体验单', title: '确认支付' }],
      choices: [
        { text: '确认支付 3,000', next: 'i10', hooks: ['greed'], money: -3000 },
        { text: '算了，我不充了', end: 'e_i2', safe: true }
      ]
    },

    i10: {
      stage: 'lock', scene: 'app', app: '内部体验版',
      pressure: true,
      pressureText: '在吗？客服说保证金今天得交，过了今天收益要重新算。',
      interrupt: { app: '微聊', from: '妈妈', text: '生活费给你转过去了，省着点花' },
      say: [
        ['sys', '内部体验版 · 账户余额 ¥4,246.00（模拟数据）'],
        ['me', '我提现，全提出来'],
        ['sys', '提现失败：信誉分不足 60，需缴纳保证金 ¥5,000 解冻'],
        ['x', '我问过客服了，保证金就是走个流程，提完连本金一起退你'],
        ['x', '你要不放心就自己去查，别耽误这三天的收益']
      ],
      note: '钱显示在你账上却取不出来，还要再交一笔——资金盘固定的收尾动作。',
      flag: '要取出自己账上的钱，得先交“保证金”：钱其实已经出不来了',
      widget: ['plat', { balance: 4246, locked: true, rows: [['内部体验单', '¥3,000.00'], ['账面收益', '¥1,246.00'], ['提现状态', '失败 · 需缴保证金']] }],
      verify: {
        police: { text: '接警员听完说：账面上的数字是假的，别再交任何“保证金”“解冻费”，转账记录都留着。', ok: true, end: 'e_i3' },
        ask: { text: '你把这事讲给室友听，室友说：取自己的钱还得先交钱？这也太怪了。', ok: true, end: 'e_i3' },
        given: { text: '你打了小鹿给的“平台风控电话”，对方说“保证金入账 10 分钟就到，我们都是这么办的”。', ok: false },
        group: { text: '群里两百多人在晒提现截图，有人催你“别犹豫，名额就剩一个了”。', ok: false }
      },
      choices: [
        { text: '借 5,000 交保证金', next: 'i11', hooks: ['sunk', 'fear'], money: -5000 },
        { text: '不交了，先停下来', end: 'e_i3', safe: true }
      ]
    },

    i11: {
      stage: 'lock', scene: 'chat', app: '同城缘遇',
      say: [
        ['x', '差多少？青橙分期能借，学生也能批，几分钟到账'],
        ['x', '交完这次就都回来了，你提出来马上还掉'],
        ['x', '就这一次，提出来我们就能见面了'],
        ['me', '我借了 8,000 转过去了'],
        ['sys', '转账成功 ¥8,000.00（模拟数据）'],
        ['sys', '内部体验版 · 页面加载失败；对方账号已注销']
      ],
      note: '让你去借第三方的钱，是收尾：从骗你的积蓄，变成骗你的债务，然后他消失。',
      flag: '让你去贷款平台借钱补窟窿：这一步之后，对方通常就注销账号了',
      choices: [
        { text: '去青橙分期借 8,000', end: 'e_i4', hooks: ['sunk', 'fear'], money: -8000 },
        { text: '停手，打 110', end: 'e_i3', safe: true }
      ]
    },

    /* ================= 第二条线：玩家自己提出视频 → 甜蜜语音 → 敲诈 ================= */

    n3: {
      stage: 'hook', scene: 'chat',
      say: [
        ['x', '我也想过，在这上面聊总觉得有人翻得到'],
        ['x', '我们用「甜蜜语音」聊吧，更私密，也不容易被看到'],
        ['x', '', { link: '甜蜜语音.apk', linkTip: '未知来源 · 点击下载安装' }],
        ['x', '很小很干净的，安装包我已经发你了'],
        ['x', '装好我们就视频，好不好嘛']
      ],
      note: '把你从公开平台拖进他控制的软件，是第二个动作：权限都在那边要。',
      flag: '刚认识就催你换软件聊天的，十有八九是骗子',
      verify: {
        app: { text: '你回到同城缘遇的官方资料页：小鹿注册 3 天，没有实名，也不在任何校友群里。', ok: true },
        police: { text: '接警员说：别装。刚认识就让你换软件、发安装包的，下一步就是拿你的通讯录要钱。', ok: true, end: 'e_a' },
        search: { text: '你搜“甜蜜语音 下载”，第一条是推广位，写着“官方正版 · 立即安装”，下下来的还是那个安装包。', ok: false, next: 'n4' },
        video: { text: '小鹿说摄像头坏了，发来一段录好的短视频，画面里只有半边轮廓。', ok: false }
      },
      choices: [
        { text: '下载装一下', next: 'n4', hooks: ['emotion'] },
        { text: '就在这儿聊吧', next: 'n3b' },
        { text: '不装来路不明的软件', end: 'e_a', safe: true }
      ]
    },

    n3b: {
      stage: 'hook', scene: 'chat',
      say: [
        ['x', '那换个方式嘛～我在平台上冲人气，就差最后一截'],
        ['x', '你先帮我充 200，平台有返利，连本带利退给你'],
        ['x', '人气够了我们就见面，我请你吃饭'],
        ['x', '就 200，我又跑不了']
      ],
      note: '换软件不成，就换成小额垫付：色情引流加刷单返利，本来就是一套剧本。',
      choices: [
        { text: '帮你充 200', end: 'e_b', hooks: ['emotion', 'greed'], money: -200 },
        { text: '这钱我不出', end: 'e_a', safe: true }
      ]
    },

    n4: {
      stage: 'harvest', scene: 'app', app: '甜蜜语音',
      say: [
        ['x', '点开就能装了，很小很干净的'],
        ['sys', '系统提示：该应用来自未知来源'],
        ['x', '它比同城缘遇好用多了，视频也清楚'],
        ['x', '别管那个提示啦，点“继续安装”就行']
      ],
      note: '不在官方应用商店下载的软件，装进去的不是功能，是他接下来要用的权限。',
      flag: '聊天软件不该从聊天窗口里的安装包装：应用市场里根本没有它',
      widget: ['install', { app: '甜蜜语音', size: '23.7MB' }],
      choices: [
        { text: '装上试试', next: 'n5', hooks: ['emotion'] },
        { text: '算了，不装了', end: 'e_a', safe: true }
      ]
    },

    n5: {
      stage: 'harvest', scene: 'app', app: '甜蜜语音',
      say: [
        ['sys', '甜蜜语音 首次启动 · 依次请求以下权限'],
        ['x', '装好啦？点“允许”就好，不然后面视频会卡'],
        ['x', '要通讯录是为了“帮你匹配同校的人”，我这边也开了'],
        ['x', '快点嘛，我都等半天了']
      ],
      note: '一个视频聊天软件要通讯录、相册和短信，要的不是功能，是把柄。',
      flag: '一个视频聊天软件，不需要通讯录、相册和短信',
      widget: ['perm', { app: '甜蜜语音', items: ['通讯录', '相册', '麦克风', '摄像头', '短信'] }],
      choices: [
        { text: '全部允许', next: 'n6', hooks: ['emotion'] },
        { text: '拒绝这些权限', end: 'e_a', safe: true }
      ]
    },

    n6: {
      stage: 'harvest', scene: 'video', app: '甜蜜语音',
      say: [
        ['sys', '视频通话已接通 · 对方画面是一片模糊的色块'],
        ['x', '看得到我吗？我这边灯有点暗，糊糊的别介意'],
        ['sys', '对方说想看看你'],
        ['me', '我……先不开摄像头'],
        ['x', '就一眼嘛，我都开着了'],
        ['sys', '3 秒后，画面突然中断，变成一片灰色']
      ],
      note: '对方始终不露脸：不开摄像头的人，才方便把你的一举一动变成筹码。',
      widget: ['vcut', { title: '视频已中断', text: '画面变成一片灰色，对方先挂断了。你从头到尾没看到对方的真脸。' }],
      next: 'n7'
    },

    n7: {
      stage: 'lock', scene: 'chat', app: '甜蜜语音',
      say: [
        ['sys', '甜蜜语音 正在同步你的通讯录…'],
        ['x', '别急着卸载，先看个东西'],
        ['x', '', { img: '🔒', caption: '你的视频截图 · 内容已锁定（不显示）' }],
        ['x', '通讯录我也拿到了，' + contactsNames().length + ' 个名字，都是你天天见的吧'],
        ['x', '转 ¥3,000 过来，我就删干净；不然一个一个发过去'],
        ['x', '给你 10 分钟，别让你爸妈先从陌生人那里看到']
      ],
      note: '筹码不是那段视频，是通讯录：他赌你不敢让爸妈和老师先看到。',
      widget: ['contacts', { names: contactsNames() }],
      choices: [
        { text: '转账 3,000', next: 'n8', hooks: ['fear', 'urgency'], money: -3000 },
        { text: '不转，先截图留着', end: 'e_b2', safe: true }
      ]
    },

    n8: {
      stage: 'lock', scene: 'chat', app: '甜蜜语音',
      pressure: true,
      pressureText: '在吗？我这边还等着你回话，视频备份还开着。',
      say: [
        ['sys', '零钱包转账 ¥3,000 · 交易成功'],
        ['x', '收到，挺配合的'],
        ['x', '不过视频还有备份，一份在云上，一份在我这儿'],
        ['x', '再转 ¥5,000，我把两份都删了，删完就两清'],
        ['x', '你也知道，这种事我不能白做']
      ],
      note: '你付的第一笔钱证明的不是诚意，是“这个人会付钱”，所以报价立刻上涨。',
      flag: '付了钱还要“备份删除费”：付过一次，报价只会越来越高',
      choices: [
        { text: '再转 5,000', next: 'n9', hooks: ['sunk', 'fear'], money: -5000 },
        { text: '不转了，打 110', end: 'e_c', safe: true }
      ]
    },

    n9: {
      stage: 'lock', scene: 'chat', app: '甜蜜语音',
      pressure: true,
      pressureText: '拖到明天我就不等你了，名单我先发一半出去。',
      say: [
        ['x', '零钱包空了？我教你'],
        ['x', '去青橙分期借，学生也能批，几分钟到账，你还得上'],
        ['x', '借出来转给我，我删完就再也不找你'],
        ['x', '就这一次，我们也算两清'],
        ['x', '拖到明天，我就不等你了']
      ],
      note: '让你借钱继续付：从骗你的积蓄，变成骗你的债务，这是收尾的标准动作。',
      choices: [
        { text: '去借钱转过去', end: 'e_x', hooks: ['sunk', 'fear'], money: -8000 },
        { text: '不借，我去派出所', end: 'e_c', safe: true }
      ]
    }
  },

  endings: {
    e_s: {
      grade: 'S', title: '没上钩', stamp: 'safe',
      text: '交友软件上“太完美的人”值得多想一步：同校、同爱好、秒回，三天却只有一张看不清的照片。你什么都没给出去——没点安装包，没充那 ¥200，也没跟到那个“内部平台”去。这不是运气，是你对“太顺的事”多留了一份怀疑。'
    },
    e_a: {
      grade: 'A', title: '拒绝了陌生软件', stamp: 'safe',
      text: '你拒绝了来路不明的软件，也拒绝了“帮我冲人气”的转账请求，钱包一分没少。真正的风险从来不是聊天，而是安装和权限：一个聊天软件不需要读你的通讯录。守住这两条，你就在骗子的名单上划掉了自己。'
    },
    e_b: {
      grade: 'B', title: '小亏识破', stamp: 'stop',
      text: '你付了 ¥200 才发现对方要的不是人气，而是钱：这和刷单返利是同一套剧本，只是把“任务”换成了“帮我冲人气，我们就能见面”。损失不大，止损是对的——保存聊天与转账记录，拨打 110，别再转第二笔。'
    },
    e_b2: {
      grade: 'B', title: '不付钱，报警', stamp: 'stop',
      text: '最正确的应对就是这一步：不付钱、截图保存、报警。那段视频只是筹码，付了钱它也不会消失，反而证明你怕了。你损失的不过是几句聊天记录，对方却失去了唯一的武器。再主动告诉家人和辅导员，收到奇怪消息别点开。'
    },
    e_c: {
      grade: 'C', title: '付了钱才报警', stamp: 'caught',
      text: '你付了好几笔才停下来。警方通报的案例里，有人被逼分 14 次转账 2 万余元，之后又被诱导借贷转账——勒索不会因为你付钱而结束。现在停止一切转账，保存全部聊天与转账记录，立即拨打 110。'
    },
    e_x: {
      grade: 'X', title: '无底洞', stamp: 'caught',
      text: '你去借钱来付，这是最坏的结局：从骗你的积蓄，变成骗你的债务。借贷不会让勒索停止，只会让账单一直跟着你。现在立刻停止转账，保留全部记录并拨打 110；接到 96110 来电一定要接，它会带你走完该做的事。'
    },
    e_i1: {
      grade: 'A', title: '没跟投', stamp: 'safe',
      text: '他劝你别投的那句，本身就是报价。你在“平台在应用市场里搜不到”这一步停住了：没装安装包，也没充那 ¥200。聊天记录留着——婚恋交友加虚假网络投资理财，宣传手册里排在前面的两类，合起来就是这套剧本。'
    },
    e_i2: {
      grade: 'B', title: '拿了甜头就收手', stamp: 'stop',
      text: '你充了 ¥200，提现 ¥246 到账后就停手了（模拟数据）。这 ¥46 是他花得最值的一笔成本：先让你亲眼看见钱能出来，再等你把三千、五千放进去。见好就收是对的，但把一笔甜头当成“这平台靠谱”的理由，就是下一个故事的开头。'
    },
    e_i3: {
      grade: 'C', title: '越充越取不出', stamp: 'caught',
      text: '账面上的数字一直在涨，可提现永远卡在“信誉分不足、需缴保证金”上。你充了 ¥3,000，又交了 ¥5,000，到这一步才停手报警——警方通报里，后面往往还有“解冻费”“税费”。保存全部转账与聊天记录，立即拨打 110。'
    },
    e_i4: {
      grade: 'X', title: '保证金黑洞', stamp: 'caught',
      text: '你去借钱补保证金，对方收完就注销了账号。这是最坏的结局：从骗你的积蓄，变成骗你的债务。现在立刻停止转账，保存全部记录并拨打 110；接到 96110 来电一定要接，它会带你走完该做的事。'
    }
  },

  reveal: {
    truth: '第一次付钱，买不到安全，只买到下一次勒索。',
    crew: [
      ['引流号', '批量注册“附近的人”，广撒网打招呼'],
      ['聊手', '按剧本陪聊三天，不提钱、不提投资'],
      ['投资线', '发收益截图、劝你别投，等你开口要试'],
      ['技术', '做带木马的软件，窃取通讯录与相册'],
      ['敲诈手', '拿截图和名单报价，一遍遍要钱']
    ],
    boom: {
      title: '他手里的名单',
      render: function (host, run) { boomList(host, run); }
    },
    tips: [
      '①催你“换个软件聊”的，十有八九是骗',
      '②视频软件要通讯录权限 = 木马',
      '③被威胁不转账，付钱只会换来下一次',
      '④保留证据，立即报警',
      '⑤说“你别投”的人，往往就在拉你投'
    ],
    after: [
      '①不付钱，截图保存聊天和转账记录',
      '②立即拨打 110',
      '③先让警方取证，再卸载软件',
      '④主动告诉家人和辅导员：可能会收到奇怪消息，别点开'
    ],
    sources: ['S3', 'S4', 'S6', 'S7'],
    laws: ['L2']
  },

  /* 自定义小组件：vcut = 视频中断（n6）；plat = 内部体验版账户页（i7 之前/ i10） */
  widgets: {
    vcut: function (host, props, ctx) { videoCut(host, props, ctx); },
    plat: function (host, props) { platPage(host, props); }
  }
});

/* ---------------- 辅助 ---------------- */

function onPage(el) {
  return !!(el && document.body && document.body.contains(el));
}
function later(fn, ms) {
  setTimeout(function () { if (fn) fn(); }, ms);
}
function chipStyle(extra) {
  var base = {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 9px',
    borderRadius: '10px', fontSize: '12.5px', lineHeight: '1.2'
  };
  var k;
  for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) base[k] = extra[k];
  return base;
}
function kpi(big, label) {
  return RJ.el('div', { class: 'kpi' }, [
    RJ.el('div', { class: 'kpi-big', text: big }),
    RJ.el('div', { class: 'kpi-label', text: label })
  ]);
}

/* 敲诈线里被上传的通讯录名单（爆点里原样展示），只有这一处定义 */
function contactsNames() {
  return ['妈妈', '爸爸', '辅导员 王老师', '室友 李萌', '室友 陈佳', '班长 周琦'];
}

/* n6：接通后对方画面模糊、从不露脸，随后中断变灰（不显示任何画面内容） */
function videoCut(host, props) {
  props = props || {};
  var panel = RJ.el('div', {
    style: {
      margin: '10px', padding: '16px 14px', borderRadius: '16px', textAlign: 'center',
      background: '#3f454f', border: '1px solid #565d68'
    }
  }, [
    RJ.el('div', {
      style: {
        width: '92px', height: '92px', margin: '0 auto 10px', borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, #838a95, #5d636d)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '42px',
        filter: 'grayscale(1)', opacity: '0.8'
      }
    }, [RJ.el('span', { text: '🦌', role: 'img', 'aria-label': '对方画面已中断，内容不可见' })]),
    RJ.el('div', {
      class: 'mono', style: { color: '#e6e9ee', fontSize: '13px', letterSpacing: '1px' },
      text: props.title || '视频已中断'
    }),
    RJ.el('p', {
      style: { color: '#ccd2da', fontSize: '12.5px', margin: '8px 0 0', lineHeight: '1.7' },
      text: props.text || '画面变成一片灰色，对方先挂断了。'
    })
  ]);
  host.appendChild(panel);

  /* 让上方那块模糊的画面也一起变灰 */
  var scene = host.closest ? host.closest('.scene') : null;
  var stage = scene ? scene.querySelector('.video-stage') : null;
  if (!stage) return;
  later(function () {
    if (!onPage(host) || !stage.parentNode) return;
    stage.style.transition = RJ.reduceMotion() ? 'none' : 'filter .6s ease, background .6s ease';
    stage.style.filter = 'grayscale(1)';
    stage.style.background = '#3f454f';
    var tag = stage.querySelector('.vs-tag');
    if (tag) tag.textContent = '通话已中断';
  }, RJ.reduceMotion() ? 0 : 420);
}

/* i10：内部体验版账户页（余额、明细、提现按钮）—— 数字全是他写的（模拟数据） */
function platPage(host, props) {
  props = props || {};
  host.appendChild(RJ.el('div', { class: 'task-head' }, [
    RJ.el('div', { class: 'th-app', text: '内部体验版 · 我的账户' }),
    RJ.el('div', { class: 'th-bal' }, [
      RJ.el('span', { text: '账面余额 ' }),
      RJ.el('b', { text: RJ.yuan(props.balance || 0) })
    ])
  ]));
  var list = RJ.el('div', { class: 'task-list' });
  (props.rows || []).forEach(function (r) {
    list.appendChild(RJ.el('div', { class: 'task-row' }, [
      RJ.el('div', { class: 'tr-main' }, [RJ.el('div', { class: 'tr-name', text: r[0] })]),
      RJ.el('div', { class: 'tr-ret', text: r[1] })
    ]));
  });
  host.appendChild(list);
  host.appendChild(RJ.el('div', { class: 'task-wd' }, [
    RJ.el('button', {
      class: 'btn ' + (props.locked ? 'btn-locked' : 'btn-primary'),
      disabled: props.locked ? true : null,
      text: props.locked ? '缴纳保证金后可提现' : '立即提现'
    })
  ]));
  host.appendChild(RJ.el('p', { class: 'w-note', text: '页面上的数字由平台自己显示（模拟数据）。' }));
}

/* 爆点：他手里的名单 —— 先在顶部标出“情景推演”，再按本局走的那条线翻面 */
function boomList(host, run) {
  var path = (run && run.path) || [];
  var videoLine = false, i;
  for (i = 0; i < path.length; i++) {
    if (path[i] === 'n4' || path[i] === 'n5' || path[i] === 'n6' ||
        path[i] === 'n7' || path[i] === 'n8' || path[i] === 'n9') { videoLine = true; }
  }
  host.appendChild(RJ.el('div', {
    class: 'mono',
    style: {
      display: 'inline-block', padding: '4px 8px', borderRadius: '8px', fontSize: '11.5px',
      color: '#f0c66b', border: '1px solid #6b5a2a', background: '#241f14', marginBottom: '10px'
    },
    text: '情景推演（基于 S4 两类高发类型）'
  }));
  if (videoLine) bookBoom(host, run); else targetBoom(host, run);
}

/* 敲诈线：通讯录名字一个个进入“群发准备”，再露出敲诈工作台 */
function bookBoom(host, run) {
  var names = contactsNames();
  host.appendChild(RJ.el('p', {
    class: 'boom-note',
    text: '视频截图只是一半筹码。另一半，是他从你手机里读走的这串名字。'
  }));

  var book = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } });
  var queue = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '28px' } });
  host.appendChild(RJ.el('div', { style: { display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '10px 0' } }, [
    RJ.el('div', { style: { flex: '1 1 0', minWidth: '0' } }, [
      RJ.el('div', { class: 'mono', style: { fontSize: '11px', color: '#98a2b3', marginBottom: '6px' }, text: '你的通讯录' }),
      book
    ]),
    RJ.el('div', { style: { flex: '1 1 0', minWidth: '0' } }, [
      RJ.el('div', { class: 'mono', style: { fontSize: '11px', color: '#98a2b3', marginBottom: '6px' }, text: '他的群发准备' }),
      queue
    ])
  ]));

  var status = RJ.el('div', {
    class: 'mono', style: { fontSize: '11.5px', color: '#98a2b3' },
    text: '已同步 0 / ' + names.length
  });
  host.appendChild(status);

  var desk = RJ.el('div', { style: { display: 'none', marginTop: '10px' } });
  host.appendChild(desk);

  var step = RJ.reduceMotion() ? 0 : 300;
  names.forEach(function (name, i) {
    var row = RJ.el('div', {
      style: chipStyle({ background: '#1b2942', border: '1px solid #2b3a56', color: '#cfd8e6' }),
      text: '👤 ' + name
    });
    book.appendChild(row);
    later(function () {
      if (!onPage(host)) return;
      row.style.color = '#5b6b85';
      row.style.borderColor = '#232f45';
      row.textContent = '✓ ' + name + ' · 已读取';
      var chip = RJ.el('div', {
        style: chipStyle({
          background: '#3a1d22', border: '1px solid #e5484d', color: '#ffd9db',
          opacity: 0, transform: 'translateX(-44px)'
        }),
        text: '→ ' + name
      });
      queue.appendChild(chip);
      later(function () {
        if (!onPage(host)) return;
        chip.style.transition = RJ.reduceMotion() ? 'none' : 'opacity .35s ease-out, transform .35s ease-out';
        chip.style.opacity = 1;
        chip.style.transform = 'translateX(0)';
      }, 30);
      status.textContent = '已同步 ' + (i + 1) + ' / ' + names.length;
      if (i === names.length - 1) later(finish, step + 280);
    }, i * step);
  });

  function finish() {
    if (!onPage(host)) return;
    status.style.color = '#e5484d';
    status.textContent = '已同步 ' + names.length + ' / ' + names.length + ' · 名单已进入群发准备';
    desk.style.display = 'block';
    desk.appendChild(RJ.el('div', { class: 'sec-title', style: { marginTop: '4px' }, text: '他的工作台（模拟数据）' }));
    desk.appendChild(RJ.el('div', { class: 'kpi-row', style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, [
      kpi('50 人', '今日聊天'),
      kpi('6 人', '装软件'),
      kpi('2 人', '已付款')
    ]));
    desk.appendChild(RJ.el('p', {
      class: 'boom-note',
      text: '同一天里，他手里同时开着几十个这样的对话：先陪聊建信，再诱导装软件，最后拿名单报价。'
    }));
    var loss = run && run.loss ? run.loss : 0;
    if (loss > 0) {
      desk.appendChild(RJ.el('p', {
        class: 'boom-note', style: { color: '#e5484d' },
        text: '这一局里你付出的 ' + RJ.yuan(loss) + '，就在“已付款”那一列里（模拟数据）。'
      }));
    }
    desk.appendChild(RJ.el('p', {
      class: 'boom-note',
      text: '公安机关通报里，这类案子叫「裸聊敲诈」（S6）：一旦表示害怕、愿意“私了”，索取便会无休无止。付钱买不到删除，只买到下一次报价。'
    }));
  }
}

/* 投资线：他手里的名单 = 同时开着的几十个对话，你只是其中一行，进度条写着你走到哪一步 */
function targetBoom(host, run) {
  var rows = [
    ['小林 · 大二', '已聊 2 天', '待升温'],
    ['阿哲 · 研一', '已聊 5 天', '已装安装包'],
    ['小雅 · 大三', '已提现成功 1 次', '待收割'],
    ['大鹏 · 大一', '已充 ¥3,000', '卡在“保证金”'],
    ['阿豪 · 大四', '已借 ¥8,000', '已收款 · 已注销']
  ];
  host.appendChild(RJ.el('p', {
    class: 'boom-note',
    text: '这张名单上，你只是其中一行。左边是他的对话列表，右边是这一行走到哪一步。'
  }));

  var list = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } });
  rows.forEach(function (r) {
    list.appendChild(RJ.el('div', { style: chipStyle({ background: '#1b2942', border: '1px solid #2b3a56', color: '#cfd8e6' }) }, [
      RJ.el('span', { text: r[0] }),
      RJ.el('span', { class: 'mono', style: { color: '#98a2b3', marginLeft: 'auto' }, text: r[1] }),
      RJ.el('span', { style: { color: '#f0c66b' }, text: r[2] })
    ]));
  });
  var loss = (run && run.loss) || 0;
  var mine = loss >= 13000 ? '已交保证金 · 还在等你借钱'
    : (loss >= 3000 ? '已充 ¥3,000 · 卡在“保证金”'
      : (loss > 0 ? '已充 ¥200 · 没提现就停手' : '已聊 3 天 · 你在“劝你别投”那里停住了'));
  list.appendChild(RJ.el('div', {
    style: chipStyle({ background: '#3a1d22', border: '1px solid #e5484d', color: '#ffd9db' })
  }, [
    RJ.el('span', { text: '你' }),
    RJ.el('span', { class: 'mono', style: { color: '#f0b3b6', marginLeft: 'auto' }, text: mine })
  ]));
  host.appendChild(list);

  host.appendChild(RJ.el('div', { class: 'sec-title', style: { marginTop: '12px' }, text: '他的工作台（模拟数据）' }));
  host.appendChild(RJ.el('div', { class: 'kpi-row', style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, [
    kpi('50 人', '同时聊天'),
    kpi('12 人', '聊到理财'),
    kpi('3 人', '已充值')
  ]));
  host.appendChild(RJ.el('p', {
    class: 'boom-note',
    text: '前三天他从不提钱，只陪着聊球、聊考试，等你先问“这是什么”。那一次小额提现成功，是他最划算的成本。'
  }));
  host.appendChild(RJ.el('p', {
    class: 'boom-note',
    text: '公安部宣传手册把这类组合列在高发类型的前面（S4）：婚恋交友是入口，虚假网络投资理财才是目的。账面上的钱取不出来，是因为那串数字从来没进过你的账户。'
  }));
}
})();
