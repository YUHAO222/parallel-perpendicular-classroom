/* 28 页节点：顺序即 PPT 页序。type: cover | clip | card | activity | quiz | examples
   geom: cubeSkew / cubeSame / angle90 / perp  （实时几何层，视频结束后继续旋转） */
window.NODES = [
  { id: "p01", page: 1, seg: 1, title: "平行与垂直 · 西游数学历险记", type: "cover", video: "", say: ["上课", "进入课堂"] },
  { id: "p02", page: 2, seg: 1, title: "悟空出场", type: "clip", video: "videos/p02_wk_intro.mp4", say: ["悟空你先来", "孙悟空出场"] },
  { id: "p03", page: 3, seg: 1, title: "八戒出场", type: "clip", video: "videos/p03_bj_intro.mp4", say: ["八戒你也介绍", "猪八戒出场"] },
  { id: "p04", page: 4, seg: 1, title: "金箍棒向两端延伸", type: "clip", video: "videos/p04_wk_line_extend.mp4", say: ["展示金箍棒", "金箍棒长长长"] },
  { id: "p05", page: 5, seg: 1, title: "直线特点", type: "card", video: "", say: ["直线的特点", "无限延伸"] },
  { id: "p06", page: 6, seg: 2, title: "两根金箍棒会怎样", type: "clip", video: "videos/p06_wk_question.mp4", say: ["悟空提问", "两根金箍棒"] },
  { id: "p07", page: 7, seg: 2, title: "画两条直线", type: "activity", video: "videos/p07_fix.mp4", say: ["动手画一画", "用直尺画"], timer: 120 },
  { id: "p08", page: 8, seg: 2, title: "学生作品展示", type: "activity", video: "", say: ["看看作品", "学生作品展示"], slot: true },
  { id: "p09", page: 9, seg: 2, title: "①—⑧ 八组图形分类", type: "quiz", video: "videos/A_ask_plate.mp4", quiz: "q09", say: ["分一分", "八组图形分类"] },
  { id: "p10", page: 10, seg: 2, title: "分类结果", type: "card", video: "", say: ["看结果", "哪些相交哪些不相交"], steps: 23 },
  { id: "p12", page: 12, seg: 3, title: "平行线的定义", type: "card", video: "videos/3-3_wk_probe_premise.mp4", say: ["什么是平行线", "平行线的定义"] },
  { id: "p13", page: 13, seg: 3, title: "立方体：两个不同的面", type: "clip", video: "videos/p13_v2.mp4", geom: "cubeSkew", say: ["看立方体", "两个不同的面"] },
  { id: "p14", page: 14, seg: 3, title: "立方体：同一个面", type: "clip", video: "videos/p14_v2.mp4", geom: "cubeSame", say: ["同一个面", "这才是平行线"] },
  { id: "p17", page: 17, seg: 3, title: "本段知识点", type: "card", video: "", say: ["本段知识点", "梳理一下"] },
  { id: "p18", page: 18, seg: 4, title: "旋转到 90° 成直角", type: "clip", video: "videos/p18_geom.mp4", say: ["转成直角", "演示垂直"] },
  { id: "p19", page: 19, seg: 4, title: "互相垂直的定义", type: "card", video: "videos/p19_plate.mp4", geom: "perp", say: ["什么是垂直", "垂线垂足"] },
  { id: "p20", page: 20, seg: 4, title: "转一转，还是垂直吗", type: "clip", video: "videos/p20_wk_directions.mp4", say: ["转一转还是垂直吗", "摆放方向"] },
  { id: "p21", page: 21, seg: 4, title: "小结：垂直与方向无关", type: "card", video: "", say: ["垂直与方向无关", "垂直小结"] },
  { id: "p22", page: 22, seg: 5, title: "第一题：平行还是垂直", type: "quiz", video: "videos/p22_plate.mp4", quiz: "q22", say: ["第一题", "基础题"] },
  { id: "p23", page: 23, seg: 5, title: "第一题的答案", type: "activity", video: "videos/p23_fix.mp4", say: ["第一题答案", "点评一下"], slot: true },
  { id: "p24", page: 24, seg: 5, title: "第二题：判断对错", type: "quiz", video: "videos/p24_plate.mp4", quiz: "q24", say: ["第二题", "判断题"] },
  { id: "p25", page: 25, seg: 5, title: "第三题：折纸游戏", type: "activity", video: "", say: ["第三题", "折纸游戏"] },
  { id: "p26", page: 26, seg: 6, title: "知识导图", type: "card", cardEarly: true, video: "videos/6-1_wk_summary.mp4", say: ["总结", "知识梳理"] },
  { id: "p27", page: 27, seg: 6, title: "生活中的平行与垂直", type: "examples", video: "videos/5-12_wk_life_examples.mp4", say: ["生活中的例子", "举例子"] },
  { id: "p28", page: 28, seg: 6, title: "老师寄语", type: "card", video: "", say: ["老师寄语", "下课"] }
];

window.SEG_NAME = { 1: "环节一 · 情境导入", 2: "环节二 · 相交与不相交", 3: "环节三 · 平行", 4: "环节四 · 垂直", 5: "环节五 · 分层练习", 6: "环节六 · 总结" };

/* 答题分支（八戒） */
window.QUIZ = {
  q09: {
    mode: "sort",
    title: "①—⑧ 分类",
    prompt: "按「相交 / 不相交」把八组直线分两类",
    items: [
      { k: 1, ans: "no" }, { k: 2, ans: "yes" }, { k: 3, ans: "no" }, { k: 4, ans: "yes" },
      { k: 5, ans: "yes" }, { k: 6, ans: "no" }, { k: 7, ans: "yes" }, { k: 8, ans: "yes" }
    ],
    right: "videos/B_yes_plate.mp4", wrong: "videos/C_no_plate.mp4",
    why: "相交：②④⑤⑦⑧；不相交：①③⑥。④⑦看着不相交，延长后会相交；⑧相交成直角，是垂直。"
  },
  q22: {
    mode: "choice",
    title: "第一题（基础层）",
    prompt: "判断每组两条直线的位置关系：括号里写「平行」或「垂直」；垂直的，在图上标出垂足",
    options: ["平行", "垂直", "都不是（延长后相交）"],
    items: [
      { k: 1, ans: "平行" }, { k: 2, ans: "垂直" }, { k: 3, ans: "都不是（延长后相交）" }, { k: 4, ans: "垂直" }
    ],
    right: "videos/B_yes_plate.mp4", wrong: "videos/C_no_plate.mp4",
    why: "第 3 组延长后才相交，不是平行；第 2、4 组相交成直角，要标出垂足。"
  },
  q24: {
    mode: "tf",
    title: "第二题（判断）",
    prompt: "判断下面说法是否正确：括号里写「对」或「错」，并说说理由",
    items: [
      { q: "不相交的两条直线叫平行线。", ans: "错", why: "少了「在同一平面内」。" },
      { q: "两条直线相交成直角，就说这两条直线互相垂直。", ans: "对", why: "这正是互相垂直的定义。" },
      { q: "两条直线相交，交点叫垂足。", ans: "错", why: "只有相交成直角，交点才叫垂足。" },
      { q: "在同一平面内，两条直线不平行就一定相交。", ans: "对", why: "同一平面内只有相交、平行两种位置关系。" }
    ],
    right: "videos/B_yes_plate.mp4", wrong: "videos/C_no_plate.mp4"
  }
};
