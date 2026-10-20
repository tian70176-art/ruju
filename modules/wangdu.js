/* 模块 wangdu · 金沙娱乐（网络赌博，小板移植）—— 规格见 方案/10
 * 该模块只做一件事：调用 RJ.register(def)。
 * 玩法、概率、文案都在外部页面 site/m/wangdu/index.html 里，
 * 本文件只管主屏注册、结局表与破局内容（外部模块的翻面页不做逐句回放）。
 */
(function () {
  'use strict';
RJ.register({
  id: 'wangdu',
  title: '金沙娱乐',
  type: '网络赌博',
  role: 'victim',
  external: 'm/wangdu/index.html',
  app: { name: '金沙娱乐', icon: '🎰', color: '#d4af37' },
  inbox: { time: '21:10', app: '微聊', from: '阿豪', text: '上次那个平台我提了 ¥2,000 到账了，链接发你，别外传。' },
  inbox2: { time: '21:35', app: '微聊', from: '老K', text: '昨天那波我提了 ¥3,000 到账，链接发你，别跟别人说。' },
  lockNotice: { app: '金沙娱乐', title: '【金沙娱乐】', body: '注册即送 ¥1,000 体验金，今日首充双倍' },

  /* 结局由赌场页在离开时按现场状态算出（10 §3.2），这里只负责文案与印章 */
  endings: {
    e_s: {
      grade: 'S', title: '看都不看', stamp: 'safe',
      text: '一注都没下就走了。面对一个“注册就送你一千块”的平台，你没有把体验金当成自己的钱——这是最省事、也最有效的一步。网赌平台最怕的不是你赢它，是你从来不当它的客户。'
    },
    e_a: {
      grade: 'A', title: '赢了就走？', stamp: 'safe',
      text: '你下过注，走的时候余额还比开局多。这不叫手气好：网赌平台的“养鱼期”本来就是设计来让你赢的，先喂你几口，再把你留在桌上。赢钱离开是对的，但请记住你赢的是他们放下的饵。'
    },
    e_b: {
      grade: 'B', title: '输光体验金就走', stamp: 'stop',
      text: '体验金输光了，你一分真钱都没充就离开——这是网赌里唯一正确的止损点。但“就差一点就回本”的念头会跟着你很久，请记住它是被设计出来的：后台调参的目的就是让这句话听起来像真的。'
    },
    e_c: {
      grade: 'C', title: '充值翻本', stamp: 'caught',
      text: '你充了钱，想把输掉的赢回来。这是网赌里唯一一条单行道：越充越提不出来，流水门槛会随你的充值额一起长。真实案例里的下一步是网贷。现在停下来，删掉它，把充值记录给家人看。'
    },
    e_x: {
      grade: 'X', title: '赢了也拿不走', stamp: 'caught',
      text: '你赢了钱，然后账户被冻结了。这不是剧情：网赌平台的钱来自境外电信诈骗，你的银行卡接收它，就是在替人洗钱。赢到的每一分钱都是别人被骗走的钱，冻结只是时间问题。'
    }
  },

  reveal: {
    truth: '十赌九骗，还有一个，是庄家自己。',
    crew: [
      ['推广员', '跑马灯里的中奖名单、群里晒的单，都是编的'],
      ['客服', '用“加客服领彩金”“流水未达标”把你留在桌上'],
      ['风控', '养鱼期让你赢、杀猪期调低胜率，参数挂在你的账号上'],
      ['洗钱通道', '你的“提现”，是把境外诈骗赃款洗进银行卡的最后一环']
    ],
    boom: {
      title: '你在后台里，是一行带标签的数据',
      render: function (host, run) {
        var def = RJ.modules.wangdu || {};
        var endings = def.endings || {};
        var eid = run && run.ending;
        var title = (endings[eid] && endings[eid].title) || '这一局没有留下记录';
        var paid = run && run.loss ? run.loss : 0;
        var holes = (run && run.hooks) || {};
        var leftAt = RJ.STAGE_LABEL[(run && run.leftAt) || 'lure'] || '引流';
        var marks = Object.keys(holes).filter(function (k) { return holes[k]; });
        var chips = marks.length
          ? marks.map(function (k) {
              return RJ.el('span', { class: 'hook-chip h-' + k, text: RJ.HOOK_ICON[k] + ' ' + RJ.HOOKS[k] + ' ×' + holes[k] });
            })
          : [RJ.el('span', { class: 'hook-chip', text: '这一局他们没从你身上拿到任何东西' })];

        host.appendChild(RJ.el('div', { class: 'card' }, [
          RJ.el('div', { class: 'sec-title', text: '① 本局账号档案（模拟数据）' }),
          RJ.el('div', { class: 'kpi-row' }, [
            kpi('本局结局', title),
            kpi('真实充值', RJ.yuan(paid)),
            kpi('最后的提现', eid === 'e_x' ? '账户冻结' : paid > 0 ? '流水未达标' : '没敢点'),
            kpi('离开的阶段', leftAt + ' · ' + ((run && run.secs) || 0) + ' 秒')
          ]),
          RJ.el('div', { class: 'sec-title', text: '你被记下的标签' }),
          RJ.el('div', { class: 'hook-row' }, chips),
          RJ.el('p', { class: 'boom-note', text: '充值金额只计真钱，体验金不算——后台也是这么记的：他们只关心你掏了多少。' })
        ]));

        var btn = RJ.el('button', {
          class: 'btn btn-primary',
          text: '🔧 去赌场后台看真实胜率'
        });
        host.appendChild(btn);
        btn.addEventListener('click', function () {
          window.location.href = RJ.BASE + 'm/wangdu/index.html#wrench';
        });

        host.appendChild(RJ.el('p', { class: 'boom-note', text: '那一页平时不可见：里面写着平台给你调的胜率、你的养鱼期额度、以及“杀猪期”从第几局开始。看完了你会明白，输赢从来不在你的手气里。' }));
      }
    },
    tips: [
      '①网赌没有公平的局，后台能调参数',
      '②充得越多越提不出来',
      '③“差一点就回本”是设计出来的',
      '④赌赢的钱也可能是赃款'
    ],
    after: [
      '①停止充值，卸载软件',
      '②拨打 110 或 96110 求助',
      '③告诉家人或辅导员，别独自“翻本”'
    ],
    sources: [],
    laws: []
  }
});

function kpi(label, value) {
  return RJ.el('div', { class: 'kpi' }, [
    RJ.el('div', { class: 'kpi-big mono', text: value }),
    RJ.el('div', { class: 'kpi-label', text: label })
  ]);
}
})();
