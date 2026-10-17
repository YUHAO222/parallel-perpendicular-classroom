/* =====================================================================
 * 2026-10 增补（依据《要求.docx》）
 *   A. 课件页映射：把 冯晴 老师课件《平行与垂直-晴》28 页挂到对应节点
 *   B. 改造节点：5-2b / 5-5 台词与课件页对齐
 *   C. 新增节点：4-2b 八戒说垂足 / 4-6 八戒总结垂直
 *   D. 答题双分支：P24 四道判断题「正确 / 错误」两种回复
 *   E. 3D 立方体工具联动
 * ===================================================================== */
(function(){
  var D = window.DIALOGUES, IT = D.items || [];
  function byId(id){ for (var i=0;i<IT.length;i++){ if (IT[i].id===id) return IT[i]; } return null; }
  function prependSlides(id, pages){
    var it = byId(id); if (!it) return;
    it.slides = (pages || []).concat(it.slides || []);
  }
  function insertAfter(afterId, item){
    if (byId(item.id)) return true;
    for (var i=0;i<IT.length;i++){ if (IT[i].id===afterId){ IT.splice(i+1,0,item); return true; } }
    return false;
  }

  /* ---------- A. 课件页映射（晴老师课件 cq01~cq28）---------- */
  var MAP = [
    ["1-1", ["deck/cq02.png"]],
    ["1-2", ["deck/cq03.png"]],
    ["1-3", ["deck/cq05.png"]],
    ["1-4", ["deck/cq06.png"]],
    ["2-1", ["deck/cq09.png"]],
    ["2-3", ["deck/cq10.png"]],
    ["2-4", ["deck/cq11.png"]],
    ["3-1", ["deck/cq12.png"]],
    ["3-2", ["deck/cq12.png"]],
    ["3-3", ["deck/cq15.png"]],
    ["3-4", ["deck/cq15.png"]],
    /* P17「相交的线」= 可点击互动页（单击显示锐角/钝角/直角+直角符号）；P18 = 垂直视频页 */
    ["4-1", ["deck/p17_angles.html", "deck/cq18.png"]],
    ["4-2", ["deck/cq19.png"]],
    ["4-2b", ["deck/cq19.png"]],
    ["4-3", ["deck/cq20.png"]],
    ["4-4", ["deck/cq19.png"]],
    ["4-5", ["deck/cq21.png"]],
    ["4-6", ["deck/cq21.png"]],
    ["5-1", ["deck/cq22.png"]],
    ["5-2a", ["deck/cq23.png"]],
    ["5-2b", ["deck/cq23.png"]],
    ["5-4", ["deck/cq24.png"]],
    ["5-5", ["deck/cq24.png"]],
    ["5-6", ["deck/cq24.png"]],
    ["6-1a", ["deck/cq26.png"]],
    ["6-1b", ["deck/cq26.png"]],
    ["6-2a", ["deck/cq28.png"]],
    ["6-2b", ["deck/cq28.png"]],
    ["6-3", ["deck/cq28.png"]],
    ["6-4", ["deck/cq28.png"]]
  ];
  MAP.forEach(function(p){ prependSlides(p[0], p[1]); });

  /* ---------- B. 改造节点：台词与课件页对齐 ---------- */
  var n;
  /* 《要求》第 8 条：老师说「猪八戒，请你来点评一下」就要点评两份答案（先第一份） */
  n = byId("5-2a");
  if (n) ["猪八戒请你来点评一下", "请你来点评一下", "来点评一下", "点评一下",
          "点评这两份答案", "请你点评这两份答案", "猪八戒请你点评"].forEach(function(k){
    if (n.say.indexOf(k) < 0) n.say.push(k);
  });
  n = byId("5-2b"); if (n) ["第二份答案", "点评第二份答案"].forEach(function(k){
    if (n.say.indexOf(k) < 0) n.say.push(k);
  });
  n = byId("5-2b"); if (n) n.subtitle = "第二份答案中，这一组直线其实是相交的，因为延长后会相交。同学们，你们说是不是？";
  n = byId("5-5");  if (n) n.subtitle = "这道题，我找同学来回答！";
  ["5-4","5-5"].forEach(function(id){ var q=byId(id); if(q){ q.quiz = true; } });

  /* ---------- C. 新增节点（插在 4-2 与 4-5 之后）---------- */
  insertAfter("4-2", {
    id:"4-2b", seg:4, ch:"bj", video:"videos/4-2b_bj_footpoint.mp4",
    say:["猪八戒还有什么值得注意的吗","还有什么值得注意的吗","八戒还有什么值得注意的","八戒说说垂足","交点叫什么名字","八戒说垂足"],
    subtitle:"看！这两条直线的交点叫做垂足！",
    action:"八戒抬手、跳起指着交点", slides:["deck/cq19.png"] });
  insertAfter("4-5", {
    id:"4-6", seg:4, ch:"bj", video:"videos/4-6_bj_summary.mp4",
    say:["猪八戒请你总结","八戒请你总结","请八戒总结","八戒总结垂直","总结垂直","总结一下垂直"],
    subtitle:"不管怎么摆放，只要相交成直角，就是互相垂直！",
    action:"八戒身体运动后摊手总结", slides:["deck/cq21.png"] });

  /* ---------- D. 答题双分支（P24 四道判断题）---------- */
  D.answers = [
    { id:"Q1", label:"第一题",
      right:[ {video:"videos/5-1a_bj_help.mp4",  ch:"bj", subtitle:"八戒，你来帮帮他！"},
              {video:"videos/5-1b_bj_fix.mp4",   ch:"bj", subtitle:"少了“同一平面内”！不在同一个面上，不相交也不能叫平行线。"},
              {video:"videos/5-3_wk_agree.mp4",  ch:"wk", subtitle:"没错，八戒说得对！"} ],
      wrong:[ {video:"videos/5-1c_bj_wrong.mp4", ch:"bj", subtitle:"说得好！少了“同一平面内”，这两条直线就不一定是平行线。"} ] },
    { id:"Q2", label:"第二题",
      right:[ {video:"videos/5-4a_bj_q2_right.mp4", ch:"bj", subtitle:"是的，这道题就是正确的。"} ],
      wrong:[ {video:"videos/5-4b_bj_q2_wrong.mp4", ch:"bj", subtitle:"再仔细看看呢。"} ] },
    { id:"Q3", label:"第三题",
      right:[ {video:"videos/5-6a_bj_q3_right.mp4", ch:"bj", subtitle:"哎，你想想是不是，只有两条直线相交成直角时，交点才叫垂足。"} ],
      wrong:[ {video:"videos/5-6b_bj_q3_wrong.mp4", ch:"bj", subtitle:"只有相交成直角时，交点才叫垂足。"} ],
      fb:   [ {video:"videos/5-6c_bj_q3_fb.mp4",    ch:"bj", subtitle:"对喽！一般的相交，交点不叫垂足。"} ] },
    { id:"Q4", label:"第四题",
      right:[ {video:"videos/5-8a_bj_q4_right.mp4", ch:"bj", subtitle:"对，这道题就是正确的。"} ],
      wrong:[ {video:"videos/5-8b_bj_q4_wrong.mp4", ch:"bj", subtitle:"你觉得还有第三种情况吗？"} ] }
  ];

  /* ---------- E. 3D 立方体工具：讲到「同一平面」自动联动打开 ---------- */
  ["3-1","3-2"].forEach(function(id){ var it=byId(id); if(it) it.tool = "cube"; });
})();
