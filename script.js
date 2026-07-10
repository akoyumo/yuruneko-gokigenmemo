(function(){
"use strict";

var KEY = "yuruneko_gokigen_memo_v1";
var editingDate = null;
var detailDate = null;

var quotes = [
  "正解より、観察。今日もそれで十分🩵",
  "数字は結果。昨日の暮らしを、ゆっくり読もう🩵",
  "変わらない日も、ちゃんとおたよりです🩵",
  "一日ぶんの数字で、全部を決めなくていい🩵",
  "体は毎日ちがう。だから今日も面白い🩵",
  "わからないまま観察を続けても大丈夫🩵",
  "昨日の自分は、今日の敵じゃない🩵",
  "理由の糸は、あとから見つかることもある🩵",
  "増えた数字より、続けていることのほうが大きい🩵",
  "今日も、体の声をひとつ拾えたら十分🩵",
  "焦らなくて大丈夫。あこちゃんのペースでいこう🩵"
];

function byId(id){ return document.getElementById(id); }

function todayString(){
  var d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
}

function hashText(s){
  var h = 0;
  s = String(s || "");
  for(var i=0;i<s.length;i++){
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getEntries(){
  var a;
  try{
    a = JSON.parse(localStorage.getItem(KEY) || "[]");
  }catch(e){
    a = [];
  }
  return a.sort(function(x,y){ return x.date.localeCompare(y.date); });
}

function saveEntries(a){
  a.sort(function(x,y){ return x.date.localeCompare(y.date); });
  localStorage.setItem(KEY, JSON.stringify(a));
}

function showView(id){
  var views = document.querySelectorAll(".view");
  for(var i=0;i<views.length;i++){
    views[i].classList.toggle("active", views[i].id === id);
  }

  var navs = document.querySelectorAll(".navButton");
  for(var j=0;j<navs.length;j++){
    navs[j].classList.toggle("active", navs[j].getAttribute("data-target") === id);
  }

  if(id === "diaryView") renderDiary();
  window.scrollTo(0,0);
}

function previousEntry(entry){
  var a = getEntries();
  var p = null;
  for(var i=0;i<a.length;i++){
    if(a[i].date < entry.date) p = a[i];
  }
  return p;
}

function change(entry){
  var p = previousEntry(entry);
  return p ? Number(entry.weight) - Number(p.weight) : null;
}

function changeText(d){
  if(d === null) return "最初の記録";
  if(Math.abs(d) < 0.05) return "昨日とほぼ同じ";
  return d > 0 ? "昨日より +" + d.toFixed(1) + "kg" : "昨日より " + d.toFixed(1) + "kg";
}

function setChoice(group,value){
  var buttons = document.querySelectorAll('.choices[data-group="'+group+'"] button');
  for(var i=0;i<buttons.length;i++){
    buttons[i].classList.toggle("selected", buttons[i].getAttribute("data-value") === value);
  }
}

function getChoice(group){
  var b = document.querySelector('.choices[data-group="'+group+'"] button.selected');
  return b ? b.getAttribute("data-value") : "";
}

function defaultForm(){
  editingDate = null;
  byId("dateInput").value = todayString();
  byId("weightInput").value = "";
  byId("sleepInput").value = "";

  setChoice("body","普通");
  setChoice("stomach","普通");
  setChoice("belly","なし");
  setChoice("legs","普通");
  setChoice("bowel","普通");

  var checks = document.querySelectorAll(".eventCheck");
  for(var i=0;i<checks.length;i++) checks[i].checked = false;

  byId("stepsInput").value = "";
  byId("eatingOutInput").checked = false;
  byId("snackInput").checked = false;
  byId("memoInput").value = "";
}

function readForm(){
  var checked = document.querySelectorAll(".eventCheck:checked");
  var events = [];
  for(var i=0;i<checked.length;i++) events.push(checked[i].value);

  return {
    date: byId("dateInput").value,
    weight: Number(byId("weightInput").value),
    sleep: Number(byId("sleepInput").value),
    body: getChoice("body"),
    stomach: getChoice("stomach"),
    belly: getChoice("belly"),
    legs: getChoice("legs"),
    bowel: getChoice("bowel"),
    events: events,
    steps: byId("stepsInput").value ? Number(byId("stepsInput").value) : null,
    eatingOut: byId("eatingOutInput").checked,
    extraSnack: byId("snackInput").checked,
    memo: byId("memoInput").value.trim()
  };
}

function rareNya(date){
  return hashText(date + ":nya") % 18 === 0;
}

function messageFor(e){
  var d = change(e);
  var up = d !== null && d >= 0.3;
  var down = d !== null && d <= -0.3;
  var ev = e.events || [];
  var ending = rareNya(e.date) ? "にゃ🩵" : "よ🩵";

  if(
    ev.indexOf("耳鼻科") >= 0 &&
    (ev.indexOf("体育館8時間") >= 0 || ev.indexOf("体育館4.5時間") >= 0) &&
    up
  ){
    return "昨日は耳鼻科と体育館の合わせ技だったね。\n今日の重さは、忙しい一日の名残かもしれないよ🩵";
  }

  if(e.bowel === "なし" && e.belly === "ある"){
    return "昨日は便なしで、今朝はお腹もタプタプ気味。\n今日の数字には、お腹の在庫も少し入っていそう" + ending;
  }

  if(ev.indexOf("テニス") >= 0 && e.legs === "張ってる" && up){
    return "昨日はテニスで、今朝は脚も張っているね。\n今日の重さは、よく動いた日の続きかもしれないよ🩵";
  }

  if(e.bowel === "なし"){
    return "昨日は便なしの日だったね。\n今日の体重には、お腹の在庫も少し入っているかもしれない" + ending;
  }

  if(e.bowel === "バナナ" && down){
    return "🍌ありがとう。\n今日のおなかは、昨日よりごきげんそう🩵";
  }

  if(e.belly === "ある"){
    return "今朝はお腹にタプタプ感がある日。\n今日は水分をためこんでいるかもしれない" + ending;
  }

  if(e.legs === "張ってる"){
    return "今朝は脚が張っている日。\n体重だけじゃなく、ふくらはぎのおたよりも届いてるね🩵";
  }

  if(e.stomach === "重い"){
    return "今朝は胃が重めの日。\n今日の数字と一緒に、胃のおたよりも覚えておこう🩵";
  }

  if(ev.indexOf("テニス") >= 0 && up){
    return "昨日はテニスの日だったね。\n今日の重さは、その続きかもしれないよ🩵";
  }

  if(ev.indexOf("体育館8時間") >= 0 && up){
    return "昨日は体育館8時間の日だったね。\n今日の数字には、長い勤務の余韻も入っていそう🩵";
  }

  if(e.eatingOut && up){
    return "昨日は外食の日だったね。\n今日の数字は、楽しく食べた日の余韻かもしれないよ🩵";
  }

  if(e.extraSnack && up){
    return "昨日は、いつも以外の間食があった日。\n今日の数字は、少し様子見でよさそう🩵";
  }

  if(e.sleep <= 6 && up){
    return "昨日の睡眠は短めだったね。\n今日の重さと、眠りの短さを一緒に観察しておこう🩵";
  }

  if(e.steps !== null && e.steps >= 10000){
    return "昨日はよく歩いたね。\n数字より先に、体がその一日を覚えていそう🩵";
  }

  if(e.steps !== null && e.steps <= 1500){
    return "昨日は、ほとんど歩かなかった日だったね。\n動かなかった日も、ちゃんと観察の一日です🩵";
  }

  if(e.body === "軽い" && !up){
    return "今朝の体は軽めだったね。\n数字だけじゃなく、体の声もちゃんと届いてるよ🩵";
  }

  if(down){
    return "今日は少し軽めのおたより。\n昨日の暮らしが、静かに整っていたのかもしれないね🩵";
  }

  if(up){
    return "今日は少し重めのおたより。\n昨日の暮らしに、理由の糸があるかもしれないよ🩵";
  }

  return "今日の体重は大きく揺れていないね。\nいつものリズムが続いているおたよりかもしれないよ🩵";
}

function quoteFor(date){
  return quotes[hashText(date + ":quote") % quotes.length];
}

function average(a){
  if(!a.length) return null;
  var sum = 0;
  for(var i=0;i<a.length;i++) sum += a[i];
  return sum / a.length;
}

function trend(label,predicate){
  var a = getEntries();
  var diffs = [];
  for(var i=0;i<a.length;i++){
    if(!predicate(a[i])) continue;
    var d = change(a[i]);
    if(d !== null) diffs.push(d);
  }
  if(diffs.length < 3) return null;

  var av = average(diffs);
  if(Math.abs(av) < 0.15) return null;

  return {
    label: label,
    count: diffs.length,
    average: av
  };
}

function torisetsu(){
  var a = getEntries();

  if(a.length < 4){
    return ["まだ観察を始めたばかり。もう少しすると、あこちゃんらしい傾向が見えてきそう🩵"];
  }

  var candidates = [
    trend("テニスの日", function(e){ return (e.events||[]).indexOf("テニス") >= 0; }),
    trend("体育館8時間の日", function(e){ return (e.events||[]).indexOf("体育館8時間") >= 0; }),
    trend("体育館4.5時間の日", function(e){ return (e.events||[]).indexOf("体育館4.5時間") >= 0; }),
    trend("耳鼻科の日", function(e){ return (e.events||[]).indexOf("耳鼻科") >= 0; }),
    trend("Dダンスの日", function(e){ return (e.events||[]).indexOf("Dダンス") >= 0; }),
    trend("推しダンスの日", function(e){ return (e.events||[]).indexOf("推しダンス") >= 0; }),
    trend("家エアロの日", function(e){ return (e.events||[]).indexOf("家エアロ") >= 0; }),
    trend("ウォーキングの日", function(e){ return (e.events||[]).indexOf("ウォーキング") >= 0; }),
    trend("便なしの日", function(e){ return e.bowel === "なし"; }),
    trend("🍌の日", function(e){ return e.bowel === "バナナ"; }),
    trend("腸のタプタプ感がある日", function(e){ return e.belly === "ある"; }),
    trend("脚が張っている日", function(e){ return e.legs === "張ってる"; }),
    trend("胃が重い日", function(e){ return e.stomach === "重い"; }),
    trend("睡眠6時間以下の日", function(e){ return e.sleep <= 6; }),
    trend("外食の日", function(e){ return e.eatingOut; }),
    trend("いつも以外の間食の日", function(e){ return e.extraSnack; })
  ].filter(Boolean);

  candidates.sort(function(x,y){
    return Math.abs(y.average) - Math.abs(x.average);
  });

  if(!candidates.length){
    return [
      a.length < 8
        ? "少しずつ記録が育っているよ。つむぎ、まだ観察中です🩵"
        : "大きなクセはまだ出ていないみたい。揺れが少ないのも、ひとつのトリセツだね🩵"
    ];
  }

  return candidates.slice(0,3).map(function(x){
    var sign = x.average > 0 ? "+" : "";
    return x.label + "は、平均" + sign + x.average.toFixed(1) + "kgのおたより（" + x.count + "回）";
  });
}

function renderHome(){
  var a = getEntries();
  var e = a.length ? a[a.length-1] : null;
  var d, last30, av, last7, start, end;

  if(e){
    byId("homeWeight").textContent = Number(e.weight).toFixed(1);
    d = change(e);
    byId("homeDiff").textContent = changeText(d);
    byId("homeDiff").className = "diff " + (d > 0 ? "up" : d < 0 ? "down" : "");
    byId("tsumugiMessage").textContent = e.message || messageFor(e);
    byId("todayQuote").textContent = e.quote || quoteFor(e.date);
  }else{
    byId("homeWeight").textContent = "--.-";
    byId("homeDiff").textContent = "まだ記録がないよ";
    byId("tsumugiMessage").textContent = "まだ観察を始めたばかり。今日から少しずつ紡いでいこうね🩵";
    byId("todayQuote").textContent = quoteFor(todayString());
  }

  byId("torisetsuList").innerHTML = torisetsu().map(function(x){
    return "<li>"+x+"</li>";
  }).join("");

  byId("statDays").textContent = a.length + "日";

  last30 = a.slice(Math.max(0,a.length-30));
  av = average(last30.map(function(x){ return Number(x.weight); }));
  byId("statAvg").textContent = av === null ? "--" : av.toFixed(1) + "kg";

  last7 = a.slice(Math.max(0,a.length-7));
  if(last7.length < 2){
    byId("statChange").textContent = "--";
  }else{
    start = Number(last7[0].weight);
    end = Number(last7[last7.length-1].weight);
    d = end - start;
    byId("statChange").textContent = (d >= 0 ? "+" : "") + d.toFixed(1) + "kg";
  }
}

function keyword(e){
  if(e.bowel === "なし") return "便なし";
  if(e.bowel === "バナナ") return "🍌";
  if((e.events||[]).indexOf("テニス") >= 0) return "テニスの日";
  if((e.events||[]).indexOf("体育館8時間") >= 0) return "体育館8時間";
  if((e.events||[]).indexOf("体育館4.5時間") >= 0) return "体育館4.5時間";
  if(e.eatingOut) return "外食";
  if(e.extraSnack) return "間食あり";
  if(e.belly === "ある") return "タプタプ";
  if(e.legs === "張ってる") return "脚の張り";
  return "いつもの観察";
}

function renderDiary(){
  var a = getEntries().slice().reverse();
  var html = "";
  var i,e;

  if(!a.length){
    byId("diaryList").innerHTML = '<div class="empty">まだ観察日記は空っぽだよ。</div>';
    return;
  }

  for(i=0;i<a.length;i++){
    e = a[i];
    html +=
      '<div class="diary-item">' +
        '<button class="diary-button" type="button" data-date="'+e.date+'">' +
          '<div class="diary-date">'+Number(e.date.slice(5,7))+'/'+Number(e.date.slice(8))+'</div>' +
          '<div class="diary-main">' +
            '<strong>'+Number(e.weight).toFixed(1)+'kg</strong>　'+changeText(change(e)) +
            '<div>🐈 '+keyword(e)+'</div>' +
          '</div>' +
        '</button>' +
      '</div>';
  }

  byId("diaryList").innerHTML = html;

  var buttons = document.querySelectorAll(".diary-button");
  for(i=0;i<buttons.length;i++){
    buttons[i].addEventListener("click",function(){
      openDetail(this.getAttribute("data-date"));
    });
  }
}

function openDetail(date){
  var a = getEntries();
  var e = null;

  for(var i=0;i<a.length;i++){
    if(a[i].date === date){
      e = a[i];
      break;
    }
  }

  if(!e) return;

  detailDate = date;
  byId("detailTitle").textContent = Number(date.slice(5,7)) + "月" + Number(date.slice(8)) + "日の観察";

  byId("detailContent").innerHTML =
    '<div class="detail-block"><b>☀️ 今日の体重</b><br><span style="font-size:28px;font-weight:900">'+Number(e.weight).toFixed(1)+'kg</span>　'+changeText(change(e))+'</div>' +
    '<div class="detail-block"><b>🐈 つむぎ</b><br>'+String(e.message||messageFor(e)).replace(/\n/g,"<br>")+'</div>' +
    '<div class="detail-block"><b>🌱 今日のひとこと</b><br>'+(e.quote||quoteFor(e.date))+'</div>' +
    '<div class="detail-block"><b>🌅 今朝の体の声</b><br>身体：'+e.body+' / 胃：'+e.stomach+'<br>腸：'+e.belly+' / 脚：'+e.legs+'</div>' +
    '<div class="detail-block"><b>🌙 昨日の暮らし</b><br>睡眠：'+e.sleep+'時間 / 便：'+e.bowel+'<br>' +
      (e.events||[]).map(function(x){ return '<span class="pill">'+x+'</span>'; }).join("") +
      '<br>歩数：'+(e.steps===null?"-":e.steps)+'歩</div>' +
    '<div class="detail-block"><b>🍽 食事・メモ</b><br>外食：'+(e.eatingOut?"あり":"なし")+' / いつも以外の間食：'+(e.extraSnack?"あり":"なし")+'<br>' +
      (e.memo ? e.memo.replace(/\n/g,"<br>") : "メモなし") +
    '</div>';

  showView("detailView");
}

function fillForm(e){
  editingDate = e.date;
  byId("dateInput").value = e.date;
  byId("weightInput").value = e.weight;
  byId("sleepInput").value = e.sleep;

  setChoice("body",e.body);
  setChoice("stomach",e.stomach);
  setChoice("belly",e.belly);
  setChoice("legs",e.legs);
  setChoice("bowel",e.bowel);

  var checks = document.querySelectorAll(".eventCheck");
  for(var i=0;i<checks.length;i++){
    checks[i].checked = (e.events||[]).indexOf(checks[i].value) >= 0;
  }

  byId("stepsInput").value = e.steps === null ? "" : e.steps;
  byId("eatingOutInput").checked = e.eatingOut;
  byId("snackInput").checked = e.extraSnack;
  byId("memoInput").value = e.memo || "";
}

var choiceButtons = document.querySelectorAll(".choices button");
for(var i=0;i<choiceButtons.length;i++){
  choiceButtons[i].addEventListener("click",function(){
    setChoice(this.parentElement.getAttribute("data-group"),this.getAttribute("data-value"));
  });
}

byId("recordButton").addEventListener("click",function(){
  defaultForm();
  showView("formView");
});

byId("diaryButton").addEventListener("click",function(){
  showView("diaryView");
});

byId("cancelButton").addEventListener("click",function(){
  showView("homeView");
});

byId("diaryHomeButton").addEventListener("click",function(){
  showView("homeView");
});

byId("detailBackButton").addEventListener("click",function(){
  showView("diaryView");
});

byId("editButton").addEventListener("click",function(){
  var a = getEntries();
  for(var i=0;i<a.length;i++){
    if(a[i].date === detailDate){
      fillForm(a[i]);
      showView("formView");
      return;
    }
  }
});

byId("deleteButton").addEventListener("click",function(){
  if(!detailDate) return;

  if(confirm("この日の観察を削除する？")){
    saveEntries(getEntries().filter(function(x){ return x.date !== detailDate; }));
    renderHome();
    showView("diaryView");
  }
});

var navButtons = document.querySelectorAll(".navButton");
for(var j=0;j<navButtons.length;j++){
  navButtons[j].addEventListener("click",function(){
    var target = this.getAttribute("data-target");
    if(target === "formView") defaultForm();
    showView(target);
  });
}

byId("entryForm").addEventListener("submit",function(ev){
  ev.preventDefault();

  var e = readForm();

  if(!e.date || !Number.isFinite(e.weight) || !e.sleep){
    alert("日付・体重・睡眠時間を入れてね");
    return;
  }

  e.message = messageFor(e);
  e.quote = quoteFor(e.date);

  var a = getEntries().filter(function(x){
    return x.date !== e.date && x.date !== editingDate;
  });

  a.push(e);
  saveEntries(a);
  editingDate = null;

  byId("savedOverlay").classList.add("show");

  setTimeout(function(){
    byId("savedOverlay").classList.remove("show");
    renderHome();
    showView("homeView");
  },1100);
});

defaultForm();
renderHome();

})();
