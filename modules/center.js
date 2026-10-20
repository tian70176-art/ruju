/* 模块 center · 反诈中心（体检报告 / 识骗挑战 / 骗子经济学 / 结局图鉴 / 展台 / 讲解 / 关于）—— 规格见 方案/20，高手局改动见 方案/30 §4 §5 §6
 * 页面模块：不走剧本引擎、不计入骗局模块数，只读 RJ 数据（RJ.runs / RJ.store / RJ.modules）。
 * 本文件只做一件事：调用 RJ.register(def)；其余为本页面的渲染与计算逻辑。
 */
(function () {
  'use strict';

  /* 课程信息：由使用者填写 */
  var TEAM = { course: '【待填写】', members: '【待填写】', teacher: '【待填写】' };

  /* 骗局模块清单：从 manifest 动态取（40 §4 追加了 4 个新模块，不能再写死 7 个） */
  var SCAM_MODS = (RJ.MANIFEST || []).filter(function (id) {
    var d = RJ.modules[id];
    return d && !d.page;
  });
  var HOOK_KEYS = ['greed', 'fear', 'authority', 'emotion', 'urgency', 'sunk'];

  /* 高手局：雷达第 7 维「多疑」= 误判真消息的次数（来自 rj.inbox.done 与 rj.days，见 30 §4） */
  var DOUBT_KEY = 'doubt';
  var DOUBT_NAME = '多疑';
  var DOUBT_ICON = '🤔';

  /* 核实渠道（30 §2.3）的中文名与「走错的代价」说明 */
  var VIA_LABEL = {
    orig: '打通讯录里原来的号码', app: '在官方 App 内查', ask: '问辅导员 / 家人', police: '110 / 96110 / 派出所',
    search: '搜索结果第 1 条「官方客服电话」', given: '对方给的「核实电话」', group: '对方拉的群', video: '让对方开视频'
  };
  var VIA_WHY = {
    search: '搜索结果第 1 条是广告位的假客服', given: '对方给的号码是他同伙接的',
    group: '对方拉的群里全是托', video: '视频里也可能是换脸或录像'
  };
  var STAGE_KEYS = ['lure', 'trust', 'hook', 'harvest', 'lock'];
  var STAGE_COLOR = { lure: '#7a8ba6', trust: '#2bb3a8', hook: '#e8b931', harvest: '#f08a3c', lock: '#e5484d' };
  var STAGE_INK = { hook: '#3b2f05' };
  var SCENE_LABEL = { sms: '短信', chat: '微聊', call: '来电' };
  var TAB_DEF = [['report', '体检报告'], ['quiz', '识骗挑战'], ['econ', '骗子经济学'], ['gallery', '结局图鉴'], ['about', '关于']];

  /* 照抄：结论句 / 提示 / 声明 / 一句话 / 求助渠道 */
  var T = {
    econTitle: '为什么 99% 的人识破了，骗子还在赚钱？',
    econEnd: '每一步多一个人醒悟，骗子的生意就少一半。你不需要识破所有骗局，只要在任何一步停下来。',
    cardTip: '长按保存，发到班群看看谁最难骗。',
    cardFoot: '入局 · 大学生反诈沉浸实验室 ｜ 反诈教育模拟，所有资金均为虚拟',
    dataNote: '本站不联网、不收集任何信息，所有记录只保存在这台设备上，可随时清空。',
    oneLine: '你捡到一部“手机”：收件箱里有 11 条骗局、9 条真消息，长得一模一样。选「5 分钟快速局」就抽 3 个骗局 + 3 条真消息，也可以玩完整的一天。你点进去、聊下去、做选择——然后翻到骗子那一面，看他的剧本。'
  };

  /* 题目场景对应的「五步剧本」阶段，用于图鉴与统计文案 */
  var MODEL = [
    ['刷单返利', 'shuadan', {
      lure: '在家点赞，一单 ¥3–5，日结',
      trust: '先做个小单，佣金马上到账',
      hook: '福利单：充 ¥100 返 ¥130',
      harvest: '进阶任务：充 ¥1,000 返 ¥1,300',
      lock: '卡单了，再补一单才能提现'
    }],
    ['金沙娱乐', 'wangdu', {
      lure: '注册就送体验金，先玩两把',
      trust: '你手气真不错，第一把就赢了',
      hook: '赢了就走？充多点额度更大',
      harvest: '再充一点，就能把输的赢回来',
      lock: '账户异常，充值解冻才能提现'
    }],
    ['演唱会门票', 'gouwu', {
      lure: '平台抽成太高，加微聊私下交易',
      trust: '票面截图给你看，先到先得',
      hook: '点这个链接付款，官方担保交易',
      harvest: '资金冻结了，交保证金才能激活',
      lock: '要退款？下载软件、共享屏幕'
    }],
    ['同城缘遇', 'jiaoyou', {
      lure: '“附近的人”跟你打招呼',
      trust: '聊学校、聊爱好，发张自拍',
      hook: '这里聊不方便，换个软件视频吧',
      harvest: '装软件、开权限，我们视频',
      lock: '转钱，不然发给你通讯录里的人'
    }],
    ['学长的兼职', 'bangxin', {
      lure: '借你银行卡走流水，一笔 1%',
      trust: '帮工作室走账，我干半年了没事',
      hook: '刷个脸认证一下，拉同学还有奖励',
      harvest: '钱到账了，按我说的转出去',
      lock: '账户被冻结，就说这是你自己的钱'
    }],
    ['误开通直播会员', 'xiaodai', {
      lure: '客服来电：你误开通了直播会员，每月自动扣费',
      trust: '报得出你的账号，还说“不信自己搜官方电话核实”',
      hook: '搜到的第 1 条是广告位假客服，说“没问题”，再转接“李警官”',
      harvest: '核验账户的钱今天 17 点前必须转',
      lock: '你涉嫌洗钱，转到安全账户自证清白'
    }],
    ['室友的视频', 'huanlian', {
      lure: '在吗？急事',
      trust: '先借我 ¥2,000，转到我朋友卡上',
      hook: '视频里就是我，快点，手机没电了',
      harvest: '看到是我了吧，尾号 2741，快转',
      lock: '再借 ¥3,000，急！！'
    }],
    ['同城跑腿', 'paotui', {
      lure: '校友圈：同城跑腿，取个件给 ¥300，日结',
      trust: '第一单真取了文件袋，¥300 当天到账',
      hook: '“客户的首饰”，很沉；让你带朋友一起做',
      harvest: '按指令去快递柜取黄金包裹，送到指定地点',
      lock: '民警来电：你经手的是别人被骗的钱'
    }],
    ['新生群里的老师', 'xinsheng', {
      lure: '班级群里“辅导员”：教务升级，今晚线上核学籍',
      trust: '群里十几个人回复“收到”，头像和真辅导员一样',
      hook: '“进云会议开屏幕共享，我逐个看”',
      harvest: '共享后让你打开银行 App“核对助学金卡”',
      lock: '“私聊我”，而不是在群里公开回答'
    }],
    ['代练 / 收号', 'youxi', {
      lure: '游戏好友：帮我代练，月付 ¥500',
      trust: '发来“交易平台”截图，扫码加“平台客服”',
      hook: '先交 ¥1,000 保证金，退款要“刷流水”',
      harvest: '屏幕共享，还劝你拿家里人的手机配合',
      lock: '或换个说法：¥520 收你的号，再说你妈妈账号“涉案”'
    }],
    ['一起去泰国过泼水节', 'chujing', {
      lure: '朋友邀你一起去泰国过泼水节',
      trust: '帮你规划行程，机票自己在正规渠道买',
      hook: '“落地有朋友的朋友接，比打车便宜”',
      harvest: '临出发她说航班改了：“你先去，司机安排好了”',
      lock: '落地后朋友没出现，被陌生人接走（只演到出发前）'
    }]
  ];

  /* ================= 题库：44 张，A/B 各 22（各 11 骗 11 正） =================
   * 前测用 A 套，后测用 B 套，练习随机。20 §2 的 6 张示例卡逐字照抄。
   * 高手局（30 §5）：新增 S14 一对卡（a21/a22、b21/b22）——同一个群、同一个头像，
   * 一条发群收款收体检费（假班主任），一条通知开会（真）；两套文案不同但一一对应。
   */
  var BANK = [
    /* ---------- A 套：11 张骗局 ---------- */
    { id: 'a01', set: 'A', from: '兼职猫·小雅', scene: 'chat', text: '在家动动手指点赞，一单 ¥3–5，日结，学生党首选～', scam: true, why: '点赞日结是刷单诈骗的开场', mod: 'shuadan' },
    { id: 'a02', set: 'A', from: '同城缘遇·小鹿', scene: 'chat', text: '这个软件聊天不方便，下载「甜蜜语音」我们视频吧', scam: true, why: '催你换软件 + 下载陌生 App', mod: 'jiaoyou' },
    { id: 'a03', set: 'A', from: '171****0000', scene: 'call', text: '（来电）您误开通了直播会员，每月自动扣费 ¥98，我帮您取消，先别挂。', scam: true, why: '主动联系你的客服，一律去官方 App 或官方客服电话核实', mod: 'xiaodai' },
    { id: 'a04', set: 'A', from: '点赞员 3 群·导师阿杰', scene: 'chat', text: '福利单来了！充 ¥100 返 ¥130，名额有限，抢完就没了，做不做？', scam: true, why: '刷单的“福利单”就是让你先掏钱', mod: 'shuadan' },
    { id: 'a05', set: 'A', from: '金沙娱乐·客服', scene: 'chat', text: '新会员注册送 ¥1,000 体验金，再充 ¥500 送彩金，稳赚不赔，快来！', scam: true, why: '平台送体验金，是养鱼期的开始', mod: 'wangdu' },
    { id: 'a06', set: 'A', from: '闲趣二手·转票小林', scene: 'chat', text: '平台抽成太高了，加我微聊私下交易吧，这张内场票便宜 ¥300 给你。', scam: true, why: '脱离官方平台交易，基本都是诈骗', mod: 'gouwu' },
    { id: 'a07', set: 'A', from: '校友圈·学长阿伟', scene: 'chat', text: '有个躺赚的兼职：借你银行卡走个流水，一笔给你 1% 手续费，稳赚不亏。', scam: true, why: '出借银行卡就是帮信，可能构成犯罪', mod: 'bangxin' },
    { id: 'a08', set: 'A', from: '室友小周', scene: 'chat', text: '在吗？急事！手机快没电了，先借我 ¥2,000，转到我朋友卡上，尾号 2741。', scam: true, why: '借钱 + 着急 + 换收款人，是盗号诈骗三件套', mod: 'huanlian' },
    { id: 'a09', set: 'A', from: '171****5678', scene: 'sms', text: '您购买的连衣裙质量有问题，我们给您三倍赔付，请添加客服微聊办理退款。', scam: true, why: '赔付不会让你加私人微聊，退款一定原路返回', mod: null },
    { id: 'a10', set: 'A', from: '106****', scene: 'sms', text: '恭喜您被抽为本平台幸运用户，领奖前请先支付 ¥99 物流费，24 小时内有效。', scam: true, why: '真中奖不会让你先付钱', mod: null },
    { id: 'a21', set: 'A', from: '班级群 · 班主任', scene: 'chat', text: '同学们注意：本学期体检费 ¥180，请在本群收款里交一下，今天截止。', scam: true, why: '收费信息要打电话、开视频找老师本人核实', mod: null },

    /* ---------- A 套：11 张正常 ---------- */
    { id: 'a11', set: 'A', from: '106****', scene: 'sms', text: '【星城银行】您的验证码 4**7，用于登录手机银行。验证码请勿告知任何人，包括银行工作人员。', scam: false, why: '正常的验证码短信；真正的风险是有人向你要它', mod: null },
    { id: 'a12', set: 'A', from: '96110', scene: 'call', text: '（来电）你好，这里是反诈专线，你近期可能接触到刷单类诈骗，请注意防范。', scam: false, why: '96110 是全国反诈专线，来电一定要接', mod: null },
    { id: 'a13', set: 'A', from: '星城银行', scene: 'sms', text: '【星城银行】您尾号 2741 的账户收到转账 ¥200.00，付款方：学校财务处。', scam: false, why: '学校的正常到账通知，核对金额就好', mod: null },
    { id: 'a14', set: 'A', from: '校友圈·班群', scene: 'chat', text: '明天下午的年级会改到 3 教 201，请同学们互相转告。', scam: false, why: '正常通知：不要钱、不要信息、不要下载', mod: null },
    { id: 'a15', set: 'A', from: '校友圈·篮球社', scene: 'chat', text: '周五 19:00 在体育馆有招新宣讲，想来的同学直接来就行，不收报名费。', scam: false, why: '校内社团活动，不涉及转账和验证码', mod: null },
    { id: 'a16', set: 'A', from: '国家反诈中心', scene: 'sms', text: '来电预警已开启：过去 24 小时为您拦截 3 个疑似诈骗号码。', scam: false, why: '反诈 App 的预警通知，不是骗局', mod: null },
    { id: 'a17', set: 'A', from: '学校保卫处', scene: 'sms', text: '【保卫处提醒】近期冒充客服退款类诈骗高发，凡是要求转账、共享屏幕的都要当心。', scam: false, why: '学校官方提醒，转给室友看看就好', mod: null },
    { id: 'a18', set: 'A', from: '校园服务号', scene: 'sms', text: '您预约的图书馆自习座位已确认，请按时到场，超时 30 分钟将自动释放。', scam: false, why: '校内服务通知，没有链接、也不收费', mod: null },
    { id: 'a19', set: 'A', from: '室友小周', scene: 'call', text: '（来电）兄弟，我在外面吃饭忘带手机了，先借我 ¥200，回宿舍给你现金。', scam: false, why: '听得出是他本人，但转账只转本人账户', mod: null },
    { id: 'a20', set: 'A', from: '票多多', scene: 'sms', text: '【票多多】您的订单已退款 ¥1,280，将原路退回您的付款账户，请留意银行到账。', scam: false, why: '平台内退款原路返回，不需要你再操作', mod: null },
    { id: 'a22', set: 'A', from: '班级群 · 班主任', scene: 'chat', text: '明天上午 9 点在学院楼 302 开年级会，请准时参加。', scam: false, why: '同一个群、同一个头像，真通知不收钱不要信息', mod: null },

    /* ---------- B 套：11 张骗局 ---------- */
    { id: 'b01', set: 'B', from: '171****0000', scene: 'call', text: '您误开通的直播会员今晚自动扣费，不信可以自己搜官方客服电话核实。', scam: true, why: '他敢让你核实，因为搜出来的第 1 条就是他的人', mod: 'xiaodai' },
    { id: 'b02', set: 'B', from: '金沙娱乐·客服', scene: 'chat', text: '您的账户异常已被风控，需再充值 ¥500 解冻，解冻后本息一起提现。', scam: true, why: '要提现先充值，是网赌平台的固定套路', mod: 'wangdu' },
    { id: 'b03', set: 'B', from: '票多多·官方客服', scene: 'call', text: '（来电）您的订单卡单了，我教您开一下屏幕共享，帮您把退款操作完成。', scam: true, why: '真客服不会让你开屏幕共享', mod: 'gouwu' },
    { id: 'b04', set: 'B', from: '同城缘遇·小鹿', scene: 'chat', text: '我这边有你视频的截图，转 ¥3,000 就删掉，不然发给你通讯录里所有人。', scam: true, why: '一旦给钱，索取便会无休无止', mod: 'jiaoyou' },
    { id: 'b05', set: 'B', from: '校友圈·学长阿伟', scene: 'chat', text: '老板说刷个脸就行，顺便把卡号和手机号发过来，办完一单马上结钱。', scam: true, why: '提供实名核验帮助，也可能构成帮信', mod: 'bangxin' },
    { id: 'b06', set: 'B', from: '室友小周', scene: 'chat', text: '看得到是我吧？快点转，我这边等着用，别打电话问了。', scam: true, why: '视频里的人也可能是假的；换条路核实', mod: 'huanlian' },
    { id: 'b07', set: 'B', from: '兼职群·群主', scene: 'chat', text: '进群领任务：先垫付一笔，完成后本金和佣金一起返，日结不拖欠。', scam: true, why: '“垫付”两个字就是刷单诈骗', mod: null },
    { id: 'b08', set: 'B', from: '106****', scene: 'sms', text: '【资助中心】您的助学金审核未通过，请补缴 ¥500 认证费后重新提交申请。', scam: true, why: '助学金不会让你先交钱', mod: null },
    { id: 'b09', set: 'B', from: '182****3344', scene: 'call', text: '（来电）我是市公安局刑侦支队的，你涉嫌一起洗钱案，请把资金转入安全账户接受审查。', scam: true, why: '公检法不会电话办案，也没有安全账户', mod: null },
    { id: 'b10', set: 'B', from: '106****', scene: 'sms', text: '您的视频会员已自动续费 ¥29，如需退款请点击链接填写银行卡信息与验证码。', scam: true, why: '退款要银行卡信息和验证码，是钓鱼', mod: null },
    { id: 'b21', set: 'B', from: '班级群 · 班主任', scene: 'chat', text: '本学期体检费 ¥180，请点本群收款交一下，今天 17 点前截止。', scam: true, why: '真老师不会在群里收款，要打电话、开视频核实', mod: null },

    /* ---------- B 套：11 张正常 ---------- */
    { id: 'b11', set: 'B', from: '班级群·辅导员', scene: 'chat', text: '明早 8 点在 3 教 201 开年级会，请准时参加。', scam: false, why: '正常通知：不要钱、不要信息、不要下载', mod: null },
    { id: 'b12', set: 'B', from: '96110', scene: 'call', text: '（来电）这里是反诈专线回访，请确认您没有向陌生账户转账，也不要相信“安全账户”。', scam: false, why: '96110 回访是正常电话，一定要接', mod: null },
    { id: 'b13', set: 'B', from: '星城银行', scene: 'sms', text: '【星城银行】银行不会以任何理由索要您的验证码、密码，也不会要求您共享屏幕。', scam: false, why: '银行官方提醒，把这句话记住', mod: null },
    { id: 'b14', set: 'B', from: '班级群·辅导员', scene: 'chat', text: '你上次交的奖学金申请表我看了，明天下午来我办公室一趟，带上学生证。', scam: false, why: '老师约谈不会要钱，也不要验证码', mod: null },
    { id: 'b15', set: 'B', from: '星城银行', scene: 'sms', text: '【星城银行】您尾号 2741 的账户支出 ¥100.00，摘要：校园卡充值。', scam: false, why: '你本人操作的正常扣款，核对一下就好', mod: null },
    { id: 'b16', set: 'B', from: '室友小周', scene: 'chat', text: '我在楼下超市，手机快没电了，先借我 ¥50，回寝室还你现金。', scam: false, why: '当面借还的小事，别转给陌生账户', mod: null },
    { id: 'b17', set: 'B', from: '闲趣二手', scene: 'sms', text: '【闲趣二手】您的商品已被拍下，买家已付款至平台担保，请按平台流程发货。', scam: false, why: '平台担保交易，别走私下转账', mod: null },
    { id: 'b18', set: 'B', from: '校友圈·就业中心', scene: 'chat', text: '周五校招宣讲会报名成功，请提前 15 分钟入场，带上简历即可。', scam: false, why: '正常校招通知，不收费、不下载', mod: null },
    { id: 'b19', set: 'B', from: '校园驿站', scene: 'sms', text: '【校园驿站】您的快递已到 3 号柜，取件码 6****2，请 24 小时内取走。', scam: false, why: '正常取件通知，不需要你转账付款', mod: null },
    { id: 'b20', set: 'B', from: '校友圈·学生会', scene: 'chat', text: '周四中午在食堂门口有反诈宣传活动，答题送小礼品，欢迎来玩。', scam: false, why: '校园反诈活动通知，正常', mod: null },
    { id: 'b22', set: 'B', from: '班级群 · 班主任', scene: 'chat', text: '明早 8 点年级会，还是一教报告厅，请互相转告。', scam: false, why: '同一个群、同一个头像，真通知不收钱不要信息', mod: null }
  ];

  /* ================= 注册 ================= */

  RJ.register({
    id: 'center',
    title: '反诈中心',
    type: '体检报告 / 识骗挑战 / 骗子经济学',
    role: 'victim',
    page: true,
    app: { name: '反诈中心', icon: '🛡️', color: '#2d6cdf' },
    render: render,
    api: { startQuiz: startQuiz, quizBank: BANK },
    TEAM: TEAM,

    /* 页面模块不走剧本引擎；以下仅为自检页与统一档案页所需的元数据 */
    endings: {
      e_center_s: {
        grade: 'S', title: '反诈示范生', stamp: 'safe',
        text: '这些骗局里，你已经在大多数局里提前停下了；前测和后测的分差，就是你这一路醒过来的证据。这套剧本靠的不是聪明，而是习惯：先挂断、再核实、要转账就停。把这套习惯带出这台手机，你就成了他们的坏消息。'
      },
      e_center_b: {
        grade: 'B', title: '停在半路的清醒', stamp: 'stop',
        text: '你付出过一些代价才停下来，这不丢人——真正的骗局本来就是给不甘心的人设计的。损失可以报警、可以取证，但最值钱的一课是你已经知道自己在哪一步最容易被留住。把那一步记下来，下次它换件外套来找你，你也能认出来。'
      },
      e_center_x: {
        grade: 'X', title: '还没醒', stamp: 'caught',
        text: '雷达上那个最高的弱点，就是骗子最容易按下的那个按钮。现在它还是空的，或者你已经踩进去过一次——都没关系，这台手机上的钱是虚拟的，代价也是虚拟的；现实里没有存档点。再从锁屏走一遍，这次在中途停下来一次就够。'
      }
    },
    reveal: {
      truth: '所有骗局，一套剧本。认识了五步，就认识了全部骗局。',
      crew: [
        ['引流手', '在群里、私信、“附近的人”里找到你'],
        ['话术组', '按五步剧本包装身份，陪你聊到信'],
        ['收割组', '催你转账、交保证金、开屏幕共享'],
        ['洗钱通道', '把赃款拆散转走，借你的银行卡也是它']
      ],
      boom: {
        title: '五步剧本：每个模块，同一套流水线',
        render: function (host, run) {
          host.appendChild(modelDiagram());
          host.appendChild(RJ.el('p', { class: 'boom-note', text: '换的是身份和台词，不换的是这五步。你在任何一个模块里的选择，都发生在同一格子里。' }));
          if (run && run.mod) {
            host.appendChild(RJ.el('p', { class: 'boom-note', text: '你刚刚走过的模块：' + ((RJ.modules[run.mod] && RJ.modules[run.mod].title) || run.mod) }));
          }
        }
      },
      tips: [
        '96110 打来的电话，一定要接',
        '陌生链接、陌生软件、屏幕共享，都是红旗',
        '先交钱才能赚钱的，都是骗局',
        '亲友借钱，换一条路核实、转到本人账户',
        '银行卡、手机卡、账号，一律不出租出借'
      ],
      after: [
        '立刻停止转账，保存聊天记录和转账记录',
        '拨打 110 报警，96110 来电一定要接',
        '账户出现异常，第一时间联系银行',
        '告诉家人和辅导员，别一个人扛'
      ],
      sources: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14'],
      laws: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']
    }
  });

  /* ================= 通用工具 ================= */

  var cleanups = [];
  var quizCtl = null;      // 当前挂载的识骗挑战控制器
  var pendingQuiz = '';    // core 调用 startQuiz 时记下的待开始模式
  var verClicks = 0;       // 关于页版本号连点计数

  function cleanup() {
    cleanups.forEach(function (fn) { try { fn(); } catch (e) { } });
    cleanups = [];
    quizCtl = null;
  }
  function later(fn, ms) { var t = setTimeout(fn, ms); cleanups.push(function () { clearTimeout(t); }); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); cleanups.push(function () { clearInterval(t); }); return t; }
  function alive(el) { return !!(el && el.parentNode && document.body.contains(el)); }

  function allRuns() { var r = RJ.runs(); return Array.isArray(r) ? r : []; }
  function modDef(id) { return RJ.modules && RJ.modules[id] ? RJ.modules[id] : null; }
  function modName(id) { var d = modDef(id); return d ? (d.title || id) : id; }

  function crackedCount() {
    var rs = allRuns(), n = 0;
    SCAM_MODS.forEach(function (id) {
      if (!modDef(id)) return;
      if (rs.some(function (r) { return r.mod === id && (r.grade === 'S' || r.grade === 'A'); })) n++;
    });
    return n;
  }
  function playedModules() {
    var rs = allRuns();
    return SCAM_MODS.filter(function (id) { return rs.some(function (r) { return r.mod === id; }); }).length;
  }
  function galStats() {
    var total = 0, got = 0, rs = allRuns();
    SCAM_MODS.forEach(function (id) {
      var d = modDef(id);
      if (!d || !d.endings) return;
      var keys = Object.keys(d.endings);
      total += keys.length;
      keys.forEach(function (k) {
        if (rs.some(function (r) { return r.mod === id && r.ending === k; })) got++;
      });
    });
    return { total: total, got: got };
  }
  function hookCounts() {
    var cnt = {}, total = 0;
    HOOK_KEYS.forEach(function (k) { cnt[k] = 0; });
    allRuns().forEach(function (r) {
      var h = r.hooks || {};
      HOOK_KEYS.forEach(function (k) { if (h[k]) { cnt[k] += h[k]; total += h[k]; } });
    });
    return { cnt: cnt, total: total };
  }
  function topHook() {
    var h = hookCounts(), best = null;
    HOOK_KEYS.forEach(function (k) { if (h.cnt[k] > 0 && (!best || h.cnt[k] > h.cnt[best])) best = k; });
    return best;
  }
  /* 多疑 = 误判真消息的次数（30 §4）。口径（避免重复计数）：
   *   · 已经归档进 rj.days 的日子只算一次（各日 misjudge 之和）；
   *   · 当天还没复盘完（rj.inbox.finished 为假）时，再用 rj.inbox.done 里 misjudge:true 的条数补上。 */
  function misjudge() {
    var days = RJ.store.get('days', []);
    if (!Array.isArray(days)) days = [];
    var fromDays = 0;
    days.forEach(function (d) { fromDays += (d && Number(d.misjudge)) || 0; });
    var ib = RJ.store.get('inbox', null) || {};
    var live = 0;
    if (!ib.finished) {
      var done = ib.done || {};
      Object.keys(done).forEach(function (k) { if (done[k] && done[k].misjudge) live++; });
    }
    return { days: fromDays, live: live, total: fromDays + live, dayCount: days.length + (live ? 1 : 0) };
  }
  function doubtCount() { return misjudge().total; }
  /* 核实习惯：本机每局 run.verify + 收件箱 rj.inbox.verify（30 §2.3 / §4）
   * 可传入 runs（展台页把归档访客 + 当前访客的 run 一起传进来）；不传则用本机全部 run。 */
  function verifyHabits(runs) {
    var items = [], wrong = {}, order = ['search', 'given', 'group', 'video', 'orig', 'app', 'ask', 'police'];
    (runs || allRuns()).forEach(function (r) {
      (r.verify || []).forEach(function (v) { if (v && v.via) items.push(v); });
    });
    var ib = RJ.store.get('inbox', null);
    if (ib && Array.isArray(ib.verify)) ib.verify.forEach(function (v) { if (v && v.via) items.push(v); });
    var good = 0;
    items.forEach(function (v) {
      if (v.ok) { good++; return; }
      wrong[v.via] = (wrong[v.via] || 0) + 1;
    });
    var list = [];
    order.forEach(function (k) { if (wrong[k]) list.push({ via: k, n: wrong[k] }); });
    return { total: items.length, good: good, bad: items.length - good, list: list };
  }
  /* 展台：本机每天复盘均分（rj.days；误判用与雷达同一口径，见 misjudge()） */
  function dayStats() {
    var days = RJ.store.get('days', []);
    if (!Array.isArray(days)) days = [];
    var ok = days.filter(function (d) { return d && typeof d.breakRate === 'number'; });
    function avg(key) {
      if (!ok.length) return null;
      var s = 0;
      ok.forEach(function (d) { s += Number(d[key]) || 0; });
      return s / ok.length;
    }
    var mj = misjudge();
    return {
      n: days.length, breakRate: avg('breakRate'), trustRate: avg('trustRate'),
      misjudge: mj.dayCount ? mj.total / mj.dayCount : null
    };
  }

  function wakeCounts() {
    var cnt = {};
    STAGE_KEYS.forEach(function (s) { cnt[s] = 0; });
    allRuns().forEach(function (r) {
      var s = STAGE_KEYS.indexOf(r.leftAt) >= 0 ? r.leftAt : 'lure';
      cnt[s]++;
    });
    return cnt;
  }

  /* 展台：把「访客列表」拍平成 run 列表（归档 sessions + 当前访客） */
  function flattenRuns(all) {
    var out = [];
    (all || []).forEach(function (v) { (v.runs || []).forEach(function (r) { if (r) out.push(r); }); });
    return out;
  }

  /* 易错题排行「最多人被骗的那一步」（40 §5.3）。口径：
   *   ① 只看真的亏了钱的局（run.loss > 0）——「及时止损」和识破都不算；
   *   ② 在该局 run.path 里从后往前找第一个 stage 为 harvest（收割）或 lock（锁死）的节点，
   *      那就是他被收割的那一步；同一节点被多少局踩中，就计多少次数；
   *   ③ 按模块分组，取该模块被踩中最多的那个节点；
   *   ④ 外部模块（wangdu）没有 nodes、path 为空：只按模块计数，不显示节点台词。 */
  function harvestRank(runs) {
    var byMod = {}, order = [];
    (runs || []).forEach(function (r) {
      if (!r || !r.mod) return;
      if (!(Number(r.loss) > 0)) return;
      var d = modDef(r.mod);
      var path = Array.isArray(r.path) ? r.path : [];
      var hit = null;
      if (d && d.nodes) {
        for (var i = path.length - 1; i >= 0; i--) {
          var n = d.nodes[path[i]];
          if (n && (n.stage === 'harvest' || n.stage === 'lock')) { hit = path[i]; break; }
        }
      }
      if (!byMod[r.mod]) { byMod[r.mod] = { mod: r.mod, harvested: 0, nodes: {}, noNode: 0, hasNodes: !!(d && d.nodes) }; order.push(r.mod); }
      var m = byMod[r.mod];
      m.harvested++;
      if (hit) m.nodes[hit] = (m.nodes[hit] || 0) + 1;
      else m.noNode++;
    });
    return order.map(function (mod) {
      var m = byMod[mod], best = null, bestN = 0;
      Object.keys(m.nodes).forEach(function (nid) {
        if (m.nodes[nid] > bestN) { bestN = m.nodes[nid]; best = nid; }
      });
      return { mod: mod, name: modName(mod), harvested: m.harvested, node: best, n: bestN, count: bestN || m.noNode, hasNodes: m.hasNodes };
    }).sort(function (a, b) { return b.count - a.count || b.harvested - a.harvested; });
  }

  /* 节点台词前 40 字：say 形如 [[说话人, 文本], …]；外部模块没有 nodes 时返回 '' */
  function nodeLine(mod, nodeId) {
    var d = modDef(mod);
    if (!d || !d.nodes || !nodeId) return '';
    var n = d.nodes[nodeId];
    if (!n || !n.say) return '';
    var texts = [];
    n.say.forEach(function (l) {
      if (!l) return;
      var t = Array.isArray(l) ? l[l.length - 1] : l;
      if (typeof t === 'string' && t) texts.push(RJ.fill(t));
    });
    var s = texts.join(' ');
    return s.length > 40 ? s.slice(0, 40) + '…' : s;
  }

  /* 「惊弓之鸟」占比（40 §5.2）：本机每天复盘里称号为「惊弓之鸟」的天数 ÷ 已复盘天数 */
  function timidRatio() {
    var days = RJ.store.get('days', []);
    if (!Array.isArray(days) || !days.length) return { n: 0, total: 0, rate: null };
    var n = days.filter(function (d) { return d && d.title === '惊弓之鸟'; }).length;
    return { n: n, total: days.length, rate: n / days.length };
  }

  function lossTotals() {
    var loss = 0, dirty = 0;
    allRuns().forEach(function (r) { loss += (Number(r.loss) || 0); dirty += (Number(r.dirty) || 0); });
    return { loss: loss, dirty: dirty };
  }
  function board() {
    var b = RJ.store.get('quizBoard', []);
    if (!Array.isArray(b)) b = [];
    return b.filter(function (x) { return x && typeof x.score === 'number'; });
  }
  function bestScore() {
    var b = board(), nick = RJ.nick(), best = null;
    b.forEach(function (x) { if (x.nick === nick && (best === null || x.score > best)) best = x.score; });
    return best;
  }
  function prePost() {
    var p = RJ.profile();
    var pre = p.pre && typeof p.pre.score === 'number' ? p.pre.score : null;
    var post = p.post && typeof p.post.score === 'number' ? p.post.score : null;
    return { pre: pre, post: post };
  }
  function postUnlocked() { return playedModules() >= 3; }

  function secTitle(text) { return RJ.el('div', { class: 'sec-title', text: text }); }
  function kpiRow(items) {
    return RJ.el('div', { class: 'kpi-row' }, items.map(function (it) {
      return RJ.el('div', { class: 'kpi' }, [
        RJ.el('div', { class: 'kpi-big', text: it[1] }),
        RJ.el('div', { class: 'kpi-label', text: it[0] })
      ]);
    }));
  }
  function btn(text, cls, fn) {
    return RJ.el('button', { class: 'btn ' + (cls || 'btn-ghost'), text: text, onclick: fn });
  }
  function fmtPct(v) {
    if (!isFinite(v) || v <= 0) return '0%';
    var p = v * 100;
    if (p >= 1) return p.toFixed(1) + '%';
    if (p >= 0.01) return p.toFixed(3) + '%';
    return p.toFixed(5) + '%';
  }
  function fmtNum(v) {
    if (!isFinite(v)) return '0';
    if (v < 1) return v.toFixed(2);
    if (v < 10) return v.toFixed(1);
    return RJ.num(v);
  }
  function dateStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function bankFor(mode) {
    if (mode === 'pre') return BANK.filter(function (c) { return c.set === 'A'; });
    if (mode === 'post') return BANK.filter(function (c) { return c.set === 'B'; });
    return BANK.slice();
  }

  /* ================= 页面骨架 ================= */

  function render(host, tab) {
    cleanup();
    document.body.classList.add('skin-dark');
    var hashTab = RJ.parseHash(window.location.hash).parts[1] || '';
    var valid = {};
    TAB_DEF.forEach(function (t) { valid[t[0]] = 1; });
    valid.kiosk = 1; valid.guide = 1;
    if (!tab || !valid[tab]) tab = 'report';
    /* 展台模式下，只写到 #/center（没指定 tab）时直接进后台统计页 */
    if (RJ.kiosk && !hashTab) tab = 'kiosk';

    var body = RJ.el('div', { class: 'center-body' });
    var page = RJ.el('div', { class: 'page center' }, [headBar(), body]);
    if (tab === 'report' || tab === 'quiz' || tab === 'econ' || tab === 'gallery' || tab === 'about') {
      page.insertBefore(tabBar(tab), body);
    } else {
      page.insertBefore(RJ.el('div', { class: 'tabs' }, [ btn('← 返回体检报告', 'btn-ghost', function () { RJ.go('#/center/report', true); }) ]), body);
    }
    host.appendChild(page);

    try {
      if (tab === 'quiz') renderQuiz(body);
      else if (tab === 'econ') renderEcon(body);
      else if (tab === 'gallery') renderGallery(body);
      else if (tab === 'kiosk') renderKiosk(body);
      else if (tab === 'guide') renderGuide(body);
      else if (tab === 'about') renderAbout(body);
      else renderReport(body);
    } catch (e) {
      body.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('p', { class: 'bad', text: '页面渲染出错：' + (e && e.message) })
      ]));
    }
    page.appendChild(RJ.el('p', { class: 'foot-note', text: RJ.COMPLIANCE }));
    if (tab === 'kiosk' && !RJ.kiosk) {
      page.insertBefore(RJ.el('p', { class: 'muted small', text: '提示：从主屏用 ?kiosk=1 打开，或在「关于」页连点版本号 5 次，可进入展台模式。' }), page.lastChild);
    }
  }

  function headBar() {
    var right = [
      RJ.el('span', { class: 'chip', text: RJ.nick() }),
      RJ.el('span', { class: 'chip', text: '已破局 ' + crackedCount() + '/' + SCAM_MODS.length })
    ];
    if (RJ.kiosk) right.push(RJ.el('button', {
      class: 'chip warn', text: '展台模式 · 退出',
      onclick: function () { RJ.setKiosk(false); RJ.toast('已退出展台模式'); RJ.go('#/center/report', true); }
    }));
    if (RJ.classroom) right.push(RJ.el('span', { class: 'chip', text: '课堂模式' }));
    return RJ.el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' } }, [
      RJ.el('div', { style: { fontSize: '19px', fontWeight: 700 } }, [RJ.el('span', { text: '🛡️ 反诈中心' })]),
      RJ.el('div', { class: 'chips' }, right.concat([btn('← 主屏', 'btn-ghost', function () { RJ.go('#/home'); })]))
    ]);
  }

  function tabBar(active) {
    return RJ.el('div', { class: 'tabs' }, TAB_DEF.map(function (t) {
      return RJ.el('button', {
        class: 'tab' + (t[0] === active ? ' active' : ''),
        text: t[1],
        onclick: function () { RJ.go('#/center/' + t[0], true); }
      });
    }));
  }

  /* ================= 识骗挑战 ================= */

  function startQuiz(which) {
    var mode = (which === 'pre' || which === 'post') ? which : 'practice';
    var h = RJ.parseHash(window.location.hash).parts;
    var onQuiz = (h[0] === 'center' && h[1] === 'quiz');
    if (onQuiz && quizCtl) { quizCtl.start(mode); return; }
    pendingQuiz = mode;
    if (!onQuiz) RJ.go('#/center/quiz', true);
    else RJ.render();
  }

  function renderQuiz(host) {
    var shell = RJ.el('div');
    host.appendChild(shell);
    var st = {
      mode: '', running: false, over: false, cards: [], idx: 0,
      score: 0, streak: 0, right: 0, wrong: [], left: 60,
      timer: null, keyOff: null, cardHost: null, elScore: null, elStreak: null, touchX: null
    };

    quizCtl = { start: start, state: st };
    drawIntro();
    if (pendingQuiz) { var m = pendingQuiz; pendingQuiz = ''; start(m); }

    /* ---- 开始一局 ---- */
    function start(mode) {
      if (mode === 'post' && !postUnlocked()) {
        RJ.toast('再玩 ' + (3 - playedModules()) + ' 个模块，就能做后测了');
        return;
      }
      st.mode = mode;
      st.cards = shuffle(bankFor(mode).slice());
      st.idx = 0; st.score = 0; st.streak = 0; st.right = 0; st.wrong = []; st.left = 60;
      st.running = true; st.over = false;
      drawGame();
      clearInterval(st.timer);
      dropKey();
      st.keyOff = RJ.onKey(function (e) {
        if (!st.running) return false;
        if (e.key === 'ArrowLeft' || e.key === '1') { answer(true); return true; }
        if (e.key === 'ArrowRight' || e.key === '2') { answer(false); return true; }
        return false;
      });
      st.timer = every(function () {
        if (!alive(shell)) { cleanup(); return; }
        st.left--;
        var t = shell.querySelector('.quiz-timer');
        if (t) t.textContent = st.left + 's';
        if (st.left <= 0) finish();
      }, 1000);
    }

    function dropKey() { if (st.keyOff) { st.keyOff(); st.keyOff = null; } }

    function drawIntro() {
      RJ.clear(shell);
      shell.appendChild(secTitle('识骗挑战 · 60 秒'));
      shell.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('p', { style: { margin: '0 0 8px' }, text: '60 秒，一次一张卡。真的假的，你来判：判断对了 +10 分，连对还会加速加分（每张 +2）。' }),
        RJ.el('p', { class: 'muted small', style: { margin: '0 0 8px' }, text: '题库 44 张：A / B 两套各 22 张，各 11 条骗局、11 条正常。' }),
        RJ.el('p', { class: 'muted small', style: { margin: 0 }, text: '手机上点按钮或左右滑动；键盘 ← = 骗局，→ = 正常。' }),
        RJ.el('div', { class: 'btns' }, [
          btn('开始练习（随机题库）', 'btn-primary', function () { start('practice'); }),
          btn('前测 · A 套 22 张', 'btn-ghost', function () { start('pre'); }),
          btn('后测 · B 套 22 张' + (postUnlocked() ? '' : '（未解锁）'), postUnlocked() ? 'btn-ghost' : 'btn-locked', function () {
            if (!postUnlocked()) { RJ.toast('再玩 ' + (3 - playedModules()) + ' 个模块解锁后测'); return; }
            start('post');
          })
        ])
      ]));

      var pp = prePost();
      shell.appendChild(secTitle('我的成绩'));
      shell.appendChild(RJ.el('div', { class: 'kpi-row' }, [
        RJ.el('div', { class: 'kpi' }, [RJ.el('div', { class: 'kpi-big', text: pp.pre === null ? '—' : String(pp.pre) }), RJ.el('div', { class: 'kpi-label', text: '前测（A 套）' })]),
        RJ.el('div', { class: 'kpi' }, [RJ.el('div', { class: 'kpi-big', text: pp.post === null ? '—' : String(pp.post) }), RJ.el('div', { class: 'kpi-label', text: '后测（B 套）' })]),
        RJ.el('div', { class: 'kpi' }, [RJ.el('div', { class: 'kpi-big', text: bestScore() === null ? '—' : String(bestScore()) }), RJ.el('div', { class: 'kpi-label', text: '我的挑战最高分' })]),
        RJ.el('div', { class: 'kpi' }, [RJ.el('div', { class: 'kpi-big', text: String(playedModules()) + '/' + SCAM_MODS.length }), RJ.el('div', { class: 'kpi-label', text: '已玩模块' })])
      ]));

      shell.appendChild(secTitle('本机排行榜 · 前 10'));
      shell.appendChild(boardList());
    }

    function boardList() {
      var b = board().slice().sort(function (x, y) { return y.score - x.score || (x.ts || 0) - (y.ts || 0); }).slice(0, 10);
      var ul = RJ.el('ul', { class: 'board-list' });
      if (!b.length) {
        ul.appendChild(RJ.el('li', {}, [RJ.el('span', { class: 'muted', text: '还没有人上榜，第一个就是你。' })]));
      } else {
        b.forEach(function (x, i) {
          ul.appendChild(RJ.el('li', {}, [
            RJ.el('span', { text: (i + 1) + '. ' + (x.nick || '访客') }),
            RJ.el('span', { class: 'mono', text: String(x.score) })
          ]));
        });
      }
      return ul;
    }

    function drawGame() {
      RJ.clear(shell);
      shell.appendChild(RJ.el('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' } }, [
        RJ.el('div', {}, [
          RJ.el('span', { class: 'chip', text: st.mode === 'pre' ? '前测 · A 套' : st.mode === 'post' ? '后测 · B 套' : '练习 · 随机' })
        ]),
        RJ.el('span', { class: 'quiz-timer', text: st.left + 's' })
      ]));
      st.elScore = RJ.el('span', { text: '得分 ' + st.score });
      st.elStreak = RJ.el('span', { text: '连对 ' + st.streak });
      shell.appendChild(RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#93a3b8', margin: '2px 0 8px' } }, [st.elScore, st.elStreak]));
      st.cardHost = RJ.el('div', {
        ontouchstart: function (e) {
          var t = e.changedTouches && e.changedTouches[0];
          st.touchX = t ? t.clientX : null;
        },
        ontouchend: function (e) {
          var t = e.changedTouches && e.changedTouches[0];
          if (!t || st.touchX === null) return;
          var dx = t.clientX - st.touchX;
          st.touchX = null;
          if (Math.abs(dx) < 45) return;
          answer(dx < 0);
        }
      });
      shell.appendChild(st.cardHost);
      shell.appendChild(RJ.el('p', { class: 'muted small', style: { marginTop: '10px' }, text: '左滑 / 键盘 ← = 骗局，右滑 / 键盘 → = 正常' }));
      showCard();
    }

    function showCard() {
      var hostEl = st.cardHost;
      if (!hostEl) return;
      RJ.clear(hostEl);
      var c = st.cards[st.idx % st.cards.length];
      hostEl.appendChild(RJ.el('div', { class: 'quiz-card' }, [
        RJ.el('div', { class: 'quiz-from' }, [
          RJ.el('span', { class: 'chip', text: SCENE_LABEL[c.scene] || c.scene }),
          RJ.el('span', { text: '发件方：' + c.from })
        ]),
        RJ.el('div', { class: 'quiz-text', text: c.text }),
        RJ.el('div', { class: 'quiz-btns' }, [
          btn('🚨 骗局', 'btn-primary', function () { answer(true); }),
          btn('✅ 正常', 'btn-safe', function () { answer(false); })
        ])
      ]));
    }

    function answer(guessScam) {
      if (!st.running || st.over) return;
      var c = st.cards[st.idx % st.cards.length];
      var ok = (!!guessScam === !!c.scam);
      var gain = 0;
      if (ok) {
        gain = 10 + 2 * st.streak;
        st.score += gain;
        st.streak++;
        st.right++;
      } else {
        st.streak = 0;
        st.wrong.push(c);
      }
      st.idx++;
      if (st.elScore) st.elScore.textContent = '得分 ' + st.score;
      if (st.elStreak) st.elStreak.textContent = '连对 ' + st.streak;
      RJ.toast(ok ? '答对了 +' + gain : '答错：' + c.why, 1.6);
      showCard();
    }

    function finish() {
      if (st.over) return;
      st.over = true; st.running = false;
      dropKey();
      clearInterval(st.timer);
      st.timer = null;
      var answered = st.right + st.wrong.length;

      /* 写排行榜（本机前 10） */
      var b = board().slice();
      b.push({ nick: RJ.nick(), score: st.score, ts: Date.now() });
      b.sort(function (x, y) { return y.score - x.score || (x.ts || 0) - (y.ts || 0); });
      RJ.store.set('quizBoard', b.slice(0, 10));

      /* 前测 / 后测写进 profile */
      if (st.mode === 'pre') RJ.setProfile({ pre: { score: st.score, ts: Date.now() } });
      if (st.mode === 'post') RJ.setProfile({ post: { score: st.score, ts: Date.now() } });

      RJ.clear(shell);
      shell.appendChild(secTitle('识骗挑战 · 本局结果'));
      shell.appendChild(RJ.el('div', { class: 'quiz-card' }, [
        RJ.el('div', { class: 'kpi-big', style: { fontSize: '40px' }, text: String(st.score) + ' 分' }),
        RJ.el('div', { class: 'kpi-label', text: (st.mode === 'pre' ? '前测 · A 套' : st.mode === 'post' ? '后测 · B 套' : '练习 · 随机') + ' · 60 秒' }),
        RJ.el('p', { class: 'muted small', text: '判断了 ' + answered + ' 张：答对 ' + st.right + ' 张，答错 ' + st.wrong.length + ' 张' })
      ]));

      if (st.mode === 'pre' || st.mode === 'post') {
        var pp = prePost();
        shell.appendChild(RJ.el('p', { class: 'small' }, [
          RJ.el('span', { text: '前测 ' + (pp.pre === null ? '—' : pp.pre) + ' 分 ｜ 后测 ' + (pp.post === null ? '—' : pp.post) + ' 分' })
        ]));
        if (st.mode === 'post' && pp.pre !== null) {
          shell.appendChild(RJ.el('p', { class: 'small ok', text: '前测 → 后测：' + pp.pre + ' → ' + pp.post + ' 分（' + ((pp.post - pp.pre) >= 0 ? '+' : '') + (pp.post - pp.pre) + ' 分）' }));
        }
      }

      if (st.wrong.length) {
        shell.appendChild(secTitle('本局错题 · 及解析'));
        st.wrong.forEach(function (c) {
          shell.appendChild(RJ.el('div', { class: 'card' }, [
            RJ.el('div', { class: 'quiz-from' }, [
              RJ.el('span', { class: 'chip', text: c.scam ? '其实是骗局' : '其实是正常' }),
              RJ.el('span', { text: c.from })
            ]),
            RJ.el('p', { style: { margin: '6px 0' }, text: c.text }),
            RJ.el('p', { class: 'small warn', style: { margin: 0 }, text: '解析：' + c.why })
          ]));
        });
      } else if (answered > 0) {
        shell.appendChild(RJ.el('p', { class: 'small ok', text: '这一局没有错题。别急着高兴——换个说法再来一次，才算真的会。' }));
      }

      shell.appendChild(secTitle('本机排行榜 · 前 10'));
      shell.appendChild(boardList());

      shell.appendChild(RJ.el('div', { class: 'btns' }, [
        btn('再来一局', 'btn-primary', function () { start(st.mode); }),
        btn('看体检报告', 'btn-ghost', function () { RJ.go('#/center/report'); }),
        btn('回主屏', 'btn-ghost', function () { RJ.go('#/home'); })
      ]));
    }
  }

  /* ================= 体检报告 ================= */

  function renderReport(host) {
    var p = RJ.profile();
    var cracked = crackedCount();
    var gal = galStats();
    var money = lossTotals();
    var hooks = hookCounts();

    host.appendChild(secTitle('体检报告 · ' + (p.nick || '访客')));
    host.appendChild(kpiRow([
      ['昵称', (p.nick || '访客')],
      ['已破局', cracked + '/' + SCAM_MODS.length],
      ['结局图鉴', gal.got + '/' + gal.total],
      ['累计虚拟损失', RJ.yuan(money.loss)],
      [(RJ.defOf && (RJ.defOf('bangxin') || {}).dirtyLabel) || '帮信赃款手续费', RJ.yuan(money.dirty)],
      ['已玩模块', playedModules() + '/' + SCAM_MODS.length]
    ]));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '金额均为模拟数据，只统计这台设备上的记录。' }));
    var wal = RJ.wallet();
    host.appendChild(RJ.el('p', { class: 'mono small', text: '这个月零钱包：' + RJ.yuan(Math.max(0, wal.left)) + ' ｜ ≈ 还剩 ' + RJ.MEALS(wal.left) + ' 顿饭（约 ' + Math.floor(RJ.MEALS(wal.left) / 3) + ' 天，模拟数据）' }));

    /* 易感雷达 · 七维（6 弱点 + 多疑） */
    var doubt = doubtCount();
    var dims = HOOK_KEYS.map(function (k) { return { k: k, value: hooks.cnt[k] || 0 }; });
    dims.push({ k: DOUBT_KEY, value: doubt });
    var dimTotal = 0;
    dims.forEach(function (d) { dimTotal += d.value; });
    host.appendChild(secTitle('易感雷达 · 七维（六个心理弱点 + 多疑）'));
    var wrap = RJ.el('div', { class: 'canvas-wrap' }, [radarCanvas(dims, 330)]);
    host.appendChild(wrap);
    if (!dimTotal) {
      wrap.appendChild(RJ.el('p', { class: 'muted small', style: { margin: '8px 0 0', textAlign: 'center' }, text: '还没有数据，雷达是空的。' }));
      host.appendChild(RJ.el('div', { class: 'btns' }, [btn('去玩一个模块', 'btn-primary', function () { RJ.go('#/home'); })]));
    } else {
      var legend = RJ.el('div', { class: 'hook-row', style: { marginTop: '8px' } }, dims.map(function (d) {
        var pct = Math.round(d.value / dimTotal * 100);
        return RJ.el('span', { class: 'hook-chip h-' + d.k, text: dimIcon(d.k) + ' ' + dimName(d.k) + ' ' + pct + '%' });
      }));
      host.appendChild(legend);
      host.appendChild(RJ.el('p', { class: 'muted small', text: '第 7 维「多疑」= 你把真消息误判、举报掉的次数：' + doubt + ' 次。识骗和信任要一起看——多疑也有代价。' }));
    }

    /* 你的核实习惯（30 §2.3 / §4） */
    var habits = verifyHabits();
    host.appendChild(secTitle('你的核实习惯'));
    host.appendChild(RJ.el('div', { class: 'card habit' }, [
      RJ.el('div', { class: 'habit-row' }, [RJ.el('span', { text: '走对渠道' }), RJ.el('b', { class: 'ok', text: habits.good + ' 次' })]),
      RJ.el('div', { class: 'habit-row' }, [RJ.el('span', { text: '走错渠道' }), RJ.el('b', { class: 'bad', text: habits.bad + ' 次' })]),
      habits.list.length ? RJ.el('div', {}, habits.list.map(function (w) {
        return RJ.el('div', { class: 'habit-row' }, [
          RJ.el('span', { class: 'bad', text: VIA_LABEL[w.via] || w.via }),
          RJ.el('span', { class: 'mono small', text: w.n + ' 次' })
        ]);
      })) : null,
      habits.list.length ? RJ.el('div', { class: 'muted small', text: '走错的那几次：' + habits.list.map(function (w) { return (VIA_WHY[w.via] || (VIA_LABEL[w.via] || w.via)) + '（' + w.n + ' 次）'; }).join('；') + '。' }) : null,
      !habits.total ? RJ.el('div', { class: 'muted small', text: '还没有核实记录。下一局点开顶栏的「🔎 核实」，看它怎么记。' }) : null,
      RJ.el('div', { class: 'muted small', text: '打通讯录里原来的号码、在官方 App 内查、问辅导员 / 家人、拨 110 或 96110——这四个渠道永远有效。' })
    ]));

    /* 你在哪一步醒来 */
    var wake = wakeCounts();
    host.appendChild(secTitle('你在哪一步醒来'));
    var wakeBar = RJ.el('div', { class: 'stagebar' });
    var maxWake = 0;
    STAGE_KEYS.forEach(function (s) { if (wake[s] > maxWake) maxWake = wake[s]; });
    STAGE_KEYS.forEach(function (s) {
      wakeBar.appendChild(RJ.el('div', {
        class: 'stage ' + (wake[s] ? 'on s-' + s : 'off'),
        title: RJ.STAGE_DESC[s]
      }, [
        RJ.el('div', { class: 'stage-mark', text: wake[s] ? String(wake[s]) + ' 局' : '—' }),
        RJ.el('div', { class: 'stage-name', text: RJ.STAGE_LABEL[s] }),
        RJ.el('div', { class: 'stage-code', text: s })
      ]));
    });
    host.appendChild(wakeBar);
    host.appendChild(RJ.el('p', { class: 'muted small', text: maxWake ? '数字 = 你有多少局是在这一步离开的。越靠前醒来，代价越小。' : '还没有记录。玩一局，这里会告诉你停在了哪一步。' }));

    /* 防骗处方 */
    var th = topHook();
    host.appendChild(secTitle('你的防骗处方'));
    if (th) {
      host.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('div', { class: 'hook-row' }, [RJ.el('span', { class: 'hook-chip h-' + th, text: RJ.HOOK_ICON[th] + ' 最大弱点：' + RJ.HOOKS[th] })]),
        RJ.el('p', { style: { margin: '10px 0 0', fontSize: '16px' }, text: RJ.HOOK_ADVICE[th] })
      ]));
    } else {
      host.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('p', { class: 'muted small', style: { margin: 0 }, text: '处方要等你先留下记录：玩一局，雷达最高的那个弱点就会被写在这里。' })
      ]));
    }

    /* 前测 vs 后测 */
    var pp = prePost();
    host.appendChild(secTitle('前测 vs 后测'));
    var scale = Math.max(pp.pre || 0, pp.post || 0, 60);
    var bars = RJ.el('div', { style: { display: 'flex', gap: '16px', alignItems: 'flex-end', height: '150px', padding: '0 4px' } });
    [['前测（A 套）', pp.pre, '#2d6cdf'], ['后测（B 套）', pp.post, '#2bb3a8']].forEach(function (row) {
      var v = row[1];
      var colH = v === null ? 4 : Math.max(6, Math.round(120 * v / scale));
      bars.appendChild(RJ.el('div', { style: { flex: '1', textAlign: 'center' } }, [
        RJ.el('div', { class: 'mono', style: { fontSize: '15px' }, text: v === null ? '—' : String(v) }),
        RJ.el('div', { style: { height: colH + 'px', background: row[2], borderRadius: '6px 6px 0 0', marginTop: '4px' } }),
        RJ.el('div', { class: 'muted small', text: row[0] })
      ]));
    });
    host.appendChild(RJ.el('div', { class: 'card' }, [bars]));
    if (pp.pre !== null && pp.post !== null) {
      var d = pp.post - pp.pre;
      host.appendChild(RJ.el('p', { class: 'small ' + (d >= 0 ? 'ok' : 'bad'), text: '提升 ' + (d >= 0 ? '+' : '') + d + ' 分（前测 ' + pp.pre + ' → 后测 ' + pp.post + '）' }));
    } else {
      host.appendChild(RJ.el('p', { class: 'muted small', text: pp.pre === null ? '还没做前测：可以先去识骗挑战做 A 套。' : '还没做后测。' }));
      host.appendChild(RJ.el('div', { class: 'btns' }, [
        btn(pp.pre === null ? '去做前测（A 套）' : '做后测（B 套）', 'btn-primary', function () { startQuiz(pp.pre === null ? 'pre' : 'post'); }),
        RJ.el('span', { class: 'small muted', text: postUnlocked() ? '后测已解锁' : '再玩 ' + Math.max(0, 3 - playedModules()) + ' 个模块解锁后测' })
      ]));
    }

    /* 战绩卡 */
    host.appendChild(secTitle('战绩卡'));
    var verdictText = verdict(cracked);
    var dataUrl = drawCard({
      nick: p.nick || '访客',
      cracked: cracked,
      hook: th ? RJ.HOOKS[th] : '还没有记录',
      best: bestScore(),
      verdict: verdictText
    });
    host.appendChild(RJ.el('div', { class: 'card' }, [
      dataUrl ? RJ.el('img', { src: dataUrl, alt: '我的战绩卡', style: { width: '100%', borderRadius: '12px', border: '1px solid #22314a', display: 'block' } })
        : RJ.el('p', { class: 'muted small', text: '这台设备没能生成图片，直接截图这一段也可以。' }),
      RJ.el('p', { style: { margin: '10px 0 0', textAlign: 'center', fontSize: '13px' }, text: T.cardTip }),
      RJ.el('p', { class: 'muted small', style: { margin: '6px 0 0', textAlign: 'center' }, text: '这张图就在页面上，长按（手机）或右键（电脑）即可保存。' })
    ]));
    host.appendChild(RJ.el('div', { class: 'btns' }, [
      btn('🏅 查看总评详情', 'btn-ghost', function () {
        var id = cracked >= 6 ? 'e_center_s' : (cracked >= 2 ? 'e_center_b' : 'e_center_x');
        RJ.go('#/m/center/end/' + id, true);
      }),
      btn('看识骗挑战排行榜', 'btn-ghost', function () { RJ.go('#/center/quiz', true); })
    ]));

    /* 求助卡（照抄） */
    host.appendChild(secTitle('遇到可疑情况'));
    host.appendChild(RJ.el('div', { class: 'card' }, [
      RJ.el('p', { style: { margin: 0, fontSize: '15px', lineHeight: 1.9 }, text: '遇到可疑情况：' }),
      RJ.el('p', { style: { margin: '2px 0 0', fontSize: '15px', lineHeight: 1.9 }, text: '110 报警 ｜ 96110 反诈专线来电一定要接 ｜ 下载 国家反诈中心 App ｜ 学校保卫处 / 辅导员。' })
    ]));
  }

  function verdict(cracked) {
    if (cracked >= SCAM_MODS.length) return '所有骗局都识破了——这套剧本，你已经背下来了。';
    if (cracked >= 4) return '大部分骗局你都停下了，剩下的只是还没遇到。';
    if (cracked >= 1) return '你已经识破过骗局；下一个来找你的，会换一套说法。';
    if (allRuns().length) return '还没识破任何一局。他们是专业的，别急着怪自己。';
    return '还没开始。先去玩一局，这张卡才会像你。';
  }

  /* ================= Canvas：雷达 / 战绩卡 ================= */

  /* 雷达图：dimensions = [{k, value}]，k 为 6 个心理弱点代号或 'doubt'（多疑） */
  function radarCanvas(dimensions, W) {
    var H = Math.round(W * 0.86);
    var c = RJ.el('canvas', { width: W, height: H, 'aria-label': '易感雷达图：六个心理弱点加多疑' });
    var g = c.getContext('2d');
    if (!g) return c;
    var N = dimensions.length, total = 0, i;
    for (i = 0; i < N; i++) total += dimensions[i].value || 0;
    var cx = W / 2, cy = H / 2 + 4, R = Math.min(W - 96, H - 52) / 2;
    var ang, r, x, y;
    function angleAt(k) { return -Math.PI / 2 + k * 2 * Math.PI / N; }

    g.clearRect(0, 0, W, H);
    /* 网格 */
    for (var ring = 1; ring <= 3; ring++) {
      g.beginPath();
      for (i = 0; i < N; i++) {
        ang = angleAt(i);
        r = R * ring / 3;
        x = cx + Math.cos(ang) * r; y = cy + Math.sin(ang) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.fillStyle = ring === 3 ? 'rgba(147,163,184,.07)' : 'rgba(147,163,184,.03)';
      g.fill();
      g.strokeStyle = 'rgba(147,163,184,.28)';
      g.lineWidth = 1;
      g.stroke();
    }
    for (i = 0; i < N; i++) {
      ang = angleAt(i);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
      g.strokeStyle = 'rgba(147,163,184,.22)';
      g.stroke();
    }
    /* 数据多边形 */
    var pts = [];
    for (i = 0; i < N; i++) {
      ang = angleAt(i);
      var share = total ? (dimensions[i].value || 0) / total : 0;
      r = R * (total ? share : 0);
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    g.beginPath();
    pts.forEach(function (q, k) { if (k === 0) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); });
    g.closePath();
    if (total) {
      g.fillStyle = 'rgba(45,108,223,.35)';
      g.fill();
      g.strokeStyle = '#5f9bff';
      g.lineWidth = 2;
      g.stroke();
      pts.forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 3, 0, Math.PI * 2); g.fillStyle = '#5f9bff'; g.fill(); });
    } else {
      g.fillStyle = 'rgba(147,163,184,.10)';
      g.fill();
      g.strokeStyle = 'rgba(147,163,184,.4)';
      g.lineWidth = 1;
      g.stroke();
      g.fillStyle = '#7d8da4';
      g.font = '13px sans-serif';
      g.textAlign = 'center';
      g.fillText('暂无数据', cx, cy + 4);
    }
    /* 标签 */
    g.font = '11.5px sans-serif';
    for (i = 0; i < N; i++) {
      ang = angleAt(i);
      x = cx + Math.cos(ang) * (R + 16);
      y = cy + Math.sin(ang) * (R + 16) + 4;
      var k2 = dimensions[i].k;
      var share2 = total ? Math.round((dimensions[i].value || 0) / total * 100) : 0;
      var label = dimName(k2) + (total ? ' ' + share2 + '%' : '');
      g.textAlign = Math.abs(x - cx) < 6 ? 'center' : (x > cx ? 'left' : 'right');
      g.fillStyle = total && dimensions[i].value ? '#e8eef7' : '#7d8da4';
      g.fillText(label, x, y);
    }
    return c;
  }

  function dimName(k) { return k === DOUBT_KEY ? DOUBT_NAME : (RJ.HOOKS[k] || k); }
  function dimIcon(k) { return k === DOUBT_KEY ? DOUBT_ICON : (RJ.HOOK_ICON[k] || ''); }

  function drawCard(info) {
    var W = 600, H = 800;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    if (!g) return '';
    g.fillStyle = '#0d1526';
    g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, 0, 260);
    grd.addColorStop(0, '#1b2b45');
    grd.addColorStop(1, '#0d1526');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, 260);
    g.strokeStyle = '#22314a';
    g.lineWidth = 4;
    g.strokeRect(16, 16, W - 32, H - 32);

    g.fillStyle = '#2d6cdf';
    g.fillRect(16, 16, W - 32, 10);
    g.fillStyle = '#e8eef7';
    g.font = 'bold 40px sans-serif';
    g.fillText('入局 · 战绩卡', 44, 116);
    g.fillStyle = '#93a3b8';
    g.font = '20px sans-serif';
    g.fillText('大学生反诈沉浸实验室 ｜ 先入局，再破局', 44, 152);

    g.fillStyle = '#5f9bff';
    g.font = 'bold 34px sans-serif';
    g.fillText(info.nick, 44, 226);

    var rows = [
      ['已破局', info.cracked + ' / ' + SCAM_MODS.length],
      ['最大弱点', info.hook],
      ['挑战最高分', info.best === null ? '—' : String(info.best) + ' 分']
    ];
    var y = 306;
    rows.forEach(function (r) {
      g.fillStyle = '#93a3b8';
      g.font = '20px sans-serif';
      g.fillText(r[0], 44, y);
      g.fillStyle = '#e8eef7';
      g.font = 'bold 26px sans-serif';
      g.fillText(r[1], 240, y);
      g.strokeStyle = '#1d2a41';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(44, y + 18);
      g.lineTo(W - 44, y + 18);
      g.stroke();
      y += 78;
    });

    g.fillStyle = '#93a3b8';
    g.font = '20px sans-serif';
    g.fillText('一句结论', 44, y + 16);
    g.fillStyle = '#e8eef7';
    g.font = '26px sans-serif';
    wrapText(g, info.verdict, 44, y + 62, W - 88, 40);

    g.strokeStyle = '#22314a';
    g.beginPath();
    g.moveTo(44, H - 132);
    g.lineTo(W - 44, H - 132);
    g.stroke();
    g.fillStyle = '#93a3b8';
    g.font = '19px sans-serif';
    wrapText(g, T.cardFoot, 44, H - 92, W - 88, 28);
    g.fillStyle = '#5f7288';
    g.font = '17px sans-serif';
    g.fillText('生成时间 ' + dateStr() + ' ｜ 数据只保存在这台设备上', 44, H - 44);
    return c.toDataURL('image/png');
  }

  function wrapText(g, text, x, y, maxW, lineH) {
    var line = '', out = 0;
    for (var i = 0; i < text.length; i++) {
      var test = line + text.charAt(i);
      if (g.measureText(test).width > maxW && line) {
        g.fillText(line, x, y + out * lineH);
        line = text.charAt(i);
        out++;
      } else {
        line = test;
      }
    }
    if (line) g.fillText(line, x, y + out * lineH);
    return out + 1;
  }

  /* ================= 骗子经济学 ================= */

  function renderEcon(host) {
    var P = [0.02, 0.40, 0.50, 0.60, 0.70];
    var N = 10000, COST = 0.05, LOSS = 8000;
    var useReal = false;

    host.appendChild(secTitle('方法：骗子经济学'));
    host.appendChild(RJ.el('p', { style: { fontSize: '17px', fontWeight: 700, margin: '0 0 10px' }, text: T.econTitle }));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '所有数字都是模拟数据，用来演示同一条乘法：骗子只要等你走完五步里的任意一步。' }));

    var sliders = [];
    STAGE_KEYS.forEach(function (s, i) {
      sliders.push(sliderRow('p' + (i + 1) + ' · ' + RJ.STAGE_LABEL[s] + '阶段通过率', 0, 100, 1, Math.round(P[i] * 100),
        function (v) { P[i] = v / 100; recalc(); },
        function () { return fmtPct(P[i]); }));
    });
    sliders.push(sliderRow('群发人数 N', 1000, 50000, 500, N, function (v) { N = v; recalc(); }, function () { return RJ.num(N) + ' 人'; }));
    sliders.push(sliderRow('每次触达成本', 1, 100, 1, COST * 100, function (v) { COST = v / 100; recalc(); }, function () { return '¥' + COST.toFixed(2); }));
    sliders.push(sliderRow('每位被收割者平均损失', 500, 30000, 500, LOSS, function (v) { LOSS = v; recalc(); }, function () { return RJ.yuan(LOSS); }));

    var slidersBox = RJ.el('div', { class: 'card' }, sliders.map(function (s) { return s.row; }));
    host.appendChild(slidersBox);
    host.appendChild(RJ.el('p', { class: 'muted small', text: '上面每个滑块旁边都是「模拟数据」。' }));

    /* 用本机真实数据 */
    var realWrap = RJ.el('div', { class: 'card' });
    var realBtn = RJ.el('button', {
      class: 'btn ' + (allRuns().length ? 'btn-ghost' : 'btn-locked'),
      text: '用本机真实数据（' + allRuns().length + ' 局）',
      disabled: allRuns().length ? null : true,
      onclick: function () {
        if (!allRuns().length) { RJ.toast('还没有本机记录，先去玩一个模块'); return; }
        useReal = !useReal;
        realBtn.className = 'btn ' + (useReal ? 'btn-primary' : 'btn-ghost');
        realBtn.textContent = (useReal ? '✔ 正在使用本机真实数据（' : '用本机真实数据（') + allRuns().length + ' 局）';
        if (useReal) applyReal();
        setSliderDisabled(useReal);
        recalc();
      }
    });
    realWrap.appendChild(realBtn);
    realWrap.appendChild(RJ.el('p', { class: 'muted small', style: { margin: '8px 0 0' }, text: allRuns().length ? '打开后：p2…p5 换成你本机记录里各阶段的通过率（到达第 k 阶段的局数 ÷ 到达第 k−1 阶段的局数），p1 仍是滑块值。' : '还没有本机记录，这个开关暂时用不了。' }));
    host.appendChild(realWrap);

    /* 漏斗 + KPI + 公式 */
    host.appendChild(secTitle('漏斗 · 从群发到收割'));
    var funnel = RJ.el('div', { class: 'funnel' });
    host.appendChild(funnel);

    var kpiBox = RJ.el('div');
    host.appendChild(kpiBox);

    host.appendChild(secTitle('公式'));
    host.appendChild(RJ.el('div', { class: 'card mono', style: { fontSize: '14px' } }, [
      RJ.el('div', { text: 'P(被骗) = p1·p2·p3·p4·p5' }),
      RJ.el('div', { text: 'E[收入] = N·P(被骗)·L' })
    ]));

    var box = RJ.el('div');
    host.appendChild(box);
    host.appendChild(RJ.el('div', { class: 'btns' }, [
      btn('如果每一步都有一半人醒悟', 'btn-primary', halve)
    ]));

    function applyReal() {
      var rs = allRuns();
      var cnt = STAGE_KEYS.map(function (s, i) {
        return rs.filter(function (r) { return RJ.stageRank(r.leftAt) >= i; }).length;
      });
      for (var i = 1; i < 5; i++) {
        var den = cnt[i - 1], num = cnt[i];
        P[i] = den > 0 ? num / den : 0;
      }
      sliders.forEach(function (sl, i) {
        if (i >= 1 && i <= 4) setSlider(sl, Math.round(P[i] * 100), fmtPct(P[i]));
      });
    }

    function setSliderDisabled(on) {
      sliders.forEach(function (sl, i) {
        if (i >= 1 && i <= 4) {
          sl.input.disabled = on;
          sl.input.style.opacity = on ? .5 : 1;
        }
      });
    }

    function calc() {
      var pass = 1;
      for (var i = 0; i < 5; i++) pass *= P[i];
      var income = N * pass * LOSS;
      var cost = N * COST;
      var profit = income - cost;
      var roi = cost > 0 ? profit / cost : 0;
      var layers = [N];
      var cur = N;
      for (var j = 0; j < 5; j++) { cur = cur * P[j]; layers.push(cur); }
      return { pass: pass, income: income, cost: cost, profit: profit, roi: roi, layers: layers };
    }

    function recalc() {
      if (useReal) applyReal();
      var r = calc();
      /* 漏斗 */
      RJ.clear(funnel);
      r.layers.forEach(function (v, i) {
        var ratio = N > 0 ? v / N : 0;
        var w = ratio > 0 ? Math.max(1.5, 100 * Math.pow(ratio, 0.3)) : 0;
        funnel.appendChild(RJ.el('div', { class: 'funnel-row' }, [
          RJ.el('span', { style: { width: '76px', flex: 'none', color: '#93a3b8' }, text: i === 0 ? '群发 N' : RJ.STAGE_LABEL[STAGE_KEYS[i - 1]] + ' p' + i }),
          RJ.el('div', { style: { flex: '1' } }, [
            RJ.el('div', { class: 'funnel-bar', style: { width: w + '%', background: i === 0 ? '#7a8ba6' : STAGE_COLOR[STAGE_KEYS[i - 1]] } })
          ]),
          RJ.el('span', { class: 'mono', style: { width: '66px', textAlign: 'right', flex: 'none' }, text: fmtNum(v) + ' 人' })
        ]));
      });
      /* KPI */
      RJ.clear(kpiBox);
      kpiBox.appendChild(kpiRow([
        ['P(被骗) 通过率', fmtPct(r.pass)],
        ['期望收入', RJ.yuan(r.income)],
        ['触达成本', RJ.yuan(r.cost)],
        ['利润', RJ.yuan(r.profit)],
        ['ROI', (r.roi >= 0 ? '+' : '') + RJ.num(r.roi * 100) + '%'],
        ['实际被收割人数', fmtNum(N * r.pass) + ' 人']
      ]));
      kpiBox.appendChild(RJ.el('p', { class: 'muted small', text: '期望收入 = N · P(被骗) · L；利润 = 期望收入 − 触达成本；金额与人数均为模拟数据。' }));
    }

    function halve() {
      var before = calc();
      P.forEach(function (v, i) { P[i] = v / 2; });
      sliders.forEach(function (sl, i) {
        if (i < 5) setSlider(sl, Math.round(P[i] * 100), fmtPct(P[i]));
      });
      recalc();
      var after = calc();
      RJ.clear(box);
      box.appendChild(RJ.el('div', { class: 'boom' }, [
        RJ.el('div', { class: 'boom-title', text: '每一步都有一半人醒悟' }),
        RJ.el('div', { class: 'boom-body' }, [
          lineItem('P(被骗)', fmtPct(before.pass) + ' → ' + fmtPct(after.pass) + '（变成 1/32）'),
          lineItem('期望收入', RJ.yuan(before.income) + ' → ' + RJ.yuan(after.income) + '（变成 1/32）'),
          lineItem('利润（N·P·L 口径）', RJ.yuan(before.income) + ' → ' + RJ.yuan(after.income) + '（变成 1/32）'),
          lineItem('净利润（扣掉不变的触达成本 ' + RJ.yuan(after.cost) + '）', RJ.yuan(before.profit) + ' → ' + RJ.yuan(after.profit) + '（成本不变，利润缩得比 1/32 还狠）'),
          RJ.el('p', { style: { margin: '12px 0 0', fontSize: '15px', lineHeight: 1.7 }, text: T.econEnd })
        ])
      ]));
      RJ.toast('每层砍一半：通过率、期望收入都变成 1/32');
    }

    function lineItem(k, v) {
      return RJ.el('div', { style: { display: 'flex', gap: '8px', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', borderBottom: '1px dashed #22314a' } }, [
        RJ.el('span', { style: { color: '#93a3b8', flex: 'none' }, text: k }),
        RJ.el('span', { class: 'mono', style: { textAlign: 'right' }, text: v })
      ]);
    }

    recalc();
  }

  function sliderRow(label, min, max, step, value, onInput, fmt) {
    var out = RJ.el('span', { class: 'mono', text: fmt ? fmt() : String(value) });
    var input = RJ.el('input', {
      type: 'range', min: min, max: max, step: step, value: value,
      'aria-label': label,
      oninput: function () { out.textContent = fmt ? fmt() : input.value; onInput(Number(input.value)); }
    });
    var row = RJ.el('div', { class: 'slider-row' }, [
      RJ.el('label', {}, [RJ.el('span', { text: label }), out]),
      input
    ]);
    return { row: row, input: input, out: out, fmt: fmt };
  }
  function setSlider(sl, value, text) {
    sl.input.value = value;
    if (text !== undefined && text !== null) sl.out.textContent = text;
  }

  /* ================= 结局图鉴 ================= */

  function renderGallery(host) {
    var gal = galStats();
    var runs = allRuns();
    host.appendChild(secTitle('结局图鉴 · 已解锁 ' + gal.got + '/' + gal.total));
    if (gal.total > 0 && gal.got >= gal.total) {
      host.appendChild(RJ.el('div', { class: 'card', style: { borderColor: '#2bb3a8' } }, [
        RJ.el('p', { style: { margin: 0, fontSize: '16px', fontWeight: 700 }, text: '🏆 全图鉴达成' }),
        RJ.el('p', { class: 'muted small', style: { margin: '6px 0 0' }, text: SCAM_MODS.length + ' 个模块的所有结局，你全都见过了。' })
      ]));
    }
    host.appendChild(RJ.el('p', { class: 'muted small', text: '点已解锁的格子，回到那个模块的结局页。' }));

    SCAM_MODS.forEach(function (id) {
      var d = modDef(id);
      if (!d || !d.endings) {
        host.appendChild(RJ.el('div', { class: 'card' }, [
          RJ.el('div', { class: 'small' }, [RJ.el('span', { text: '🚧 ' + id })]),
          RJ.el('p', { class: 'muted small', style: { margin: '4px 0 0' }, text: '这个模块还没注册（施工中）。' })
        ]));
        return;
      }
      var keys = Object.keys(d.endings);
      var got = 0;
      var cells = RJ.el('div', { class: 'gal' });
      keys.forEach(function (k) {
        var e = d.endings[k];
        var on = runs.some(function (r) { return r.mod === id && r.ending === k; });
        if (on) got++;
        var stampKind = e.stamp || 'caught';
        cells.appendChild(RJ.el(on ? 'button' : 'div', {
          class: 'gal-cell' + (on ? '' : ' off'),
          onclick: on ? function () { RJ.go('#/m/' + id + '/end/' + k, true); } : null,
          'aria-label': on ? e.title : '未解锁'
        }, [
          RJ.el('div', { class: 'gal-stamp stamp-' + stampKind, text: on ? (RJ.STAMP_TEXT[stampKind] || '已入局') : '❓' }),
          RJ.el('div', { class: 'gal-title', text: on ? e.title : '？？？' }),
          RJ.el('div', { class: 'gal-grade', text: on ? ('档位 ' + e.grade) : '' })
        ]));
      });
      host.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } }, [
          RJ.el('div', { style: { fontWeight: 700 } }, [RJ.el('span', { text: ((d.app && d.app.icon) || '❓') + ' ' + (d.title || id) })]),
          RJ.el('span', { class: 'mono small', text: got + '/' + keys.length })
        ]),
        RJ.el('div', { style: { marginTop: '8px' } }, [cells]),
        RJ.el('div', { class: 'btns' }, [
          btn('去玩这一局', 'btn-ghost', function () { RJ.go('#/m/' + id, true); })
        ])
      ]));
    });
  }

  /* ================= 展台模式 ================= */

  function renderKiosk(host) {
    var sess = RJ.store.get('kiosk.sessions', []);
    if (!Array.isArray(sess)) sess = [];
    var curRuns = allRuns(), curProfile = RJ.profile();
    var curHas = curRuns.length > 0 || !!curProfile.nick;
    var all = sess.map(function (s) { return { runs: (s && s.runs) || [], profile: (s && s.profile) || {} }; });
    if (curHas) all.push({ runs: curRuns, profile: curProfile });

    host.appendChild(secTitle('展台模式 · 全场统计'));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '给公安 / 学校宣传点用：每位访客玩完，点「下一位访客」归档，再交给下一个人。' }));

    var preScores = [], postScores = [], improves = [];
    all.forEach(function (v) {
      var pr = v.profile || {};
      var pre = pr.pre && typeof pr.pre.score === 'number' ? pr.pre.score : null;
      var post = pr.post && typeof pr.post.score === 'number' ? pr.post.score : null;
      if (pre !== null) preScores.push(pre);
      if (post !== null) postScores.push(post);
      if (pre !== null && post !== null) improves.push(post - pre);
    });
    function avg(a) { if (!a.length) return null; var s = 0; a.forEach(function (x) { s += x; }); return s / a.length; }
    var aPre = avg(preScores), aPost = avg(postScores), aImp = avg(improves);
    function f1(v) { return v === null ? '—' : v.toFixed(1); }

    host.appendChild(kpiRow([
      ['参与人数', String(all.length)],
      ['前测均分', f1(aPre) + (preScores.length ? '（' + preScores.length + ' 人）' : '')],
      ['后测均分', f1(aPost) + (postScores.length ? '（' + postScores.length + ' 人）' : '')],
      ['平均提升', aImp === null ? '—' : ((aImp >= 0 ? '+' : '') + aImp.toFixed(1))],
      ['已归档访客', String(sess.length)],
      ['当前访客', curHas ? (curProfile.nick || '访客') : '—']
    ]));

    /* 各模块结局分布（堆叠条） */
    var allRunsFlat = [];
    all.forEach(function (v) { v.runs.forEach(function (r) { allRunsFlat.push(r); }); });

    /* 一天结束的复盘均分（识骗率 / 信任率，来自 rj.days） */
    var ds = dayStats();
    if (ds.breakRate !== null) {
      host.appendChild(secTitle('全场 · 一天结束的复盘均分'));
      host.appendChild(kpiRow([
        ['已复盘天数', String(ds.n)],
        ['平均识骗率', Math.round(ds.breakRate * 100) + '%'],
        ['平均信任率', Math.round(ds.trustRate * 100) + '%'],
        ['平均误判次数', ds.misjudge.toFixed(1) + ' 次']
      ]));
      host.appendChild(RJ.el('p', { class: 'muted small', text: '识骗率 = 识破的骗局 ÷ 骗局总数；信任率 = 正确处理真消息 ÷ 真消息总数（模拟数据）。' }));
    }

    host.appendChild(secTitle('各模块结局分布'));
    SCAM_MODS.forEach(function (id) {
      var d = modDef(id);
      var rs = allRunsFlat.filter(function (r) { return r.mod === id; });
      var counts = {}, keys = [];
      rs.forEach(function (r) {
        var k = r.ending || '?';
        if (!counts[k]) keys.push(k);
        counts[k] = (counts[k] || 0) + 1;
      });
      var row = RJ.el('div', { style: { marginBottom: '8px' } });
      row.appendChild(RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#93a3b8' } }, [
        RJ.el('span', { text: modName(id) }),
        RJ.el('span', { class: 'mono', text: rs.length + ' 局' })
      ]));
      var barWrap = RJ.el('div', { style: { display: 'flex', height: '14px', background: '#131e31', borderRadius: '4px', overflow: 'hidden', marginTop: '3px' } });
      if (rs.length) {
        keys.forEach(function (k) {
          var e = (d && d.endings && d.endings[k]) || {};
          var kind = e.stamp || 'caught';
          var color = kind === 'safe' ? '#2bb3a8' : (kind === 'stop' ? '#e8b931' : '#e5484d');
          barWrap.appendChild(RJ.el('div', {
            style: { width: (counts[k] / rs.length * 100) + '%', background: color },
            title: k + ' ×' + counts[k]
          }));
        });
      } else {
        barWrap.appendChild(RJ.el('div', { style: { width: '100%', background: '#1b2942' } }));
      }
      row.appendChild(barWrap);
      if (keys.length) {
        row.appendChild(RJ.el('div', { class: 'muted small', text: keys.map(function (k) {
          var e = (d && d.endings && d.endings[k]) || {};
          return (e.grade || '?') + ' ' + (e.title || k) + ' ×' + counts[k];
        }).join(' ｜ ') }));
      }
      host.appendChild(row);
    });

    /* 全场雷达 · 七维 */
    var cnt = {}, hookTotal = 0;
    HOOK_KEYS.forEach(function (k) { cnt[k] = 0; });
    allRunsFlat.forEach(function (r) {
      var h = r.hooks || {};
      HOOK_KEYS.forEach(function (k) { if (h[k]) { cnt[k] += h[k]; hookTotal += h[k]; } });
    });
    var kdims = HOOK_KEYS.map(function (k) { return { k: k, value: cnt[k] || 0 }; });
    kdims.push({ k: DOUBT_KEY, value: doubtCount() });
    host.appendChild(secTitle('全场雷达 · 七维（六个心理弱点 + 多疑）'));
    host.appendChild(RJ.el('div', { class: 'canvas-wrap' }, [radarCanvas(kdims, 330)]));
    host.appendChild(RJ.el('p', { class: 'muted small', text: hookTotal ? '多疑 = 本机每天复盘里累计的误判次数（' + doubtCount() + ' 次）。' : '还没有数据：等第一位访客玩完一局，这里就有形状了。' }));

    /* 全场在哪一步醒来 */
    var wcnt = {};
    STAGE_KEYS.forEach(function (s) { wcnt[s] = 0; });
    allRunsFlat.forEach(function (r) {
      var s = STAGE_KEYS.indexOf(r.leftAt) >= 0 ? r.leftAt : 'lure';
      wcnt[s]++;
    });
    host.appendChild(secTitle('全场 · 在哪一步醒来'));
    var wbar = RJ.el('div', { class: 'stagebar' });
    STAGE_KEYS.forEach(function (s) {
      wbar.appendChild(RJ.el('div', { class: 'stage ' + (wcnt[s] ? 'on s-' + s : 'off'), title: RJ.STAGE_DESC[s] }, [
        RJ.el('div', { class: 'stage-mark', text: wcnt[s] ? String(wcnt[s]) + ' 局' : '—' }),
        RJ.el('div', { class: 'stage-name', text: RJ.STAGE_LABEL[s] }),
        RJ.el('div', { class: 'stage-code', text: s })
      ]));
    });
    host.appendChild(wbar);

    /* 最多人被骗的那一步（40 §5.3）：老师最容易看懂的「数据说话」 */
    var rank = harvestRank(allRunsFlat);
    host.appendChild(secTitle('最多人被骗的那一步 · 易错题排行'));
    var rankBox = RJ.el('div', { class: 'card' });
    rankBox.appendChild(RJ.el('p', { class: 'muted small', style: { margin: '0 0 10px' },
      text: '口径：只统计真的亏了钱的局（损失 > 0）；取该局剧本走到的最后一个「收割 / 锁死」节点，就是他被收割的那一步。下方引号里是他当时听到的那句台词。' }));
    if (!rank.length) {
      rankBox.appendChild(RJ.el('p', { class: 'muted small', style: { margin: 0 }, text: '还没有亏钱的记录。等有人在骗局里走到「收割」那一步，这里就会排出来。' }));
    } else {
      rank.forEach(function (r, i) {
        rankBox.appendChild(RJ.el('div', {
          style: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderTop: i ? '1px dashed #22314a' : 'none' }
        }, [
          RJ.el('span', { style: { flex: 'none', width: '20px', fontWeight: 700, color: '#93a3b8' }, text: String(i + 1) }),
          RJ.el('div', { style: { flex: '1', minWidth: 0 } }, [
            RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' } }, [
              RJ.el('span', { style: { fontWeight: 700, fontSize: '14px' }, text: r.name }),
              RJ.el('span', { class: 'mono small', text: r.node ? ('节点 ' + r.node) : (r.hasNodes ? '无节点' : '外部页面 · 无节点') })
            ]),
            RJ.el('div', { class: 'muted small', style: { marginTop: '3px' }, text: r.node
              ? ('「' + (nodeLine(r.mod, r.node) || '（这个节点没有台词）') + '」')
              : (r.hasNodes ? '这一局亏了钱，但剧本里没有可回放的「收割 / 锁死」节点。' : '这一局的损失记在外部赌场页里，没有可回放的节点台词。') })
          ]),
          RJ.el('span', { class: 'mono', style: { flex: 'none', color: '#e5484d', fontSize: '13px' }, text: '被收割 ' + r.count + ' 次' })
        ]));
      });
    }
    host.appendChild(rankBox);

    /* 操作 */
    host.appendChild(secTitle('展台操作'));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '导出统计：①复制为文字摘要 ②下载 JSON ③打印报告（一页纸报告，离线可用，可直接交给保卫处 / 派出所）。' }));
    host.appendChild(RJ.el('div', { class: 'btns' }, [
      btn('下一位访客', 'btn-primary', function () {
        var list = RJ.store.get('kiosk.sessions', []);
        if (!Array.isArray(list)) list = [];
        list.push({ nick: curProfile.nick || '访客', profile: curProfile, runs: curRuns, ts: Date.now() });
        RJ.store.set('kiosk.sessions', list);
        RJ.store.del('runs');
        RJ.store.del('profile');
        RJ.toast('已归档，交给下一位访客');
        RJ.go('#/lock', true);
      }),
      btn('复制统计文字', 'btn-ghost', function () { copyText(summaryText(all, aPre, aPost, aImp)); }),
      btn('下载 JSON', 'btn-ghost', function () { downloadJson(all); }),
      btn('打印报告', 'btn-primary', function () { printReport(all, aPre, aPost, aImp); }),
      btn('清空全部数据', 'btn-ghost', function () {
        var m = RJ.modal('<p>确定清空这台设备上的全部记录吗？（含所有访客、成绩、图鉴）</p>', {
          buttons: [
            { text: '清空', cls: 'btn-primary', onClick: function () { RJ.store.clear(); RJ.toast('已清空全部记录'); RJ.go('#/lock', true); } },
            { text: '取消', cls: 'btn-ghost' }
          ]
        });
        return m;
      })
    ]));

    if (RJ.kiosk) {
      host.appendChild(RJ.el('div', { class: 'btns' }, [
        btn('退出展台模式', 'btn-ghost', function () { RJ.setKiosk(false); RJ.go('#/center/report', true); })
      ]));
    }
  }

  function summaryText(all, aPre, aPost, aImp) {
    var lines = [];
    lines.push('入局 · 展台统计（' + dateStr() + '）');
    lines.push('参与人数：' + all.length);
    lines.push('前测均分：' + (aPre === null ? '—' : aPre.toFixed(1)));
    lines.push('后测均分：' + (aPost === null ? '—' : aPost.toFixed(1)));
    lines.push('平均提升：' + (aImp === null ? '—' : ((aImp >= 0 ? '+' : '') + aImp.toFixed(1))));
    var ds = dayStats();
    if (ds.breakRate !== null) {
      lines.push('复盘均分：识骗率 ' + Math.round(ds.breakRate * 100) + '%、信任率 ' + Math.round(ds.trustRate * 100) + '%、平均误判 ' + ds.misjudge.toFixed(1) + ' 次（' + ds.n + ' 天）');
    }
    lines.push('各模块结局分布：');
    SCAM_MODS.forEach(function (id) {
      var n = 0, byGrade = {};
      all.forEach(function (v) {
        (v.runs || []).forEach(function (r) {
          if (r.mod !== id) return;
          n++;
          byGrade[r.grade || '?'] = (byGrade[r.grade || '?'] || 0) + 1;
        });
      });
      var g = Object.keys(byGrade).sort().map(function (k) { return k + ' ' + byGrade[k]; }).join('、');
      lines.push('  ' + modName(id) + '：' + n + ' 局' + (g ? '（' + g + '）' : ''));
    });
    var w = {};
    STAGE_KEYS.forEach(function (s) { w[s] = 0; });
    all.forEach(function (v) {
      (v.runs || []).forEach(function (r) {
        var s = STAGE_KEYS.indexOf(r.leftAt) >= 0 ? r.leftAt : 'lure';
        w[s]++;
      });
    });
    lines.push('全场在哪一步醒来：' + STAGE_KEYS.map(function (s) { return RJ.STAGE_LABEL[s] + ' ' + w[s]; }).join(' ｜ '));
    var tr = timidRatio();
    if (tr.rate !== null) lines.push('「惊弓之鸟」占比：' + Math.round(tr.rate * 100) + '%（' + tr.n + '/' + tr.total + ' 天）');
    var rank = harvestRank(flattenRuns(all));
    if (rank.length) {
      lines.push('最多人被骗的那一步：' + rank.slice(0, 5).map(function (r) {
        return r.name + ' ' + (r.node || (r.hasNodes ? '（无收割节点）' : '（外部页面）')) + ' ×' + r.count;
      }).join(' ｜ '));
    }
    var habitTop = verifyHabits(flattenRuns(all)).list.slice().sort(function (a, b) { return b.n - a.n; })[0];
    if (habitTop) lines.push('最常走错的核实渠道：' + (VIA_LABEL[habitTop.via] || habitTop.via) + '（' + habitTop.n + ' 次）');
    lines.push('（所有数据均为模拟数据，仅保存在这台设备上）');
    return lines.join('\n');
  }

  function copyText(text) {
    var done = function () { RJ.toast('统计文字已复制'); };
    var fallback = function () {
      var ta = RJ.el('textarea', { style: { width: '100%', height: '180px' }, readonly: true, text: text });
      RJ.modal(RJ.el('div', {}, [RJ.el('p', { class: 'small', text: '浏览器不允许自动复制，长按下面的文字手动复制：' }), ta]), {
        buttons: [{ text: '知道了', cls: 'btn-primary' }]
      });
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
        return;
      }
    } catch (e) { }
    fallback();
  }

  function downloadJson(all) {
    var payload = {
      app: '入局 · 大学生反诈沉浸实验室',
      kind: 'kiosk-stats',
      date: dateStr(),
      exportedAt: new Date().toISOString(),
      visitors: all.length,
      sessions: all
    };
    var text = JSON.stringify(payload, null, 2);
    var name = '入局-展台统计-' + dateStr() + '.json';
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = RJ.el('a', { href: url, download: name });
      document.body.appendChild(a);
      a.click();
      later(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1500);
      RJ.toast('已开始下载 ' + name);
    } catch (e) {
      RJ.modal('<p>下载失败，可复制下面的 JSON：</p><textarea style="width:100%;height:160px" readonly>' + RJ.esc(text) + '</textarea>', {
        buttons: [{ text: '知道了', cls: 'btn-primary' }]
      });
    }
  }

  /* ================= 一页纸报告（40 §5.2，打印 / 离线） =================
   * 触发：展台页「导出统计 → 打印报告」→ 生成独立的 .print-report → window.print()。
   * 打印样式在 core/style.css 末尾的 @media print 里：只显示 .print-report，隐藏 #aside 与手机外壳等。
   * 报告里的每个数字都来自展台统计用过的同一批函数（all / aPre / aPost / aImp / dayStats / verifyHabits / harvestRank），不另编数据。 */

  function prTitle(text) {
    return RJ.el('h2', { style: { fontSize: '15px', margin: '16px 0 6px', borderLeft: '4px solid #2d6cdf', paddingLeft: '8px' }, text: text });
  }
  function prLine(k, v) {
    return RJ.el('div', { style: { display: 'flex', gap: '10px', fontSize: '13px', padding: '3px 0' } }, [
      RJ.el('span', { style: { width: '10em', flex: 'none', color: '#444' }, text: k }),
      RJ.el('b', { text: v })
    ]);
  }
  function prTable(headers, rows) {
    var thead = RJ.el('tr');
    headers.forEach(function (h) {
      thead.appendChild(RJ.el('th', { style: { textAlign: 'left', borderBottom: '2px solid #333', padding: '4px 6px' }, text: h }));
    });
    var tbody = RJ.el('tbody');
    rows.forEach(function (r) {
      var tr = RJ.el('tr');
      r.forEach(function (c) {
        tr.appendChild(RJ.el('td', { style: { borderBottom: '1px solid #ccc', padding: '4px 6px' }, text: c }));
      });
      tbody.appendChild(tr);
    });
    return RJ.el('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' } }, [thead, tbody]);
  }

  function buildPrintReport(all, aPre, aPost, aImp) {
    var flat = flattenRuns(all);
    var ds = dayStats();
    var hab = verifyHabits(flat);
    var topWrong = hab.list.slice().sort(function (a, b) { return b.n - a.n; })[0] || null;
    var tr = timidRatio();
    var rank = harvestRank(flat);
    function f1(v) { return (v === null || v === undefined || !isFinite(v)) ? '—' : v.toFixed(1); }

    var box = RJ.el('div', { class: 'print-report' });
    box.appendChild(RJ.el('h1', { style: { fontSize: '20px', margin: '0 0 6px' }, text: '入局 · 大学生反诈沉浸实验室 ｜ 展台统计报告' }));
    box.appendChild(RJ.el('p', { style: { fontSize: '12px', color: '#444', margin: '0 0 3px' }, text: '生成日期：' + dateStr() + '　｜　数据来源：这台演示机上的离线记录（已归档访客 + 当前访客）' }));
    box.appendChild(RJ.el('p', { style: { fontSize: '12px', color: '#444', margin: 0 }, text: '样本只代表本次宣传点，所有金额、人物、结局均为模拟数据。' }));

    box.appendChild(prTitle('一、参与与前后测'));
    box.appendChild(prLine('参与人数', String(all.length) + ' 人'));
    box.appendChild(prLine('前测均分', f1(aPre) + ' 分'));
    box.appendChild(prLine('后测均分', f1(aPost) + ' 分'));
    box.appendChild(prLine('平均提升', aImp === null || aImp === undefined ? '—' : ((aImp >= 0 ? '+' : '') + aImp.toFixed(1)) + ' 分'));
    if (ds.breakRate !== null) {
      box.appendChild(prLine('一天复盘均分', '识骗率 ' + Math.round(ds.breakRate * 100) + '% ｜ 信任率 ' + Math.round(ds.trustRate * 100) + '%'));
    }
    box.appendChild(prLine('「惊弓之鸟」占比', tr.rate === null ? '—' : (Math.round(tr.rate * 100) + '%（' + tr.n + '/' + tr.total + ' 天）')));

    box.appendChild(prTitle('二、各骗局识破率'));
    box.appendChild(prTable(['骗局模块', '局数', '识破（S/A）', '识破率'], SCAM_MODS.map(function (id) {
      var rs = flat.filter(function (r) { return r.mod === id; });
      var cracked = rs.filter(function (r) { return r.grade === 'S' || r.grade === 'A'; }).length;
      return [modName(id), String(rs.length), String(cracked), rs.length ? Math.round(cracked / rs.length * 100) + '%' : '—'];
    })));
    box.appendChild(RJ.el('p', { style: { fontSize: '11.5px', color: '#555', margin: '4px 0 0' }, text: '识破率 = 档位 S/A 的局数 ÷ 该模块总局数；「及时止损」（B）不计入识破。' }));

    box.appendChild(prTitle('三、最常走错的核实渠道'));
    if (!topWrong) {
      box.appendChild(RJ.el('p', { style: { fontSize: '13px', margin: 0 }, text: '还没有走错渠道的记录。' }));
    } else {
      box.appendChild(prLine('最多人走错', (VIA_LABEL[topWrong.via] || topWrong.via) + '（' + topWrong.n + ' 次）'));
      box.appendChild(prLine('走对 / 走错', hab.good + ' 次 / ' + hab.bad + ' 次'));
      box.appendChild(prLine('走错的代价', VIA_WHY[topWrong.via] || '这条渠道也是对方安排好的。'));
      if (hab.list.length > 1) {
        box.appendChild(RJ.el('p', { style: { fontSize: '12px', color: '#444', margin: '4px 0 0' },
          text: '其余走错渠道：' + hab.list.slice(1).map(function (w) { return (VIA_LABEL[w.via] || w.via) + '（' + w.n + ' 次）'; }).join('；') + '。' }));
      }
    }

    box.appendChild(prTitle('四、最多人被骗的那一步'));
    if (!rank.length) {
      box.appendChild(RJ.el('p', { style: { fontSize: '13px', margin: 0 }, text: '还没有人亏钱。' }));
    } else {
      rank.forEach(function (r, i) {
        box.appendChild(RJ.el('div', { style: { fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #bbb' } }, [
          RJ.el('div', {}, [RJ.el('b', { text: (i + 1) + '. ' + r.name + ' ｜ 节点 ' + (r.node || (r.hasNodes ? '（无收割节点）' : '（外部页面）')) + ' ｜ 被收割 ' + r.count + ' 次' })]),
          r.node ? RJ.el('div', { style: { color: '#444' }, text: '台词：' + (nodeLine(r.mod, r.node) || '（这个节点没有台词）') }) : null
        ]));
      });
    }
    box.appendChild(RJ.el('p', { style: { fontSize: '11.5px', color: '#555', margin: '6px 0 0' }, text: '口径：只统计亏过钱的局（损失 > 0）；取该局剧本里最后一个「收割 / 锁死」节点，就是他被收割的那一步。' }));

    box.appendChild(RJ.el('p', { style: { fontSize: '11px', color: '#555', marginTop: '18px', borderTop: '1px solid #999', paddingTop: '6px' }, text: RJ.COMPLIANCE }));
    return box;
  }

  function printReport(all, aPre, aPost, aImp) {
    var old = document.querySelector('.print-report');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var box;
    try {
      box = buildPrintReport(all, aPre, aPost, aImp);
    } catch (e) {
      RJ.toast('生成报告出错：' + (e && e.message));
      return;
    }
    document.body.appendChild(box);
    var off = function () {
      if (box.parentNode) box.parentNode.removeChild(box);
      window.removeEventListener('afterprint', off);
    };
    window.addEventListener('afterprint', off);
    later(off, 60000);     // 兜底：个别浏览器不触发 afterprint
    later(function () {
      try { window.print(); } catch (e) { RJ.toast('这台设备不支持打印，可以先用「复制统计文字」'); }
    }, 80);
    RJ.toast('已生成报告，正在调起打印…');
  }

  /* ================= 讲解（课堂模式入口） ================= */

  function renderGuide(host) {
    var steps = [
      ['1', '锁屏：「你捡到了一部手机」', '30 秒',
        '先别解释。让全班看锁屏上落下来的通知——这就是那部手机今天收到的消息里最早的几条。问一句：哪一条你会点？',
        [['打开锁屏', '#/lock']]],
      ['2', '全班一起玩：5 分钟快速局', '3 分钟',
        '让全班拿出手机打开站点，选「5 分钟快速局」（默认就是它：从 11 条骗局和 9 条真消息里抽 3 + 3，真消息也会主动找上门；实测一位普通读者走完约 3–4 分钟，最慢 5 分钟）。投屏上演示一位同学的手机，他点哪一条、怎么核实，你都不提示。',
        [['打开收件箱（投屏演示）', '#/home']]],
      ['3', '复盘：两个分数', '1 分钟',
        '投影那位同学的复盘页：识骗率（挡住了几个骗局）和信任率（有没有把真消息当成骗子）。两个分数一起看，才叫真的醒着；只看一个，就会变成「惊弓之鸟」。',
        [['回到收件箱（玩完点「今天的复盘」）', '#/home']]],
      ['4', '翻面：看骗子那一面', '1 分钟',
        '挑他刚玩过的那一个骗局翻开：把聊天原样回放，一句一句念骗子那边的批注，看他本可以在哪一步停下来。',
        [['打开 shuadan 翻面页', '#/m/shuadan/reveal']]],
      ['5', '真的消息也难判断', '1 分钟',
        '96110 来电、奖学金签字：真消息和骗局用的是同一个收件箱。把真消息举报掉，钱没丢，奖学金和朋友却没了——多疑也有代价。',
        [['打开 r1（96110 来电）', '#/m/r1']]],
      ['6', 'bangxin 资金流：「你赚的手续费是谁的钱」', '1.5 分钟',
        '你是帮凶的那一局：卡里流过的每一笔，备注栏写着别的模块受害者的钱。你赚的手续费，就是别人的损失。',
        [['打开 bangxin', '#/m/bangxin']]],
      ['7', '数据说话：骗子经济学 + 展台统计', '2.5 分钟',
        '先算一遍「为什么 99% 的人识破了，骗子还在赚钱」；再打开展台统计，当场看这台演示机刚跑出来的数：参与人数、前后测提升、各骗局识破率、最多人被骗的那一步。',
        [['打开 骗子经济学', '#/center/econ'], ['打开 展台统计', '#/center/kiosk']]]
    ];
    host.appendChild(secTitle('讲解脚本 · 约 12 分钟'));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '课堂模式（?class=1 或按 C 键）下，这里会出现在「关于」页的入口。' }));
    steps.forEach(function (s) {
      host.appendChild(RJ.el('div', { class: 'card' }, [
        RJ.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } }, [
          RJ.el('div', { style: { fontWeight: 700, fontSize: '15px' }, text: s[0] + '. ' + s[1] }),
          RJ.el('span', { class: 'chip', text: s[2] })
        ]),
        RJ.el('p', { class: 'small', style: { margin: '8px 0 10px', color: '#cdd7e5' }, text: s[3] }),
        RJ.el('div', { class: 'btns' }, s[4].map(function (b) {
          return btn(b[0], 'btn-primary', function () { RJ.go(b[1], true); });
        }))
      ]));
    });
  }

  /* ================= 关于 ================= */

  function renderAbout(host) {
    host.appendChild(secTitle('关于本项目'));
    host.appendChild(RJ.el('div', { class: 'card' }, [
      RJ.el('p', { style: { margin: 0, fontSize: '15px', lineHeight: 1.8 }, text: T.oneLine })
    ]));

    if (RJ.classroom) {
      host.appendChild(RJ.el('div', { class: 'btns' }, [
        btn('🎤 讲解脚本（7 步 · 约 10 分钟）', 'btn-primary', function () { RJ.go('#/center/guide', true); })
      ]));
    }

    host.appendChild(secTitle('五步剧本模型图 · ' + SCAM_MODS.length + ' 个模块，同一套流水线'));
    host.appendChild(modelDiagram());
    host.appendChild(RJ.el('p', { class: 'muted small', text: '每个模块都能在五个阶段里找到它对应的一句话。你在任何一个模块里的选择，都落在这五格里。' }));
    host.appendChild(RJ.el('div', { class: 'btns' }, [
      btn('🔄 逐句拆解：骗子的流水线', 'btn-ghost', function () { RJ.go('#/m/center/reveal', true); })
    ]));

    host.appendChild(secTitle('设计说明'));
    host.appendChild(RJ.el('div', { class: 'card' }, [
      RJ.el('p', { style: { margin: '0 0 8px', fontWeight: 700 }, text: '三层：沉浸 → 翻面 → 数据' }),
      RJ.el('p', { class: 'small', style: { margin: '0 0 6px', color: '#cdd7e5' }, text: '① 沉浸：第一人称拿起一部手机，' + SCAM_MODS.length + ' 条骗局和 9 条真消息落在同一个收件箱里，看起来没有区别。选「5 分钟快速局」抽 3 个骗局 + 3 条真消息，也可以玩完整的一天；点进去、聊下去、做选择，像真的在被人骗。' }),
      RJ.el('p', { class: 'small', style: { margin: '0 0 6px', color: '#cdd7e5' }, text: '② 翻面：每一局结束都能翻到骗子那一面，逐句回放并标出你本可以识破的红旗点——把“我被骗了”变成“他刚才是怎么骗我的”。' }),
      RJ.el('p', { class: 'small', style: { margin: 0, color: '#cdd7e5' }, text: '③ 数据：把每一局的中招阶段、心理弱点、虚拟损失汇总成个人易感画像、前测/后测对比与全场展台统计——反诈宣传最缺的就是效果评估。' })
    ]));

    host.appendChild(secTitle('内容依据 · 来源表'));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '站内所有案例、数字、法条都出自下面这些来源；点链接可自行核对（本站自身不发任何请求）。' }));
    host.appendChild(RJ.sourceBlock(RJ.SOURCES.map(function (s) { return s.id; }), []));

    host.appendChild(secTitle('法条'));
    host.appendChild(RJ.sourceBlock([], RJ.LAWS.filter(function (l) { return l.id !== 'L8'; }).map(function (l) { return l.id; })));

    host.appendChild(secTitle('数据声明'));
    host.appendChild(RJ.el('div', { class: 'card' }, [
      RJ.el('p', { style: { margin: 0, fontSize: '15px', lineHeight: 1.8 }, text: T.dataNote })
    ]));

    host.appendChild(secTitle('团队信息'));
    host.appendChild(RJ.el('div', { class: 'card' }, [
      RJ.el('p', { class: 'small', style: { margin: '0 0 6px' }, text: '课程：' + TEAM.course }),
      RJ.el('p', { class: 'small', style: { margin: '0 0 6px' }, text: '组员：' + TEAM.members }),
      RJ.el('p', { class: 'small', style: { margin: 0 }, text: '指导老师：' + TEAM.teacher })
    ]));

    host.appendChild(secTitle('版本'));
    var ver = RJ.el('button', {
      class: 'btn btn-ghost',
      text: '版本 v' + (RJ.VERSION || '1.0.0'),
      onclick: function () {
        verClicks++;
        if (verClicks >= 5) {
          verClicks = 0;
          if (RJ.kiosk) {
            RJ.setKiosk(false);
            RJ.toast('已退出展台模式');
            RJ.go('#/center/report', true);
            return;
          }
          RJ.setKiosk(true);
          RJ.toast('已进入展台模式');
          RJ.go('#/center/kiosk', true);
          return;
        }
        RJ.toast('还差 ' + (5 - verClicks) + ' 次' + (RJ.kiosk ? '退出' : '进入') + '展台模式');
      }
    });
    host.appendChild(RJ.el('div', { class: 'btns' }, [ver, btn('展台模式（宣传点用）', 'btn-ghost', function () { RJ.go('#/center/kiosk', true); })]));
    host.appendChild(RJ.el('p', { class: 'muted small', text: '连点版本号 5 次可进入展台模式；也可在主屏地址后加 ?kiosk=1。' }));
  }

  /* ================= 五步剧本模型图（关于页 + 翻面页共用） ================= */

  function modelDiagram() {
    var wrap = RJ.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
    STAGE_KEYS.forEach(function (s, i) {
      var box = RJ.el('div', { style: { border: '1px solid #22314a', borderRadius: '12px', overflow: 'hidden', background: '#16233a' } });
      box.appendChild(RJ.el('div', {
        style: { background: STAGE_COLOR[s], color: STAGE_INK[s] || '#fff', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }
      }, [
        RJ.el('span', { style: { fontWeight: 700 }, text: (i + 1) + ' · ' + RJ.STAGE_LABEL[s] + '（' + s + '）' }),
        RJ.el('span', { style: { fontSize: '11.5px', opacity: .9 }, text: RJ.STAGE_DESC[s] })
      ]));
      var list = RJ.el('div', { style: { padding: '8px 10px' } });
      MODEL.forEach(function (m) {
        var d = modDef(m[1]);
        list.appendChild(RJ.el('div', { style: { display: 'flex', gap: '8px', fontSize: '12.5px', padding: '3px 0', borderBottom: '1px dashed #1d2a41' } }, [
          RJ.el('span', { style: { width: '76px', flex: 'none', color: '#93a3b8' }, text: (d && d.title) || m[0] }),
          RJ.el('span', { style: { color: '#cdd7e5' }, text: '「' + m[2][s] + '」' })
        ]));
      });
      box.appendChild(list);
      wrap.appendChild(box);
    });
    return wrap;
  }

})();
