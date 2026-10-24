/* B 样式内容卡：底部三分横卡（半透明、金色标题带、编号圆点）。
   blocks: {n:"1", t:"文字", step:1}  step 省略=一开始就显示
   wide:true 表示占满整行（定义/长句） */
window.CARDS = {
  p01: {
    title: "平行与垂直 · 西游数学历险记", tag: "四年级上册 · 第五单元", steps: 0,
    blocks: [
      { n: "师", t: "人教版四年级上册 第五单元", step: 0 },
      { n: "课", t: "冯晴 · 黄骅镇常庄联校", step: 0 },
      { n: "▶", t: "点击画面或按空格进入课堂", step: 0 }
    ],
    foot: "点击进入"
  },
  p05: {
    hero: true, center: true, title: "直线的特点", tag: "环节一 · 认识直线", steps: 2,
    blocks: [
      { n: "1", t: "可以向<b>两端</b>无限延伸", step: 1, wide: true },
      { n: "2", t: "没有端点", step: 2, wide: true }
    ],
    foot: "点击逐条揭示"
  },
  p07: {
    title: "画一画：两条直线", tag: "动手操作", steps: 2, timer: 120,
    blocks: [
      { n: "1", t: "用直尺在纸上画两条直线", step: 1 },
      { n: "2", t: "计时 2 分钟", step: 2 },
      { n: "?", t: "画完和同桌说一说：这两条直线是怎样的位置关系？", step: 0, wide: true }
    ],
    foot: "点击开始 2 分钟计时"
  },
  p08: {
    title: "学生作品展示", tag: "投屏", steps: 0, slot: true,
    blocks: [
      { n: "1", t: "把学生的作品拍照拖到这里（或直接投影）", step: 0, wide: true },
      { n: "?", t: "这些作品里，两条直线的位置关系一样吗？", step: 0, wide: true }
    ],
    foot: "拖入图片 / 点击继续"
  },
  p10: {
    title: "分一分：相交 / 不相交", tag: "23 步揭示", steps: 23,
    blocks: [
      { n: "交", t: "相交：②④⑤⑦⑧", step: 1 },
      { n: "不", t: "不相交：①③⑥", step: 2 },
      { n: "!", t: "④⑦ 看着不相交，延长后才相交；⑧ 相交成直角（垂直）", step: 3, wide: true },
      { n: "O", t: "两条直线相交的点叫交点；垂直时的交点叫垂足", step: 4, wide: true },
      { n: "∥", t: "①③⑥ 延长后仍不相交 → 平行线；④⑦ 延长后相交，不是平行", step: 4, wide: true }
    ],
    foot: "点击逐条揭示（相交 → 不相交 → 易错点）"
  },
  p11: {
    title: "在同一平面内延长后仍不相交", tag: "环节三", steps: 4,
    blocks: [
      { n: "1", t: "看着不相交，延长后可能相交（如 ④⑦）", step: 1 },
      { n: "2", t: "延长后仍不相交 → 平行", step: 2 },
      { n: "3", t: "前提：必须在同一个平面内", step: 3 },
      { n: "4", t: "所以判断平行要「先看同一平面，再看延长」", step: 4, wide: true }
    ],
    foot: "点击逐条揭示"
  },
  p12: {
    hero: true, title: "平行线", tag: "定义", steps: 4,
    blocks: [
      { n: "", t: "在同一个平面内不相交的两条直线叫做平行线，", step: 1, wide: true },
      { n: "", t: "也可以说这两条直线互相平行。", step: 1, wide: true },
      { n: "1", t: "关键词：同一平面内", step: 2 },
      { n: "2", t: "关键词：不相交（延长后也不相交）", step: 3 },
      { n: "3", t: "关键词：两条直线之间", step: 4 },
      { n: "ab", t: "直线 a 与直线 b 互相平行", step: 4, wide: true },
      { n: "∥", t: "记作：a∥b，b∥a", step: 4, wide: true },
      { n: "读", t: "读作：a 平行于 b，b 平行于 a", step: 4, wide: true }
    ],
    foot: "点击逐条揭示"
  },
  p15: {
    hero: true, title: "平行线必须是在同一个平面内、不相交的两条直线", tag: "小结", steps: 2,
    blocks: [
      { n: "1", t: "在同一个平面内 —— 少了这句就不严谨", step: 1 },
      { n: "2", t: "不相交 —— 延长以后也不相交", step: 2 }
    ],
    foot: "点击继续"
  },
  p16: {
    hero: true,
    title: "平行线的记法", tag: "记作 b∥a", steps: 11,
    blocks: [
      { n: "∥", t: "b∥a　读作：b 平行于 a", step: 1, wide: true },
      { n: "1", t: "两条直线互相平行，记作 a∥b 或 b∥a", step: 2 },
      { n: "2", t: "写之前先想「在同一平面内」", step: 3 }
    ],
    foot: "点击逐条揭示"
  },
  p15: {
    title: "判断平行的第一个前提", tag: "小结 · 八戒提醒", steps: 3,
    blocks: [
      { n: "1", t: "说平行，先想<b>在同一个平面内</b>——这是前提，不能漏", step: 1, wide: true },
      { n: "2", t: "只说「不相交」不够；不在同一平面内，两条直线不相交也不是平行线", step: 2, wide: true },
      { n: "3", t: "平行是<b>两条直线之间</b>的关系，不能说一条直线「互相平行」", step: 3, wide: true }
    ],
    foot: "点击逐条揭示"
  },
  p17: {
    title: "本段知识点", tag: "环节三", steps: 3,
    blocks: [
      { n: "1", t: "不相交 → 互相平行（记作 a∥b）", step: 1 },
      { n: "2", t: "判断平行：先看同一平面内，再看延长后是否相交", step: 2 },
      { n: "3", t: "平行是「两条直线之间」的关系", step: 3 }
    ],
    foot: "点击继续"
  },
  p19: {
    hero: true, title: "互相垂直", tag: "定义", steps: 13,
    blocks: [
      { n: "", t: "两条直线相交成直角，", step: 1, wide: true },
      { n: "", t: "就说这两条直线互相垂直。", step: 1, wide: true },
      { n: "1", t: "其中一条直线叫做另一条直线的垂线", step: 2 },
      { n: "2", t: "记作 a⊥b，读作 a 垂直于 b", step: 3 },
      { n: "3", t: "交点叫做垂足", step: 4 }
    ],
    foot: "点击逐条揭示"
  },
  p21: {
    hero: true, title: "不管怎么摆放，只要相交成直角，就是互相垂直", tag: "小结", steps: 2,
    blocks: [
      { n: "1", t: "垂直与两条直线的摆放方向无关", step: 1 },
      { n: "2", t: "只有相交成直角时，交点才叫垂足", step: 2 }
    ],
    foot: "点击继续"
  },
  p23: {
    title: "第一题的答案", tag: "投屏", steps: 0, slot: true,
    blocks: [
      { n: "1", t: "① 平行　② 垂直　③ 相交（延长后）　④ 垂直", step: 0, wide: true },
      { n: "!", t: "易错：第 3 组延长后会相交，不是平行", step: 0, wide: true }
    ],
    foot: "点击继续"
  },
  p26: {
    hero: true, center: true, title: "同一平面内两条直线的位置关系", tag: "总结", steps: 0,
    blocks: [
      { n: "", t: "<b>1 不相交：互相平行</b>", step: 0, wide: true },
      { n: "", t: "定义：在同一个平面内不相交的两条直线叫做平行线，", step: 0, wide: true },
      { n: "", t: "也可以说这两条直线互相平行。", step: 0, wide: true },
      { n: "", t: "<b>2 相交</b>", step: 0, wide: true },
      { n: "", t: "一般相交（夹角不是直角）", step: 0, wide: true, sub: true },
      { n: "", t: "特殊情况：垂直 —— 垂足", step: 0, wide: true, sub: true }
    ],
    foot: "点击继续"
  },
  p27: {
    title: "生活中的平行与垂直", tag: "举例", steps: 19,
    blocks: [
      { n: "∥", t: "平行：黑板边框、课桌对边、铁轨、斑马线、书本对边", step: 1, wide: true },
      { n: "⊥", t: "垂直：门窗框横竖框、日光灯管与墙面、十字路口", step: 2, wide: true },
      { n: "?", t: "找一找：教室里哪里有互相垂直的两条线？交点就是垂足。", step: 3, wide: true }
    ],
    foot: "点击逐条揭示"
  },
  p28: {
    hero: true, center: true, big: true, ask: true, title: "课堂助教", tag: "课前课后 · 随时问", steps: 1,
    blocks: [
      { t: "课前课后有问题，就问<b>猪八戒助教</b>", step: 0, wide: true },
      { t: "什么是垂足？不相交一定平行吗？打开就能问。", step: 0, wide: true }
    ],
    cta: { label: "打开助教大页 ▶", href: "assistant.html" },
    foot: "也可以直接对课堂说：「八戒，什么是垂足？」"
  }
};
