/* 入局 · 大学生反诈沉浸实验室 —— manifest.js
 * 模块清单。40 §4 追加四个新骗局（paotui / xinsheng / youxi / chujing）。
 * center 必须是最后一个（页面模块，依赖其他模块已注册）。
 */
RJ.MANIFEST = ['shuadan', 'wangdu', 'gouwu', 'jiaoyou', 'bangxin', 'xiaodai', 'huanlian',
  'paotui', 'xinsheng', 'youxi', 'chujing', 'center'];
RJ.MANIFEST.forEach(function (id) {
  document.write('<script src="' + RJ.BASE + 'modules/' + id + '.js"><\/script>');
});
