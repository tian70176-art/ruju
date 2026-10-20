/* 入局 · 大学生反诈沉浸实验室 —— core.js
 * RJ 命名空间：来源表、存储、注册、路由、记录、工具、手机外壳、主屏、锁屏。
 * 依赖：无。加载顺序见 01 §1。ES2018 以内。
 */
(function () {
  'use strict';
  var RJ = window.RJ = window.RJ || {};

  RJ.BASE = '';                 // selftest.html 会在加载 core.js 后设为 '../'
  RJ.VERSION = '1.1.0';
  RJ.modules = {};              // id -> def（骗局模块 + center；门口的 day2 短剧本也在这里）
  RJ.real = {};                 // id -> def（真消息短剧本，35 §1：与骗局同一引擎、不进 MANIFEST）
  RJ.MANIFEST = [];             // manifest.js 填充
  RJ.inbox = {};                // inbox.js 填充（收件箱 / 复盘）
  RJ.classroom = false;
  RJ.kiosk = false;

  /* ================= 常量：五阶段 / 六弱点 / 档位 ================= */

  RJ.STAGES = ['lure', 'trust', 'hook', 'harvest', 'lock'];
  RJ.STAGE_LABEL = { lure: '引流', trust: '建信', hook: '设饵', harvest: '收割', lock: '锁死' };
  RJ.STAGE_DESC = {
    lure: '找到你：广告、群、附近的人、来电',
    trust: '让你信：身份包装、小额甜头、专业话术',
    hook: '让你想要/害怕：高回报、恐吓、情感',
    harvest: '让你转钱/交权限',
    lock: '让你继续/闭嘴：卡单、威胁、二次诈骗'
  };
  RJ.HOOKS = {
    greed: '贪利', fear: '恐惧', authority: '权威',
    emotion: '情感', urgency: '急迫', sunk: '沉没成本'
  };
  RJ.HOOK_ICON = { greed: '💰', fear: '😱', authority: '🎖️', emotion: '❤️', urgency: '⏰', sunk: '🕳️' };
  RJ.HOOK_ADVICE = {
    greed: '凡是让你先交钱的赚钱机会，都是骗局。',
    fear: '越是吓你“马上出事”，越要停下来，先挂断再核实。',
    authority: '真的客服、警察、老师，不会让你转账、下载软件、共享屏幕。',
    emotion: '再亲的人借钱，也要换一条路核实，转到本人账户。',
    urgency: '所有“限时”都是为了不让你想。慢下来，你就赢了一半。',
    sunk: '已经付出的钱回不来了，不要为了它再付一次。'
  };
  RJ.GRADES = {
    S: { stamp: 'safe', label: '识破' },
    A: { stamp: 'safe', label: '识破' },
    B: { stamp: 'stop', label: '及时止损' },
    C: { stamp: 'caught', label: '已入局' },
    X: { stamp: 'caught', label: '已入局' }
  };
  RJ.STAMP_TEXT = { safe: '已识破', stop: '及时止损', caught: '已入局' };

  RJ.stageRank = function (s) { var i = RJ.STAGES.indexOf(s); return i < 0 ? -1 : i; };

  /* ================= 来源表与法条表（00 §8 原样转成数据） ================= */

  RJ.SOURCES = [
    { id: 'S1', from: '公安部，2026-07-10', url: 'https://edu.cctv.com/2026/07/10/ARTIxBI8lIbQq03cBz5ULglK260710.shtml',
      text: '公安部针对大学生的暑期提示：诈骗分子针对大学生群体主要实施刷单返利类诈骗、虚假购物服务类诈骗；刷单以招募“点赞员”“推广员”开始，小额佣金建信，再以“充值越多、抢单越多、返利越多”诱导下载 App 做“进阶任务”，最后以“任务未完成”“卡单”“操作异常”“账户被冻结”为借口不断要钱。虚假购物多见于演唱会门票、二手闲置，诱导点击陌生链接/扫码转到仿冒平台，或谎称“交易失败、卡单”要求下载屏幕共享软件。' },
    { id: 'S2', from: '同 S1', url: 'https://edu.cctv.com/2026/07/10/ARTIxBI8lIbQq03cBz5ULglK260710.shtml',
      text: '陌生人在网上主动联系并诱导点击陌生链接、脱离官方平台交易、在非官方应用市场下载软件时……这些行为基本都是诈骗。96110 来电一定要及时接听，切勿挂断；切勿出租、出售、出借个人银行卡、手机卡、互联网账号，严防成为电诈犯罪帮凶。' },
    { id: 'S3', from: '公安部公布十大高发电信网络诈骗类型，2024-06', url: 'https://www.mps.gov.cn/n2253534/n2253535/c9629527/content.html',
      text: '刷单返利、虚假网络投资理财、虚假网络贷款、冒充电商物流客服、冒充公检法、虚假征信等 10 种常见诈骗类型发案占比近 80%，其中刷单返利发案率最高；刷单以“招募兼职刷单、网络色情诱导刷单等复合型诈骗居多”。' },
    { id: 'S4', from: '公安部刑侦局、国家反诈中心，2025-06-18', url: 'https://www.gov.cn/lianbo/bumen/202506/content_7028568.htm',
      text: '《2025 版防范电信网络诈骗宣传手册》梳理 10 类高发类型：刷单返利、虚假网络投资理财、虚假购物服务、冒充电商物流客服、贷款征信、冒充领导熟人、冒充公检法、婚恋交友、网络游戏产品虚假交易、机票退改签。' },
    { id: 'S5', from: '国家反诈中心民警，2026-01', url: 'https://news.qq.com/rain/a/20260108A06KXG00',
      text: '屏幕共享已打开时的处置：先尝试关闭；如果没法操作手机，第一时间关机、拔卡、断网。' },
    { id: 'S6', from: '常州市公安局；福建省公安厅', url: 'https://gaj.changzhou.gov.cn/html/czgaj/2021/MNILQBFL_0121/85336.html',
      text: '裸聊敲诈典型套路：通过交友软件“附近的人”联系，诱导下载陌生软件（实为木马），获取通讯录并录制视频，以发给父母、老师、领导相威胁。一旦表示害怕愿意“私了”，索取便会无休无止。' },
    { id: 'S7', from: '新黄河/济南时报，2026-07-02', url: 'http://sd.news.cn/20260702/e6d6bec61c584aa6b34a41b4ab8b4645/c.html',
      text: '济南警方案例：受害人下载陌生交友软件，被诱导安装携带木马的软件，通讯录被窃取，被逼分 14 次转账 2 万余元，后又被诱导借贷转账。' },
    { id: 'S8', from: '2023-05', url: 'https://www.shanwei.gov.cn/gdsw110/ywyw/jwyw/content/post_924837.html',
      text: '福州郭先生接到“好友”视频通话，对方以竞标需要保证金为由求助，10 分钟内转出 430 万元，视频中的“好友”是 AI 换脸。银行协助拦截 336.84 万元。' },
    { id: 'S9', from: '解放日报，2025-07-30', url: 'https://www.jfdaily.com/news/detail?id=955244',
      text: '帮信罪约三分之一被告人不满 25 岁；有人因组织、利用在校学生实施犯罪被判帮信罪。' },
    { id: 'S10', from: '光明网；北京市地方金融监管局转中消协', url: 'https://m.gmw.cn/2024-11/05/content_1303889108.htm',
      text: '“注销校园贷”诈骗：冒充贷款平台客服，称你有校园贷记录、不注销会影响征信，诱导转账或贷款“清零”。国家明令禁止互联网借贷平台向大学生放贷。' },
    { id: 'S11', from: '封面新闻，2026-08-21', url: 'https://finance.sina.cn/2026-08-21/detail-ininzaze1692258.d.html',
      text: '2024 年，一名男子在自贡租下门面开烟酒店，用实体店资质办营业执照、对公账户和 POS 机交给电诈团伙接收赃款，两天进账超 500 万元，被银行风控冻结。他编造“受朋友高薪聘请帮忙看店，月薪 8000 余元”，却说不出雇主身份，最终因帮信罪被判有期徒刑三年多。民警联系受害人退赃时，很多人以为民警是新的骗子，直接挂断电话。' },
    { id: 'S12', from: '深圳市公安局，2026-01-10', url: 'https://ga.sz.gov.cn/JMHD/YWZSK/XJGL_ZS/content/post_12597992.html',
      text: '深圳警方：骗子冒充平台客服，称你“误开通直播会员，将每月自动扣费”，诱导下载 App、开启屏幕共享。口诀：主动联系你的“客服”，一律通过官方渠道（官方 App、客服电话）核实；所有以“验证身份”“保证金”“刷流水”为由要求转账的，都是诈骗。' },
    { id: 'S13', from: '福建省公安厅，2023-02-22', url: 'https://gat.fj.gov.cn/ztzl/fjjffpzxrx/yjxx/202302/t20230222_6114604.htm',
      text: '福建警方：王女士用搜索引擎搜航空公司客服电话，点进非官方页面中的第一个选项，拨打了网页上的假客服电话，被要求“刷一笔流水验证安全账户”。' },
    { id: 'S14', from: '封面新闻，2026-09-05', url: 'https://www.thecover.cn/news/3q9ajPMPSKOH90qSdq8Jkw==',
      text: '骗子扫码混入班级群，把头像和昵称换成与班主任一致，以收体检费、保险费为由发起群收款；郑州一案 33 名家长中招。收费信息要通过电话、视频与老师本人核实。' },
    { id: 'S15', from: '检察日报/江苏检察网，2026-10-08', url: 'https://www.jsjc.gov.cn/yaowen/202610/t20261008_1362974.shtml',
      text: '江苏溧阳检察院办结：莫某经陌生人推荐做“跑腿兼职”，单次薪酬 300 元，按指令去各地快递柜提取黄金包裹并转运，拉上朋友杨某每日结算 100 元；徐某做“司机兼职”日薪 500 元，定点取现、跨区域运送资金。检察官认为三人早已察觉多处异常——全程通过境外软件联络、交易流程极度隐秘、频繁更换作案地点、经手大量无合法来源的现金与黄金。三人以掩饰、隐瞒犯罪所得罪被判刑，分别非法获利 1000 元、600 元、2000 元。同案上游受害人阿美在网上“恋爱”后被诱导充值购买黄金，累计投入 20 余万元。' },
    { id: 'S16', from: '光明网/紫牛新闻，2026-03-20', url: 'https://m.gmw.cn/2026-03/20/content_1304384274.htm',
      text: '阜阳网警：一名在校大学生被游戏好友邀请代练（每月 500 元），被引导扫码加“平台在线客服”，先交 1000 元保证金，退款时又被要求“刷流水”、开启屏幕共享，累计被骗 6880 元；对方还劝他“拿家里人的手机配合处理退款”“不要告诉家里人”。警方提醒：凡是网络兼职，要求扫描陌生二维码、引流到站外、添加“官方客服”、先付“解冻金”“保证金”的，全部是常见诈骗手法。' },
    { id: 'S17', from: '新华网，2026-09-03', url: 'http://www.hb.xinhuanet.com/20260903/90e2bcaef80941b380ee073bacac9711/c.html',
      text: '新华网开学季提醒：②2025 年三名诈骗分子潜入某高校 140 人的新生群冒充老师，以方便同步信息为由要求学生开启屏幕共享，获取银行账号等信息，诱导点击链接、提供验证码，导致多名学生资金被盗；⑤2026 年 4 月贵州一名学生被陌生人以 520 元收购游戏账号为由添加好友，对方谎称其母亲账号“涉案有风险”，诱导下载软件并开启屏幕共享，伪装成“网警”远程指挥其转账 3 万余元。' },
    { id: 'S18', from: '界面新闻，2026-04-24', url: 'https://www.jiemian.com/article/14314469.html',
      text: '19 岁广东大一学生受一位女性朋友邀请去泰国过泼水节，买了往返机票；抵达曼谷后朋友没有出现，一名男子开车接走她，两天后她被以偷渡形式运送到缅甸园区。园区向其父亲索要约 20 余万元，付款后以各种借口一再拖延放人，并威胁家人不许报警；家人报警，警方已立案。' }
  ];

  RJ.LAWS = [
    { id: 'L1', law: '《刑法》第二百六十六条', what: '诈骗罪' },
    { id: 'L2', law: '《刑法》第二百七十四条', what: '敲诈勒索罪' },
    { id: 'L3', law: '《刑法》第二百八十七条之二', what: '帮助信息网络犯罪活动罪（“帮信罪”）：明知他人利用信息网络实施犯罪，为其提供支付结算等帮助' },
    { id: 'L4', law: '《刑法》第三百一十二条', what: '掩饰、隐瞒犯罪所得、犯罪所得收益罪' },
    { id: 'L5', law: '《反电信网络诈骗法》第三十一条', what: '任何单位和个人不得非法买卖、出租、出借电话卡、物联网卡、电信线路、短信端口、银行账户、支付账户、互联网账号等，不得提供实名核验帮助。对相关人员可记入信用记录，采取限制卡/账户功能、停止非柜面业务、暂停新业务、限制入网等措施' },
    { id: 'L6', law: '《反电信网络诈骗法》第四十四条', what: '违反第三十一条第一款：没收违法所得，处违法所得一倍以上十倍以下罚款，没有违法所得或不足二万元的，处二十万元以下罚款；情节严重的，并处十五日以下拘留' },
    { id: 'L7', law: '《反电信网络诈骗法》第三十八条', what: '为电信网络诈骗活动提供帮助，尚不构成犯罪的，由公安机关处十日以上十五日以下拘留，并处罚款' },
    { id: 'L8', law: '网赌模块冻结页法条原文', what: '沿用小作业冻结页的法条原文（见 m/wangdu/index.html）' }
  ];
  RJ.SOURCE_MAP = {}; RJ.SOURCES.forEach(function (s) { RJ.SOURCE_MAP[s.id] = s; });
  RJ.LAW_MAP = {}; RJ.LAWS.forEach(function (l) { RJ.LAW_MAP[l.id] = l; });

  /* ================= 存储（rj. 前缀，try/catch，失败降级内存） ================= */

  var mem = {};
  function LS() { try { return window.localStorage; } catch (e) { return null; } }
  RJ.store = {
    get: function (k, dflt) {
      try {
        var ls = LS(), v = ls ? ls.getItem('rj.' + k) : null;
        if (v !== null && v !== undefined) return JSON.parse(v);
      } catch (e) { }
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : dflt;
    },
    set: function (k, v) {
      mem[k] = v;
      try { var ls = LS(); if (ls) ls.setItem('rj.' + k, JSON.stringify(v)); } catch (e) { }
    },
    del: function (k) {
      delete mem[k];
      try { var ls = LS(); if (ls) ls.removeItem('rj.' + k); } catch (e) { }
    },
    clear: function () {
      mem = {};
      try {
        var ls = LS(); if (!ls) return;
        var keys = []; for (var i = 0; i < ls.length; i++) keys.push(ls.key(i));
        keys.forEach(function (k) { if (k && k.indexOf('rj.') === 0) ls.removeItem(k); });
      } catch (e) { }
    }
  };

  /* ================= 注册 / 记录 ================= */

  RJ.register = function (def) { if (def && def.id) RJ.modules[def.id] = def; };
  /* 真消息短剧本（35 §1）：与骗局用同一套引擎与 DSL，但不算骗局、不进 MANIFEST */
  RJ.registerReal = function (def) { if (def && def.id) { def.kind = 'real'; RJ.real[def.id] = def; } };
  RJ.defOf = function (id) { return RJ.modules[id] || RJ.real[id] || null; };

  RJ.runs = function (modId) {
    var all = RJ.store.get('runs', []);
    if (!Array.isArray(all)) all = [];
    if (!modId) return all;
    return all.filter(function (r) { return r && r.mod === modId; });
  };
  RJ.record = function (modId, run) {
    run = run || {};
    run.mod = modId;
    if (!run.ts) run.ts = Date.now();
    var all = RJ.runs();
    all.push(run);
    if (all.length > 500) all = all.slice(all.length - 500);
    RJ.store.set('runs', all);
    RJ.lastRun = { mod: modId, run: run, def: RJ.modules[modId] };
    return run;
  };
  RJ.profile = function () {
    var p = RJ.store.get('profile', null);
    if (!p || typeof p !== 'object') p = {};
    if (!p.nick) p.nick = '';
    return p;
  };
  RJ.setProfile = function (patch) {
    var p = RJ.profile();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) p[k] = patch[k];
    RJ.store.set('profile', p);
    return p;
  };
  RJ.nick = function () { return RJ.profile().nick || '访客'; };

  /* 全局标记（跨模块的剧情开关，如收件箱里接听了 96110） */
  RJ.flag = function (k) { return !!RJ.store.get('flag.' + k, false); };
  RJ.setFlag = function (k, v) { RJ.store.set('flag.' + k, v !== false); };

  /* ================= 变体与防剧透（40 §3） =================
   * 每条真消息、每个骗局开场可以准备 2 个变体：改 inbox 文案与 n1/n2 的 say，不改节点结构。
   * 抽法：同一天、同一台设备结果一致；每过一个自然日，全部消息一起翻到另一个变体，
   * 因此“同一设备连续两天，至少 6 条消息文案不同”是必然成立的（40 §7）。 */
  RJ.hashStr = function (s) {
    var h = 2166136261, i;
    s = String(s);
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  RJ.dayIndex = function () {
    var d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  };
  RJ.variantIndex = function (id) { return (RJ.hashStr(id) + RJ.dayIndex()) % 2; };
  /* 变体视图：不改原 def，返回一个节点被 patch 过的浅拷贝 */
  RJ.variantOf = function (def) {
    if (!def || !def.variant || RJ.variantIndex(def.id) === 0) return def;
    var out = {}, k;
    for (k in def) if (Object.prototype.hasOwnProperty.call(def, k)) out[k] = def[k];
    var nodes = {};
    for (k in (def.nodes || {})) if (Object.prototype.hasOwnProperty.call(def.nodes, k)) nodes[k] = def.nodes[k];
    for (k in def.variant) {
      if (!Object.prototype.hasOwnProperty.call(def.variant, k)) continue;
      var patch = def.variant[k];
      if (!patch) continue;
      var base = nodes[k] || {}, merged = {}, p;
      for (p in base) if (Object.prototype.hasOwnProperty.call(base, p)) merged[p] = base[p];
      for (p in patch) if (Object.prototype.hasOwnProperty.call(patch, p)) merged[p] = patch[p];
      merged.id = k;
      nodes[k] = merged;
    }
    out.nodes = nodes;
    return out;
  };
  /* 条目文案：第 1 变体时用 def.inbox2 覆盖 def.inbox */
  RJ.inboxEntryOf = function (def) {
    if (!def) return {};
    if (RJ.variantIndex(def.id) === 1 && def.inbox2) return def.inbox2;
    return def.inbox || {};
  };

  /* ================= 第二天：骗子回来了（40 §2） ================= */

  RJ.day2 = { scams: [], reals: [] };
  RJ.registerDay2 = function (def, kind) {          // kind: 'scam' | 'real'
    if (!def || !def.id) return;
    def.day2Only = true;
    if (kind === 'real') { def.kind = 'real'; RJ.real[def.id] = def; RJ.day2.reals.push(def.id); }
    else { RJ.modules[def.id] = def; RJ.day2.scams.push(def.id); }
  };
  RJ.day2ctx = function () { return RJ.store.get('day2seed', null) || {}; };

  /* 运行模式：quick（5 分钟快速局，默认）/ full（完整的一天） */
  RJ.mode = function () { return RJ.store.get('mode', 'quick') === 'full' ? 'full' : 'quick'; };
  RJ.setMode = function (m) { RJ.store.set('mode', m === 'full' ? 'full' : 'quick'); return RJ.mode(); };

  /* 确定性抽样：同一 seed 结果一致（快速局 / 第二天的抽取都用它） */
  RJ.rng = function (seed) {
    var a = (Number(seed) >>> 0) || 1;
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  RJ.sample = function (arr, n, seed) {
    var a = (arr || []).slice(), rnd = RJ.rng(seed), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, Math.max(0, n));
  };
  RJ.pickOne = function (arr, seed) { var s = RJ.sample(arr, 1, seed); return s.length ? s[0] : null; };

  /* ================= 共享钱包与生活设定（30 §2.4） ================= */

  RJ.spent = function () {
    return RJ.runs().reduce(function (a, r) { return a + (r.loss || 0); }, 0);
  };
  RJ.wallet = function () {
    var p = RJ.profile();
    var base = Number(p.life) || 1500;
    var spent = RJ.spent();
    var reset = Number(RJ.store.get('walletReset', 0)) || 0;   // 「再玩一天」后的新月起点
    var ib = RJ.store.get('inbox', null);
    var extra = (ib && Number(ib.lostExtra)) || 0;             // 收件箱里没去处理而错过的钱（奖学金），没进过钱包，不从余额扣
    var cur = 0;
    try { if (RJ.engine && RJ.engine.isActive && RJ.engine.isActive() && RJ.engine.state()) cur = RJ.engine.state().sum || 0; } catch (e) { }
    var left = Math.max(0, base - Math.max(0, spent - reset) - Math.max(0, -cur));
    return { base: base, spent: spent, extra: extra, left: left, cur: cur };
  };
  RJ.MEALS = function (left) { // 还剩几顿饭（模拟数据：¥15/顿，一天 3 顿）
    return Math.floor(left / 15);
  };
  /* 台词占位符：{name} 称呼、{school} 学校简称、{lost} 昨天被骗的合计（40 §2 的假“追回”要报出准确金额） */
  RJ.fill = function (s) {
    if (typeof s !== 'string') return s;
    var p = RJ.profile(), ctx = RJ.day2ctx();
    return s.replace(/\{name\}/g, p.nick || '同学')
      .replace(/\{school\}/g, p.school || '你们学校')
      .replace(/\{lost\}/g, RJ.yuan(ctx.lost || 0))
      .replace(/\{lostn\}/g, String(Math.round(ctx.lost || 0)));
  };

  /* ================= DOM 工具 ================= */

  RJ.el = function (tag, attrs, kids) {
    var n = document.createElement(tag), k, v;
    if (attrs) {
      for (k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = String(v);
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') { for (var s in v) if (Object.prototype.hasOwnProperty.call(v, s)) n.style[s] = v[s]; }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) n.setAttribute(k, '');
        else n.setAttribute(k, v);
      }
    }
    if (kids !== null && kids !== undefined) {
      (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        n.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
      });
    }
    return n;
  };
  RJ.clear = function (host) { while (host && host.firstChild) host.removeChild(host.firstChild); };
  RJ.svg = function (w, h, inner) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + inner + '</svg>';
    return RJ.el('div', { class: 'svgwrap', html: s });
  };
  RJ.yuan = function (n) {
    n = Number(n) || 0;
    var neg = n < 0;
    var s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-¥' : '¥') + s;
  };
  RJ.num = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  RJ.esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  RJ.uid = function () { return 'u' + Math.random().toString(36).slice(2, 8); };
  RJ.reduceMotion = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  RJ.emoji = function (ch, label) { return RJ.el('span', { class: 'emo', role: 'img', 'aria-label': label, text: ch }); };

  RJ.toast = function (text, secs) {
    var host = document.getElementById('toast');
    if (!host) return;
    var t = RJ.el('div', { class: 'toast', text: text });
    host.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, (secs || 2) * 1000);
  };

  RJ.modal = function (html, opts) {
    opts = opts || {};
    var host = document.getElementById('modal');
    if (!host) return { close: function () { } };
    var body = RJ.el('div', { class: 'modal-body' });
    if (typeof html === 'string') body.innerHTML = html; else if (html) body.appendChild(html);
    var box = RJ.el('div', { class: 'modal-box' }, body);
    if (opts.buttons && opts.buttons.length) {
      box.appendChild(RJ.el('div', { class: 'modal-btns' }, opts.buttons.map(function (b) {
        return RJ.el('button', {
          class: 'btn ' + (b.cls || 'btn-ghost'), text: b.text,
          onclick: function () { var r = b.onClick ? b.onClick() : undefined; if (b.keep !== true && r !== false) close(); }
        });
      })));
    }
    var ov = RJ.el('div', { class: 'modal-ov' }, [box]);
    ov.addEventListener('click', function (e) { if (e.target === ov && opts.dismiss !== false) close(); });
    host.appendChild(ov); host.style.display = 'block';
    function close() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (!host.children.length) host.style.display = 'none';
      if (opts.onClose) opts.onClose();
    }
    return { close: close, box: box, body: body };
  };

  /* ================= 页脚合规句（00 §6.1，照抄） ================= */
  RJ.COMPLIANCE = '本站为反诈教育模拟。所有聊天、人物、App、资金均为虚构，不收集任何信息。';

  /* ================= 键盘事件总线 ================= */
  RJ.keyHandlers = [];
  RJ.onKey = function (fn) { RJ.keyHandlers.push(fn); return function () { var i = RJ.keyHandlers.indexOf(fn); if (i >= 0) RJ.keyHandlers.splice(i, 1); }; };

  /* ================= 课堂模式 ================= */
  RJ.setClass = function (v) {
    RJ.classroom = !!v;
    RJ.store.set('class', RJ.classroom);
    if (document.body) document.body.classList.toggle('class', RJ.classroom);
    var tag = document.getElementById('class-tag');
    if (tag) tag.style.display = RJ.classroom ? 'inline-block' : 'none';
  };
  RJ.setKiosk = function (v) {
    RJ.kiosk = !!v;
    RJ.store.set('kiosk', RJ.kiosk);
    var tag = document.getElementById('kiosk-tag');
    if (tag) tag.style.display = RJ.kiosk ? 'inline-block' : 'none';
  };
  RJ.aside = function (info) {
    var host = document.getElementById('aside-body');
    if (!host) return;
    RJ.clear(host);
    if (!info) {
      host.appendChild(RJ.el('p', { class: 'aside-hint', text: '课堂模式：进入任意模块，这里会显示骗子此刻的目的、红旗点与心理弱点。' }));
      return;
    }
    var st = info.stage;
    host.appendChild(RJ.el('div', { class: 'aside-stage s-' + st }, [
      RJ.el('span', { class: 'aside-stage-name', text: RJ.STAGE_LABEL[st] || st }),
      RJ.el('span', { class: 'aside-stage-id', text: st })
    ]));
    if (info.flag) host.appendChild(RJ.el('div', { class: 'aside-flag', text: '🚩 ' + info.flag }));
    if (info.note) host.appendChild(RJ.el('p', { class: 'aside-note', text: info.note }));
    if (info.hooks && info.hooks.length) {
      host.appendChild(RJ.el('div', { class: 'aside-hooks' }, info.hooks.map(function (h) {
        return RJ.el('span', { class: 'hook-chip h-' + h, text: RJ.HOOK_ICON[h] + ' ' + RJ.HOOKS[h] });
      })));
    }
  };

  /* ================= 游戏内时钟（30 §2.5） ================= */

  RJ.clock = {
    start: '08:00',
    text: function () { return RJ.store.get('clock', this.start); },
    set: function (t) { RJ.store.set('clock', t); RJ.syncClock(); },
    advanceTo: function (t) {
      if (!t) return;
      if (String(t) > String(this.text())) { RJ.store.set('clock', t); RJ.syncClock(); }
    },
    reset: function () { RJ.store.set('clock', this.start); RJ.syncClock(); }
  };
  RJ.syncClock = function () {
    var e = document.getElementById('sb-time');
    if (!e) return;
    var gameRoutes = { home: 1, m: 1, review: 1 };
    e.textContent = gameRoutes[RJ.route] ? RJ.clock.text() : clockText();
  };

  /* ================= 路由 ================= */

  var SCREEN = null;
  RJ.route = null;
  RJ.parseHash = function (hash) {
    var h = String(hash || '').replace(/^#/, '');
    var q = '';
    var qi = h.indexOf('?');
    if (qi >= 0) { q = h.slice(qi + 1); h = h.slice(0, qi); }
    var parts = h.split('/').filter(function (p) { return p !== ''; });
    var query = {};
    if (q) q.split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i < 0) return;
      var k = decodeURIComponent(kv.slice(0, i)), v = kv.slice(i + 1);
      try { query[k] = decodeURIComponent(v); } catch (e) { query[k] = v; }
    });
    return { parts: parts, query: query, raw: String(hash || '') };
  };

  RJ.go = function (route, force) {
    var r = route.charAt(0) === '#' ? route : '#' + route;
    if (window.location.hash === r) { RJ.render(); return; }
    window.location.hash = r;
  };

  RJ.render = function () {
    if (!SCREEN) SCREEN = document.getElementById('screen');
    if (!SCREEN) return;
    var h = RJ.parseHash(window.location.hash), p = h.parts;
    RJ.clear(SCREEN);
    SCREEN.setAttribute('data-route', '#/' + p.join('/'));
    document.body.classList.remove('skin-dark');
    if (RJ.engine) RJ.engine.stop();
    RJ.aside(null);
    if (window.RJ_closeKids) { try { window.RJ_closeKids(); } catch (e) { } }

    if (!p.length || p[0] === 'lock') { RJ.route = 'lock'; renderLock(SCREEN); return; }
    if (p[0] === 'home') { RJ.route = 'home'; renderHome(SCREEN); return; }
    if (p[0] === 'review') { RJ.route = 'review'; if (RJ.inbox.review) RJ.inbox.review(SCREEN); else renderMissing(SCREEN, 'review'); return; }
    if (p[0] === 'read') { RJ.route = 'read'; if (RJ.inbox.interstitial) RJ.inbox.interstitial(SCREEN); else RJ.go('#/home'); return; }
    if (p[0] === 'inbox') { RJ.route = 'home'; renderHome(SCREEN); return; }
    if (p[0] === 'ext') { RJ.route = 'ext'; handleExt(h); return; }
    if (p[0] === 'm' && p[1]) {
      var id = p[1], def = RJ.defOf(id);
      if (!def) { renderMissing(SCREEN, id); return; }
      if (def.kind === 'real') {                     // 真消息：不暴露结局页/翻面页
        if (p[2]) { RJ.go('#/home'); return; }
        RJ.route = 'm'; RJ.engine.run(SCREEN, def); return;
      }
      if (p[2] === 'end' && p[3]) { RJ.route = 'end'; RJ.reveal.end(SCREEN, def, p[3]); return; }
      if (p[2] === 'reveal') { RJ.route = 'reveal'; RJ.reveal.board(SCREEN, def); return; }
      if (def.external) { window.location.href = RJ.BASE + def.external + '#nick=' + encodeURIComponent(RJ.nick()); return; }
      if (def.page) { RJ.route = 'center'; def.render(SCREEN, p[2] || 'report'); return; }
      RJ.route = 'm'; RJ.engine.run(SCREEN, def, { autoVerify: h.query.v === '1' }); return;
    }
    if (p[0] === 'center') {
      var c = RJ.modules.center;
      RJ.route = 'center';
      if (c && c.render) c.render(SCREEN, p[1] || 'report'); else renderMissing(SCREEN, 'center');
      return;
    }
    renderMissing(SCREEN, p[0]);
  };

  function handleExt(h) {
    var r = h.query.r, run = null;
    try { run = JSON.parse(r); } catch (e) { run = null; }
    var def = run && RJ.modules[run.mod];
    if (!run || !def || !def.external || !def.endings || !def.endings[run.ending]) {
      RJ.toast('外部模块回传数据无效');
      RJ.go('#/home');
      return;
    }
    run.ts = run.ts || Date.now();
    if (run.grade === undefined) run.grade = (def.endings[run.ending] || {}).grade || 'B';
    if (!run.verify) run.verify = [];
    if (typeof run.seed !== 'number') run.seed = 0;
    if (!run.hooks) run.hooks = {};
    if (!run.path) run.path = [];
    if (!run.picks) run.picks = [];
    if (!run.leftAt) run.leftAt = 'lure';
    RJ.record(run.mod, run);
    if (RJ.inbox && RJ.inbox.afterRun) { RJ.inbox.afterRun(def, run); return; }
    RJ.go('#/m/' + run.mod + '/end/' + run.ending);
  }

  function renderMissing(host, id) {
    document.body.classList.add('skin-dark');
    host.appendChild(RJ.el('div', { class: 'page' }, [
      RJ.el('h2', { text: '找不到页面' }),
      RJ.el('p', { class: 'muted', text: '没有这个模块或路由：' + id }),
      RJ.el('button', { class: 'btn btn-primary', text: '回主屏', onclick: function () { RJ.go('#/home'); } })
    ]));
  }

  /* ================= 锁屏 ================= */

  RJ.lockNotices = function () {
    var out = [];
    RJ.MANIFEST.forEach(function (id) {
      var def = RJ.modules[id];
      if (def && def.lockNotice && !def.page) out.push({ id: id, def: def, n: def.lockNotice });
    });
    return out;
  };

  function renderLock(host) {
    var wrap = RJ.el('div', { class: 'lock' });
    if (RJ.kiosk) wrap.appendChild(RJ.el('div', { class: 'lock-kiosk', text: '展台模式' }));
    wrap.appendChild(RJ.el('div', { class: 'lock-hint', text: '你捡到了一部手机。它的主人，今天收到了这些消息。' }));
    wrap.appendChild(RJ.el('div', { class: 'lock-time', id: 'lock-time', text: clockText() }));
    wrap.appendChild(RJ.el('div', { class: 'lock-date', text: dateText() }));
    var list = RJ.el('div', { class: 'lock-notices' });
    var items = (RJ.inbox && RJ.inbox.lockNotices) ? RJ.inbox.lockNotices() : RJ.lockNotices();
    items.forEach(function (x, i) {
      var app = x.app, title = x.title || x.from, body = x.body || x.text;
      list.appendChild(RJ.el('button', {
        class: 'notice', style: { animationDelay: (i * 60) + 'ms' },
        onclick: function () { RJ.go('#/home'); }
      }, [
        RJ.el('span', { class: 'notice-app', text: app }),
        RJ.el('span', { class: 'notice-line' }, [
          RJ.el('b', { class: 'notice-title', text: title }),
          RJ.el('span', { class: 'notice-body', text: body })
        ])
      ]));
    });
    wrap.appendChild(list);
    wrap.appendChild(RJ.el('div', { class: 'lock-swipe', text: '⌃ 上滑查看全部', onclick: function () { RJ.go('#/home'); } }));
    host.appendChild(wrap);
  }

  function clockText() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function dateText() {
    var d = new Date(), w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + w;
  }

  /* ================= 主屏 ================= */

  function renderHome(host) {
    if (RJ.inbox) { RJ.inbox.render(host); return; }
    renderAppGrid(host);
  }

  function renderAppGrid(host) {
    var runs = RJ.runs();
    var played = {}; runs.forEach(function (r) { played[r.mod] = true; });
    var grid = RJ.el('div', { class: 'appgrid' });
    RJ.MANIFEST.forEach(function (id) {
      var def = RJ.modules[id];
      if (!def || def.page) return;
      var app = def.app || { name: id, icon: '❓', color: '#444' };
      var icon = RJ.el('div', {
        class: 'appicon' + (played[id] ? ' done' : ''),
        style: { background: app.color }, role: 'button', tabindex: '0',
        'aria-label': app.name,
        onclick: function () { openModule(def); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModule(def); } }
      }, [
        RJ.el('span', { class: 'appicon-emo', text: app.icon, role: 'img', 'aria-label': app.name }),
        played[id] ? null : RJ.el('span', { class: 'badge', text: '●' })
      ]);
      grid.appendChild(RJ.el('div', { class: 'appcell' }, [icon, RJ.el('div', { class: 'appname', text: app.name })]));
    });
    RJ.MANIFEST.forEach(function (id) {
      var def = RJ.modules[id];
      if (def) return;
      var app = { name: '施工中', icon: '🚧', color: '#2b3444' };
      grid.appendChild(RJ.el('div', { class: 'appcell' }, [
        RJ.el('div', { class: 'appicon building', style: { background: app.color }, 'aria-label': app.name }, [RJ.el('span', { class: 'appicon-emo', text: app.icon })]),
        RJ.el('div', { class: 'appname', text: app.name })
      ]));
    });

    var dock = RJ.el('div', { class: 'dock' }, [
      RJ.el('button', {
        class: 'dock-app', onclick: function () { RJ.go('#/center'); }
      }, [
        RJ.el('span', { class: 'appicon-emo', text: '🛡️' }),
        RJ.el('span', { class: 'dock-name', text: '反诈中心' })
      ])
    ]);

    host.appendChild(RJ.el('div', { class: 'home' }, [
      RJ.el('div', { class: 'home-head' }, [
        RJ.el('div', { class: 'home-time', text: clockText() }),
        RJ.el('div', { class: 'home-nick', text: RJ.nick() })
      ]),
      grid,
      dock
    ]));
    if (!RJ.store.get('profile', null)) guide();
  }

  function openModule(def) {
    if (def.external) {
      window.location.href = RJ.BASE + def.external + '#nick=' + encodeURIComponent(RJ.nick());
      return;
    }
    if (def.page) { RJ.go('#/center'); return; }
    RJ.go('#/m/' + def.id);
  }

  /* ================= 首次引导（20 §1） ================= */

  function guide() {
    var box = RJ.el('div', { class: 'guide' });
    box.appendChild(RJ.el('h3', { text: '这部手机是谁的？' }));
    var input = RJ.el('input', { class: 'input', type: 'text', maxlength: '12', placeholder: '称呼（可跳过）', 'aria-label': '称呼' });
    var school = RJ.el('input', { class: 'input', type: 'text', maxlength: '12', placeholder: '学校简称（可跳过）', 'aria-label': '学校简称' });
    var life = 1500;
    var chips = RJ.el('div', { class: 'guide-chips' });
    [1000, 1500, 2000, 3000].forEach(function (v) {
      var b = RJ.el('button', { class: 'chip-btn' + (v === 1500 ? ' on' : ''), text: RJ.yuan(v) });
      b.addEventListener('click', function () {
        life = v;
        var all = chips.querySelectorAll('.chip-btn');
        for (var i = 0; i < all.length; i++) all[i].className = 'chip-btn';
        b.className = 'chip-btn on';
      });
      chips.appendChild(b);
    });
    /* 40 §1：首次进入先选“今天玩多久”，快速局默认高亮 */
    var mode = RJ.mode();
    var modeChips = RJ.el('div', { class: 'guide-chips' });
    [['quick', '5 分钟快速局'], ['full', '完整的一天']].forEach(function (m) {
      var b = RJ.el('button', { class: 'chip-btn' + (m[0] === mode ? ' on' : ''), text: m[1] });
      b.addEventListener('click', function () {
        mode = m[0];
        var all = modeChips.querySelectorAll('.chip-btn');
        for (var i = 0; i < all.length; i++) all[i].className = 'chip-btn';
        b.className = 'chip-btn on';
      });
      modeChips.appendChild(b);
    });
    box.appendChild(RJ.el('div', { class: 'guide-card' }, [
      input,
      school,
      RJ.el('div', { class: 'guide-label', text: '今天玩多久' }),
      modeChips,
      RJ.el('p', { class: 'muted small', style: { margin: '4px 0 0' }, text: '快速局：约 3 个骗局 + 3 条真消息，5 分钟能看到复盘；完整的一天：全部消息都能收到。' }),
      RJ.el('div', { class: 'guide-label', text: '每月生活费（决定零钱包，可跳过）' }),
      chips
    ]));
    box.appendChild(RJ.el('p', { class: 'muted small', text: '只存在这台设备上，不上传任何信息；全部可以跳过。' }));
    function save() {
      var n = (input.value || '').trim() || ('访客' + Math.floor(1000 + Math.random() * 9000));
      RJ.setMode(mode);
      RJ.setProfile({ nick: n, school: (school.value || '').trim(), life: life, created: Date.now() });
      RJ.render();   // 背后的收件箱是用默认称呼/生活费画的，存完立即重画
    }
    var m = RJ.modal(box, {
      dismiss: false,
      buttons: [
        {
          text: '先测一测：你能识破几个骗局？', cls: 'btn-primary', keep: true, onClick: function () {
            save(); m.close();
            if (RJ.modules.center && RJ.modules.center.api && RJ.modules.center.api.startQuiz) RJ.modules.center.api.startQuiz('pre');
            else RJ.go('#/center/quiz');
          }
        },
        {
          text: '以后再说', cls: 'btn-ghost', onClick: function () {
            save();
            RJ.toast('这部手机今天会收到十几条消息');
          }
        }
      ]
    });
  }

  /* ================= 外壳与启动 ================= */

  function statusTick() {
    RJ.syncClock();
    var t = clockText();
    ['lock-time'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.textContent = t;
    });
  }

  RJ.guide = guide;

  RJ.boot = function () {
    var q = {};
    try {
      String(window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
        var i = kv.indexOf('='); if (i < 0) return; q[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
      });
    } catch (e) { }
    var cls = RJ.store.get('class', false);
    if (q['class'] === '1') cls = true;
    if (q['class'] === '0') cls = false;
    RJ.setClass(cls);
    var kiosk = RJ.store.get('kiosk', false);
    if (q['kiosk'] === '1') kiosk = true;
    RJ.setKiosk(kiosk);

    SCREEN = document.getElementById('screen');
    statusTick(); setInterval(statusTick, 15000);

    window.addEventListener('hashchange', function () { RJ.render(); });
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'c' || e.key === 'C') { if (!e.ctrlKey && !e.metaKey) { RJ.setClass(!RJ.classroom); if (RJ.render) RJ.render(); return; } }
      for (var i = 0; i < RJ.keyHandlers.length; i++) {
        if (RJ.keyHandlers[i](e) === true) { e.preventDefault(); return; }
      }
    });
    if (!window.location.hash) { window.location.hash = '#/lock'; }
    RJ.render();
  };

  /* 供 index.html 的 <script>RJ.boot()</script> 调用后的补丁点（保持文件独立） */
})();
