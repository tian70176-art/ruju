/* 模块 xiaodai · 误开通直播会员自动扣费（冒充平台客服 → 冒充公检法）—— 规格见 方案/15、高手局见 方案/30 §3.5
 * 该模块只做一件事：调用 RJ.register(def)。
 */
(function () {
  'use strict';

RJ.register({
  id: 'xiaodai',
  title: '误开通直播会员',
  type: '冒充客服 → 冒充公检法',
  role: 'victim',
  app: { name: '电话', icon: '📞', color: '#4a5568' },
  lockNotice: { app: '电话', title: '【电话】', body: '未接来电 171****0000（3 次）' },
  inbox: { time: '16:15', app: '电话', from: '171****0000', text: '未接来电 3 次：您的直播会员今晚自动续费，回拨可取消' },
  inbox2: { time: '15:40', app: '电话', from: '171****0000', text: '未接来电 5 次：您有一笔直播会员连续包月今晚扣费，回拨可取消' },
  cast: {
    k: { name: '直播平台客服中心', avatar: '🎧' },
    p: { name: '市公安局刑侦支队 李警官', avatar: '👮' }
  },
  start: 'n1',

  /* 40 §3 第 2 变体：只换开场（inbox 文案 + n1/n2 的 say），话术结构与红旗位置不变 */
  variant: {
    n1: {
      say: [
        ['k', '您好，请问是 {name} 同学本人吗？我这边是直播平台客服中心，工号 07**'],
        ['k', '系统显示您上个月在校园福利活动里领了会员试用，试用到期自动转成了连续包月，每月扣费 ¥98'],
        ['k', '第一笔今晚 24 点就要扣了，我提前跟您说一声，要取消的话我这边可以帮您办'],
        ['k', '您现在是在 {school} 2025 级在读，对吧？当时登记的就是这个学籍'],
        ['k', '您不信也不要紧，可以现在就挂断，自己搜我们平台的官方客服电话核实'],
        ['k', '我在这儿等您几分钟，别急着挂']
      ]
    },
    n2: {
      say: [
        ['k', '我先把系统里的资料跟您对一遍，{name} 您听着'],
        ['k', '学号 2025****73，身份证后四位 8**7，绑定号码尾号 0000'],
        ['k', '开通时间是今年 4 月 8 日，校园福利渠道，很多人都是顺手点上的'],
        ['k', '资料都对得上，那我现在帮您提交取消申请'],
        ['k', '取消之前要做一次资金核验，确认是您本人的账户在操作，很快的']
      ]
    }
  },

  /* 模块级核实：走错渠道（搜出来的“官方电话”）会被同伙接住；走对渠道（官方 App / 110）当场识破 */
  verifyText: {
    orig: '你翻了通讯录：这个号码从来没存过，是一通陌生来电。',
    ask: '你把整通电话讲给室友听，室友说：正规平台取消会员不会让你转账。'
  },
  verify: {
    search: {
      ok: false,
      text: '搜索结果第一条是广告位，挂着“官方客服热线”的名头，排在真正的官方号码前面。接起来的人听完说：您的订单确实异常，我们帮您转取消流程。',
      next: 'v1'
    },
    app: {
      ok: true,
      text: '你在平台的官方 App 里翻了会员与订单：没有这笔直播会员，也没有任何待扣费记录。',
      end: 'e_s'
    },
    police: {
      ok: true,
      text: '接警员听完说：正规平台不会打电话让你取消会员，更不会让你转钱，挂了就行。',
      end: 'e_a'
    }
  },

  nodes: {
    n1: {
      stage: 'lure', scene: 'call', caller: '来电 · 171****0000',
      say: [
        ['k', '您好，请问是 {name} 同学本人吗？我这边是直播平台客服中心，工号 07**'],
        ['k', '后台显示您在校园推广活动里开通了直播会员连续包月，每月自动扣费 ¥98'],
        ['k', '第一笔今晚 24 点就要扣了，我提前跟您确认一下，需要的话我帮您取消'],
        ['k', '您现在是在 {school} 2025 级在读，对吧？当时登记的就是这个学籍'],
        ['k', '您不信也不要紧，可以现在就挂断，自己搜我们平台的官方客服电话核实'],
        ['k', '我在这儿等您几分钟，别急着挂']
      ],
      note: '一上来就先给你留好“挂断去核实”的出口——他要的正是这个动作。',
      flag: '报得出你的姓名、学校、年级，不等于它就是官方——这些信息早被卖过好几手',
      choices: [
        { text: '那怎么取消？', next: 'n2', hooks: ['authority'] },
        { text: '我先搜下官方客服电话', next: 'v1', hooks: ['authority'] },
        { text: '挂断，自己去官方 App 查', end: 'e_s', safe: true }
      ]
    },

    n2: {
      stage: 'trust', scene: 'call',
      say: [
        ['k', '我先把系统里的信息跟您核对一下，{name} 您听着'],
        ['k', '学号 2025****41，身份证后四位 8**7，绑定号码尾号 0000'],
        ['k', '开通时间是今年 3 月 12 日，校园渠道，很多人都是不小心勾上的'],
        ['k', '资料都对得上，那我现在帮您提交取消申请'],
        ['k', '取消之前要做一次资金核验，确认是您本人的账户在操作，很快的']
      ],
      note: '补上学号、身份证后四位，把“巧合”升级成“他们真的掌握我”，让你不敢再怀疑。',
      choices: [
        { text: '要核验什么？', next: 'n3', hooks: ['fear', 'authority'] },
        { text: '挂断，这事我自己去查', end: 'e_s', safe: true }
      ]
    },

    v1: {
      stage: 'trust', scene: 'call',
      say: [
        ['sys', '你挂断后搜了「官方客服电话」：第 1 条是广告位，你拨了过去'],
        ['k', '您好，这里是直播平台官方客服中心，工号 07**'],
        ['k', '您的会员订单确实显示异常，有一笔待扣费的连续包月'],
        ['k', '我已经帮您转到取消流程了，您配合同事办完就行'],
        ['k', '您这不就核实好了嘛，放心办吧']
      ],
      note: '搜索引擎第一条的位置是花钱买的。接这通电话的，和刚才那位是一伙人。',
      flag: '搜索排第 1 的“官方客服电话”多半是广告位，打过去是同一个团伙',
      verify: {
        search: { ok: false, text: '你正打着的这个“客服”，和刚才那位是同一伙人：号码不同，话术一模一样。' }
      },
      choices: [
        { text: '好，那你帮我办', next: 'n2', hooks: ['authority'] },
        { text: '我先去官方 App 看看', end: 'e_s', safe: true }
      ]
    },

    n3: {
      stage: 'hook', scene: 'call',
      say: [
        ['k', '您先在手机上下载我们的核验 App，把屏幕共享打开，我远程看着您操作'],
        ['k', '然后把您卡里的钱转到核验账户走一遍，验完原路退回，一分都不会少'],
        ['k', '钱只是走个流程，全程都在系统里留痕，您随时能查'],
        ['k', '今天办完，今晚就不会扣那 ¥98 了']
      ],
      note: '把“取消会员”偷换成“转钱核验”，中间还插了一个屏幕共享。',
      flag: '正规取消会员不需要你转账，更不需要屏幕共享——任何“核验账户”都是圈套',
      verify: {
        search: { ok: false, text: '你搜到的那条“官方客服热线”说：核验流程没问题，让您继续办，别耽误时间。' }
      },
      choices: [
        { text: '照做', next: 'n4', hooks: ['fear', 'authority'] },
        { text: '我先问问辅导员', next: 'n3b' },
        { text: '挂断，我去官方渠道问', end: 'e_s', safe: true }
      ]
    },

    n3b: {
      stage: 'hook', scene: 'call',
      say: [
        ['k', '这个核验流程是内部的，不能对外说，一说系统就作废了'],
        ['k', '您跟同学、辅导员一讨论，我们后台就判定异常，得重新排队'],
        ['k', '今晚 24 点就自动扣费了，今天不办完，明天还得再走一遍'],
        ['k', '还影响您的支付分和会员信用，后面很多服务都受限制']
      ],
      note: '用“保密”把你和别人隔开，再用今晚 24 点压缩你思考的时间。',
      interrupt: { app: '校友圈', from: '辅导员', text: '明早 8 点年级会，记得来' },
      verify: {
        search: { ok: false, text: '你搜到的那条“官方客服热线”还是那句话：保密是流程要求，赶紧办完就没事了。' }
      },
      choices: [
        { text: '照做', next: 'n4', hooks: ['urgency', 'fear'] },
        { text: '挂断告诉辅导员', end: 'e_a', safe: true }
      ]
    },

    n4: {
      stage: 'harvest', scene: 'app', app: '青橙分期',
      say: [
        ['k', '您零钱包里的钱不够走这个核验，别担心'],
        ['k', '您在青橙分期有一笔学生额度，先贷出来跟核验款一起走一遍'],
        ['k', '验完连同您原来的钱一起原路退回，一分不少'],
        ['k', '您别挂，点完确认我就把线转给办案的李警官']
      ],
      note: '让你亲手贷出第一笔钱、亲手点下确认：这一步之后，钱就回不来了。',
      widget: ['pay', { amount: 6000, to: '会员核验专用账户', title: '青橙分期 · 借款并支付' }],
      verify: {
        search: { ok: false, text: '搜索出来的“客服”说：核验账户是公司专用账户，走完就把额度还回去，没问题。' }
      },
      choices: [
        { text: '确认转账', next: 'n5', money: -6000 },
        { text: '不转了，先问问辅导员', end: 'e_a', safe: true }
      ]
    },

    n5: {
      stage: 'lock', scene: 'call', caller: '来电 · 转接自 171****0000',
      say: [
        ['p', '我是市公安局刑侦支队的李警官，警号 0**317'],
        ['p', '刚核验出来，您这笔 ¥6,000 的资金来源异常，涉嫌一起洗钱案'],
        ['p', '现依法向您电子送达协查通知书，请注意查收'],
        ['p', '为了证明资金清白，请把剩余资金转入安全账户接受审查'],
        ['p', '这不是收费，审查结束原路退回，您配合就好']
      ],
      note: '换“警官”身份加码：文书、案号、洗钱罪名一起上，把恐惧推到最高点。',
      flag: '公检法不会电话办案，更没有“安全账户”，这六个字本身就是骗局',
      widget: ['doc', {
        kind: '协查通知书',
        title: '刑事协查通知书（电子送达）',
        fields: [
          { label: '文书号', value: '刑侦协查〔2026〕第 0417 号' },
          { label: '当事人', value: '（本人）' },
          { label: '身份证后四位', value: '8**7' },
          { label: '涉案事由', value: '账户资金异常 · 涉嫌洗钱' },
          { label: '承办警官', value: '李警官 · 警号 0**317' },
          { label: '要求', value: '将资金转入安全账户接受审查' }
        ],
        seal: '市公安局刑侦支队'
      }],
      pressure: true,
      pressureText: '李警官：您还在吗？这个案子今晚就要报上去，别耽误自己。',
      verify: {
        app: { ok: true, text: '你在平台的官方 App 里查了：既没有这笔会员订单，也没有任何“办案”“审查”记录。' },
        police: { ok: true, text: '接警员：公检法不会电话办案，没有“安全账户”，别再转钱了。' },
        search: { ok: false, text: '网上那些打着“办案电话”“客服热线”的广告，多半就是这伙人自己挂的。' }
      },
      choices: [
        { text: '转入安全账户', next: 'n6', hooks: ['fear', 'authority'], money: -4000 },
        { text: '我去派出所当面说', end: 'e_b', safe: true }
      ]
    },

    n6: {
      stage: 'lock', scene: 'call',
      say: [
        ['p', '这个案子还在侦查阶段，属于保密案件'],
        ['p', '您不能告诉家人、同学，任何人知道都会打草惊蛇'],
        ['p', '从现在起，您找一个安静的宾馆住下，谁也别联系'],
        ['p', '把其他软件都关掉，只留我这一个号码联系您'],
        ['p', '配合调查是公民义务，配合完案子就清了']
      ],
      note: '最后一步是隔离：切断你和家人朋友的联系，把你留在他们写好的剧本里。',
      pressure: true,
      pressureText: '李警官：现在就去，别挂电话，路上也别打给别人。',
      verify: {
        app: { ok: true, text: '你在官方 App 里什么都没查到——没有会员，也没有任何案件记录。' },
        police: { ok: true, text: '接警员：真警察不会让你去宾馆“隔离审查”，更不会让你转钱。' },
        search: { ok: false, text: '网上那份“协查通知书”的编号，查不到任何对应的公示。' }
      },
      choices: [
        { text: '照做', end: 'e_x', hooks: ['fear'] },
        { text: '给家里打电话', end: 'e_c', safe: true }
      ]
    }
  },

  endings: {
    e_s: {
      grade: 'S', title: '挂断自查', stamp: 'safe',
      text: '官方 App 里根本没有这笔会员，也没有任何待扣费记录。主动打来、还催你今天就办完的电话，不管报得出多少你的信息，都先挂断——自己去官方渠道查一遍，只花几分钟。'
    },
    e_a: {
      grade: 'A', title: '告诉了辅导员', stamp: 'safe',
      text: '越是让你保密、不让你问别人的，越见不得光。你把这件事说给了信得过的人——也许是辅导员，也许是 110 那头的接警员——他们整套剧本都建立在“你一个人扛”上，你一开口，戏就断了。'
    },
    e_b: {
      grade: 'B', title: '当面核实', stamp: 'stop',
      text: '你转出去的 ¥6,000 已经取不回来了，但你认出了“安全账户”：真正的警察不会电话办案，更不会让你转钱。停下来，带上通话记录和转账凭证去派出所当面说清楚，是目前最对的一步。'
    },
    e_c: {
      grade: 'C', title: '家人拉了你一把', stamp: 'caught',
      text: '骗子最怕你和家人通气，因为家人的第一反应往往比你冷静。你打出的这个电话，直接打断了“隔离审查”的剧本。停下来，把经过原原本本告诉家人，并拨打 110 报警。'
    },
    e_x: {
      grade: 'X', title: '与世隔绝', stamp: 'caught',
      text: '从“客服”到“警官”，他们用隔离把你和所有能提醒你的人隔开：住进宾馆、关掉通讯，就等于亲手关上了最后的求助渠道。现在最要紧的是立刻联系家人、拨打 110，越早越好。'
    }
  },

  reveal: {
    truth: '他让你核实，因为他知道你会去哪里核实。',
    crew: [
      ['信息贩子', '卖掉你的学籍、身份信息，让话术对得上'],
      ['一线话务', '假扮直播平台客服，先让你自己去“核实”'],
      ['二线话务', '假扮“市公安局刑侦支队李警官”，加压要钱'],
      ['取款人', '把收到的钱快速转走、取现']
    ],
    boom: {
      title: '两个人，一个剧本',
      render: function (host, run) {
        var stage = RJ.el('div', {
          style: { display: 'flex', gap: '14px', justifyContent: 'center', alignItems: 'stretch' }
        });
        var a = avatarCard('🎧', '直播平台客服中心', '一线话务');
        var b = avatarCard('👮', '市公安局刑侦支队 李警官', '二线话务');
        stage.appendChild(a);
        stage.appendChild(b);
        host.appendChild(stage);

        var btn = RJ.el('button', { class: 'btn btn-primary', text: '🔀 翻面：这是同一个剧本' });
        btn.style.marginTop = '14px';
        host.appendChild(btn);

        var out = RJ.el('div', { style: { display: 'none' } });
        host.appendChild(out);

        var flipped = false;
        btn.addEventListener('click', function () {
          if (flipped) return;
          flipped = true;
          btn.disabled = true;
          btn.textContent = '正在翻面…';
          if (RJ.reduceMotion()) { merge(); return; }
          a.style.transition = 'transform .5s ease, opacity .5s ease';
          b.style.transition = 'transform .5s ease, opacity .5s ease';
          a.style.transform = 'translateX(40px) scale(.9)';
          b.style.transform = 'translateX(-40px) scale(.9)';
          a.style.opacity = '0';
          b.style.opacity = '0';
          setTimeout(merge, 520);
          function merge() {
            RJ.clear(stage);
            stage.style.gap = '0';
            stage.appendChild(avatarCard('🕵️', '同一个骗子', '两个身份，一套剧本'));
            out.style.display = 'block';
            fillScripts(out);
            btn.textContent = '两个人，一个剧本';
          }
        });
      }
    },
    tips: [
      '①主动来电的“客服”，自己去官方渠道核实',
      '②正规取消会员不需要转账，更不用贷款',
      '③公检法不会电话办案，没有“安全账户”',
      '④要你保密、不许告诉家人的，一定有问题'
    ],
    after: [
      '①停止转账，马上告诉家人和辅导员',
      '②拨打 110 报警',
      '③接到 96110 来电一定要接'
    ],
    sources: ['S2', 'S4', 'S10', 'S12', 'S13'],
    laws: ['L1']
  }
});

function avatarCard(avatar, name, sub) {
  return RJ.el('div', {
    class: 'card',
    style: {
      flex: '1 1 0', maxWidth: '180px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
    }
  }, [
    RJ.el('div', {
      style: { fontSize: '40px', lineHeight: '1' }, role: 'img', 'aria-label': name, text: avatar
    }),
    RJ.el('div', { style: { fontWeight: 700 }, text: name }),
    RJ.el('div', { class: 'chip', text: sub })
  ]);
}

function fillScripts(host) {
  host.appendChild(RJ.el('p', { class: 'boom-note', text: '换的只是一个称呼——两个人念的是同一套剧本：' }));
  var rows = [
    ['恐吓', '今晚 24 点就自动扣费，今天不办完就作废', '你的账户涉嫌洗钱，要负刑事责任'],
    ['权威', '我是直播平台客服中心，工号 07**', '我是市公安局刑侦支队李警官，警号 0**317'],
    ['核实', '您不信可以挂断，自己搜官方客服电话核实', '你搜到的“官方电话”是我同事接的'],
    ['保密', '这是内部核验流程，不能告诉别人', '案件侦查阶段保密，不能告诉家人'],
    ['转账', '把钱转到核验账户走一遍', '把剩余资金转入安全账户']
  ];
  var table = RJ.el('div', { style: { display: 'grid', gap: '8px', marginTop: '12px', textAlign: 'left' } });
  table.appendChild(RJ.el('div', {
    style: { display: 'grid', gridTemplateColumns: '56px 1fr 1fr', gap: '10px', fontWeight: 700 }
  }, [
    RJ.el('span', { text: '剧本' }),
    RJ.el('span', { text: '🎧 客服' }),
    RJ.el('span', { text: '👮 警官' })
  ]));
  rows.forEach(function (r) {
    table.appendChild(RJ.el('div', {
      style: { display: 'grid', gridTemplateColumns: '56px 1fr 1fr', gap: '10px', alignItems: 'start' }
    }, [
      RJ.el('span', { class: 'chip', text: r[0] }),
      RJ.el('span', { text: r[1] }),
      RJ.el('span', { text: r[2] })
    ]));
  });
  host.appendChild(table);
  host.appendChild(RJ.el('div', { class: 'card', style: { marginTop: '14px', textAlign: 'left' } }, [
    RJ.el('p', {
      style: { margin: 0, fontWeight: 700 },
      text: '真警察办案会让你到派出所或当面处理，不会让你转账，也没有“安全账户”。'
    }),
    RJ.el('p', {
      style: { margin: '8px 0 0' },
      text: '从“客服”到“警官”，只换了一个称呼——中间那次“你自己去核实”，也是他安排好的。'
    })
  ]));
}
})();
