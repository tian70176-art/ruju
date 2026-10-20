/* 入局 · 大学生反诈沉浸实验室 —— paotui.js
 * 同城跑腿（帮人取送包裹）· 掩饰、隐瞒犯罪所得 —— 规格见 方案/40 §4.1，来源 S15。
 * 该模块只做一件事：调用 RJ.register(def)。
 */
(function () {
  'use strict';

  RJ.register({
    id: 'paotui',
    title: '同城跑腿',
    type: '掩饰、隐瞒犯罪所得（跑腿代收）',
    role: 'accomplice',
    dirtyLabel: '赃款跑腿费',
    app: { name: '跑腿帮', icon: '🛵', color: '#ff9f1c' },
    lockNotice: { app: '跑腿帮', title: '【跑腿帮】', body: '新单：取件送到城西，跑一趟 ¥300，日结' },
    inbox: {
      time: '10:45', app: '校友圈', from: '阿哲（同城跑腿）',
      text: '学弟，找个轻松的活：帮人取个快递送到指定地点，一趟 ¥300，当天结。'
    },
    inbox2: {
      time: '10:45', app: '微聊', from: '老赵（招兼职）',
      text: '{name}，我这边缺个跑腿的，取件送件，一趟 ¥300，现结，加我另一个号细聊。'
    },
    variant: {
      n1: {
        say: [
          ['a', '同学，看到你之前问兼职，我这边有个跑腿的活。'],
          ['a', '就是帮人取个快递，送到指定地点，一趟 ¥300，当天结给你。'],
          ['a', '不过我们这行有规矩：别在常用软件上聊，加我这个号，聊天记录我说了算，定时清掉。'],
          ['a', '放心，都是同城的，取件码我发你，你只管拿和送。']
        ]
      },
      n2: {
        say: [
          ['sys', '你按他给的取件码，从快递柜里取出一个牛皮纸袋，送到城东一个小区门口。'],
          ['sys', '对方接过去看都没看，扫了你的收款码。'],
          ['a', '到账了吧？说好 ¥300，我这人从不拖。'],
          ['a', '明天还有两单，一样简单。']
        ]
      }
    },
    cast: {
      a: { name: '阿哲', avatar: '🧑‍💼' },
      j: { name: '民警', avatar: '👮' }
    },
    verifyText: {
      orig: '你翻了一遍聊天记录：这个人是你三天前在兼职帖底下被加上的，你们没有任何共同好友。'
    },
    start: 'n1',
    nodes: {
      n1: {
        stage: 'lure', scene: 'chat', contact: '阿哲（同城跑腿）',
        say: [
          ['a', '学弟，过来人跟你说个轻松的活。'],
          ['a', '帮人取个快递，送到指定地点，一趟 ¥300，当天结。'],
          ['a', '就一个规矩：别在常用软件上聊，加我这个号，聊天记录我这边会定时清。'],
          ['a', '你要是不放心，先做一单试试，钱立刻到账。']
        ],
        note: '第一句话就把「规矩」定好了：换软件、清记录——他要的不是你跑腿，是你别留下痕迹。',
        flag: '只用另一个号联系、聊天记录定时清：这不是跑腿行规，是怕留下证据',
        verify: {
          police: { text: '接警员说：帮陌生人取送不明包裹、代收代转，很可能是在帮人转移赃物，学生被拉下水的不少', ok: true },
          ask: { text: '你问了表哥：他说正经跑腿平台都要实名接单、全程有记录，不会让你换软件聊', ok: true },
          app: { text: '你在国家反诈中心 App 里查了「跑腿代收」：正规平台不会让人代收来路不明的包裹', ok: true },
          search: { text: '搜索结果第一条是广告位，写着「学生兼职跑腿，日结 300，无需经验」', ok: false },
          given: { text: '你打了阿哲给的「公司电话」，对方说：放心做，我们跟很多学生合作过', ok: false },
          group: { text: '你被拉进「跑腿兼职群」，里面几十个人都在晒当天的到账截图', ok: false },
          video: { text: '你说想视频看看公司，他说在仓库忙，先接单再说', ok: false }
        },
        choices: [
          { text: '怎么做？', next: 'n2', hooks: ['greed'] },
          { text: '最近没空，下次吧', end: 'e_s', safe: true }
        ]
      },
      n2: {
        stage: 'trust', scene: 'chat',
        say: [
          ['sys', '你按他给的取件码，从快递柜里取出一个文件袋，送到城西一个小区门口。'],
          ['sys', '接件的人接过就转身走了，没说话。'],
          ['a', '到账了吧？说好 ¥300。'],
          ['a', '这就对了。明天还有两单，比这还简单。']
        ],
        note: '第一单故意给你一个真包裹、真到账：让你相信「只是跑腿」，再用第二单把你带进去。',
        widget: ['bank', { items: [{ from: '跑腿费 · 已到账', amt: 300, memo: '同城跑腿' }], fee: 0 }],
        money: 300,
        choices: [
          { text: '继续接单', next: 'n3', hooks: ['greed'] },
          { text: '就做这一单', end: 'e_a', safe: true }
        ]
      },
      n3: {
        stage: 'hook', scene: 'chat',
        say: [
          ['a', '这单是客户的首饰，有点沉，你拿稳。'],
          ['a', '取件地点我发你，别问里面是什么，也别跟人说你送过什么。'],
          ['a', '这单给你 ¥300，还是当天结。']
        ],
        note: '第二单开始「不许问」：他不是怕你弄丢，是怕你知道自己运的是什么。',
        flag: '每一次都换取件地点、不许问包裹里是什么——正常跑腿不需要保密',
        choices: [
          { text: '接着干', next: 'n4', hooks: ['greed', 'sunk'] },
          { text: '不干了，钱退回去', end: 'e_b', safe: true }
        ]
      },
      n4: {
        stage: 'harvest', scene: 'chat',
        say: [
          ['a', '你一个人跑太慢了，叫上你室友一起，两个人一趟，我每人每天加 ¥100。'],
          ['a', '反正就是取件送件，他不用知道太多。'],
          ['sys', '他发来一个红包：定金 ¥100。']
        ],
        note: '拉人这一步最狠：你成了链条上的一个节点，还替他把下一个人带了进来。',
        flag: '一趟 ¥300 远高于正常跑腿价——多出来的钱，买的是你「不问」',
        widget: ['pay', { amount: 100, to: '阿哲', title: '收下定金' }],
        money: 100,
        choices: [
          { text: '叫上室友一起', next: 'n5', hooks: ['greed', 'emotion'] },
          { text: '我不干，也不带人', end: 'e_b', safe: true }
        ]
      },
      n5: {
        stage: 'lock', scene: 'chat',
        say: [
          ['sys', '你去快递柜取件，柜子旁边有个男人一直在看你。'],
          ['sys', '你取出那个盒子，他没动；你走，他也走。'],
          ['a', '拿到了吗？赶紧送过来，别在东张西望上耽误时间。']
        ],
        note: '跟踪你的不是骗子，是已经盯上这条线的警察——而你还在按指令往前走。',
        flag: '取件时有人一直看你：这条线已经被人盯上了',
        choices: [
          { text: '别管，快点送过去', next: 'n6', hooks: ['fear', 'urgency'] },
          { text: '停下来，不取了', end: 'e_b', safe: true }
        ]
      },
      n6: {
        stage: 'lock', scene: 'call', caller: '来电 · 辖区派出所',
        say: [
          ['j', '你好，我是辖区派出所的民警，你是 {name} 吧。'],
          ['j', '你这两天取的件，里面是别人被骗的钱和黄金。'],
          ['j', '你先别走，也别给任何人打电话，就在原地等我们过来。'],
          ['sys', '（手机里，阿哲的号已经打不通了。）']
        ],
        note: '到这一步你已经是链条上的一环：跑腿费是赃款的一部分，不是工资。',
        flag: '你经手的东西是黄金和现金：跑腿费拿的是赃款，可能构成掩饰、隐瞒犯罪所得',
        choices: [
          { text: '配合调查，如实说明', end: 'e_c', safe: true },
          { text: '这是我自己的东西', end: 'e_x' }
        ]
      }
    },
    endings: {
      e_s: {
        grade: 'S', title: '这活我不接', stamp: 'safe',
        text: '「换个软件聊、记录定时清、不许问包裹里是什么」——一条正常的兼职不需要这三样。你没接这一单，也就没有把自己放进别人的资金链里。真正缺人的跑腿平台都实名、可查、留记录，跑一趟也不止这个价。'
      },
      e_a: {
        grade: 'A', title: '只做了一单', stamp: 'safe',
        text: '你只送了第一单就收手，这一单里恰好只是一份文件。但你仍然替陌生人送了一次不明包裹、拿了一次不明来源的钱：如果那单里是赃物，这一趟就可能构成犯罪。以后再有「只取件不问内容」的活，直接拒绝。'
      },
      e_b: {
        grade: 'B', title: '在下一单之前收手', stamp: 'stop',
        text: '你问「里面是什么」，对方让你别问——你就在这一步停了。已经拿到的跑腿费建议主动交给民警说清楚，别等警察找上门。越早停，你在这条链条上留下的痕迹越少，能说清楚的余地越大。'
      },
      e_c: {
        grade: 'C', title: '跑腿费是赃款', stamp: 'caught',
        text: '你经手的不是快递，是别人被骗走的黄金和现金；你拿的不是工资，是赃款的一部分。配合调查是现在最该做的事：把每单的时间、取件码、联系人全部交出去。这类行为可能构成掩饰、隐瞒犯罪所得罪。'
      },
      e_x: {
        grade: 'X', title: '还拉了室友进来', stamp: 'caught',
        text: '面对民警你说「这是我自己的东西」，可那几单里有你室友送出去的件。一个人被骗，钱经你的手转了一圈；两个人被拉下水，性质更重。你以为在帮朋友找兼职，实际上是把他也放进了同一条链条。'
      }
    },
    reveal: {
      truth: '你跑的不是腿，是别人的钱。',
      crew: [
        ['发单人', '在校园兼职帖里物色学生，用「一趟 ¥300」开口'],
        ['取件人', '安排你去快递柜取黄金、现金，全程不见面'],
        ['接件人', '在小区门口接走包裹，转身进另一条线'],
        ['话务组', '这边收钱，那边继续骗下一个人']
      ],
      boom: {
        title: '包裹里是什么',
        render: function (host) {
          host.appendChild(RJ.el('p', { class: 'boom-note', text: '你送出去的三件东西，拆开是这样（情景还原，事实见 S15）：' }));
          var box = RJ.el('div', { class: 'boom-two' });
          function card(t, lines) {
            return RJ.el('div', { class: 'boom-two-card fake' }, [
              RJ.el('div', { class: 'boom-two-h', text: t })
            ].concat(lines.map(function (x) { return RJ.el('div', { class: 'boom-two-l', text: x }); })));
          }
          box.appendChild(card('第 1 件 · 文件袋', [
            '一张身份证、一张银行卡',
            '卡主是刚被骗完的另一个人',
            '你把它从一个区送到另一个区'
          ]));
          box.appendChild(card('第 2 件 · 首饰盒', [
            '一只金手镯，老人的“投资金”',
            '被“高回报”话术骗走的养老钱',
            '你送这一趟拿了 ¥300'
          ]));
          host.appendChild(box);
          host.appendChild(RJ.el('div', { class: 'boom-two', style: { marginTop: '10px' } }, [
            card('第 3 件 · 加密封袋', [
              '一批黄金，来自同一位受害者',
              '她先被“恋爱”，再被“折扣券”带着买黄金',
              '累计投入 20 余万元'
            ]),
            RJ.el('div', { class: 'boom-two-card real' }, [
              RJ.el('div', { class: 'boom-two-h', text: '为什么找你送' }),
              RJ.el('div', { class: 'boom-two-l', text: '学生、缺钱、只要现金' }),
              RJ.el('div', { class: 'boom-two-l', text: '一单几百块，比找“车手”便宜' }),
              RJ.el('div', { class: 'boom-two-l', text: '出了事，抓到的第一个是你' }),
              RJ.el('div', { class: 'boom-two-l', text: '你的学生身份，是他们最好的掩护' })
            ])
          ]));
          host.appendChild(RJ.el('p', { class: 'boom-note', text: '同一批钱：有人被“恋爱”骗去买黄金，你把它送到下一个地点，拿 ¥300。（来源 S15）' }));
        }
      },
      tips: [
        '①换软件聊、让清记录的兼职，不接',
        '②让你别问包裹里是什么的，不接',
        '③一趟价远高于行情的，多出来的是封口费',
        '④帮人取送不明包裹，可能构成掩隐罪'
      ],
      after: [
        '①立刻停手，不要再接单，也别再叫人',
        '②把每单的时间、地点、取件码、联系人交给民警',
        '③已经拿到的钱主动说明，别等警察找上门',
        '④室友也被拉进来的，一起去做说明'
      ],
      sources: ['S15'],
      laws: ['L3', 'L4']
    },
    /* 40 §4.1：结局页并排两张卡，讲清「帮信」与「掩隐」的区别（只用 L3/L4 已有表述） */
    endExtra: function (host) {
      host.appendChild(RJ.el('div', { class: 'sec-title', text: '同样是替人跑腿，罪名为啥不一样' }));
      var box = RJ.el('div', { class: 'boom-two' });
      box.appendChild(RJ.el('div', { class: 'boom-two-card fake' }, [
        RJ.el('div', { class: 'boom-two-h', text: '帮信 · 借卡给人过账' }),
        RJ.el('div', { class: 'boom-two-l', text: '你把银行卡、收款码交给别人用' }),
        RJ.el('div', { class: 'boom-two-l', text: '钱从你卡上进、从你卡上出' }),
        RJ.el('div', { class: 'boom-two-l', text: '可能构成帮助信息网络犯罪活动罪' })
      ]));
      box.appendChild(RJ.el('div', { class: 'boom-two-card real' }, [
        RJ.el('div', { class: 'boom-two-h', text: '掩隐 · 替人取送赃物' }),
        RJ.el('div', { class: 'boom-two-l', text: '你亲手把赃物从这里挪到那里' }),
        RJ.el('div', { class: 'boom-two-l', text: '黄金、现金经你的手转了一圈' }),
        RJ.el('div', { class: 'boom-two-l', text: '可能构成掩饰、隐瞒犯罪所得罪' })
      ]));
      host.appendChild(box);
      host.appendChild(RJ.el('p', { class: 'boom-note', text: '同样是「替人跑腿」，法律看的是你在这条链上做了什么。（条文见来源区的 L3、L4）' }));
    }
  });
})();
