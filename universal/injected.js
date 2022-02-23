// scripts/common/utils.ts
function makeElement(tagName, attributes, inner) {
  attributes = attributes || {};
  inner = inner || [];
  const elem = document.createElement(tagName);
  for (const [k, v] of Object.entries(attributes)) {
    if (/^on/.test(k))
      elem.addEventListener(k.match(/on(.*)/)?.[1], v);
    else
      elem.setAttribute(k, v);
  }
  if (inner instanceof Array)
    elem.append(...inner.filter((value) => Boolean(value)));
  else
    elem.innerText = inner;
  return elem;
}
function minutesToTimeStr(minutes) {
  return `${nDigitNumber(Math.floor(minutes / 60))}:${nDigitNumber(minutes % 60)}`;
}
function nDigitNumber(num, digits = 2) {
  const numStr = num.toString();
  return "0".repeat(Math.max(0, digits - numStr.length)) + numStr;
}
function classInElementTree(elem, className) {
  return Boolean(elem) && (elem.classList.contains(className) || classInElementTree(elem.parentElement, className));
}
function $id(id) {
  return document.getElementById(id);
}
function $class(c) {
  return document.getElementsByClassName(c);
}
function $classAr(c) {
  return Array.from(document.getElementsByClassName(c));
}
function $css(query) {
  return document.querySelectorAll(query);
}
Object.defineProperty(Element.prototype, "$id", {
  value: function(idName) {
    return this.getElementById(idName);
  }
});
Object.defineProperty(Element.prototype, "$class", {
  value: function(className) {
    return this.getElementsByClassName(className);
  }
});
Object.defineProperty(Element.prototype, "$classAr", {
  value: function(className) {
    return Array.from(this.getElementsByClassName(className));
  }
});
Object.defineProperty(Element.prototype, "$tag", {
  value: function(tagName) {
    return this.getElementsByTagName(tagName);
  }
});
Object.defineProperty(Element.prototype, "$tagAr", {
  value: function(tagName) {
    return Array.from(this.getElementsByTagName(tagName));
  }
});
Object.defineProperty(Element.prototype, "$css", {
  value: function(cssQuery) {
    return this.querySelectorAll(cssQuery);
  }
});
Object.defineProperty(Element.prototype, "$cssAr", {
  value: function(cssQuery) {
    return Array.from(this.querySelectorAll(cssQuery));
  }
});

// scripts/common/scheduleParser.ts
var colorMap = {
  "rgb(238, 238, 238)": "default",
  "rgb(255, 0, 0)": "red",
  "rgb(204, 204, 204)": "darkgray"
};
function getWeekSchedule() {
  const weekDayHeaders = $classAr("week_header");
  const dayColumnStartEnd = [];
  const dayColSpans = weekDayHeaders.map((td) => parseInt(td.getAttribute("colspan") ?? "1"));
  for (let i = 0; i < dayColSpans.length; i++) {
    const previous = i > 0 ? dayColumnStartEnd[i - 1][1] : 1;
    dayColumnStartEnd.push([previous, previous + dayColSpans[i]]);
  }
  const schedule = {
    days: weekDayHeaders.map((td) => ({
      dayName: td.innerText.match(/(\w+) \d+\.\d+\./)[1],
      day: parseInt(td.innerText.match(/\w+ (\d+)\.\d+\./)[1]),
      month: parseInt(td.innerText.match(/\w+ \d+\.(\d+)\./)[1]),
      startHour: null,
      endHour: null,
      blocks: []
    })),
    allBlocks: [],
    maxSlots: null
  };
  const tableElement = $class("week_table")[0];
  let tableRows = 0;
  let tableColumns = 0;
  for (const row of tableElement.rows) {
    let rowHeight = 1;
    let rowWidth = 0;
    for (const cell of row.cells) {
      rowHeight = Math.min(rowHeight, getCellSpan(cell, "rowspan"));
      rowWidth += getCellSpan(cell, "colspan");
    }
    tableRows += rowHeight;
    tableColumns = Math.max(tableColumns, rowWidth);
  }
  const virtualTable = Array(tableRows).fill(null).map(() => Array(tableColumns).fill(false));
  let y = 0;
  for (const row of tableElement.rows) {
    let x = 0;
    let rowHeight = 1;
    for (const cell of row.cells) {
      if (virtualTable[y][x])
        x++;
      const cellRowSpan = getCellSpan(cell, "rowspan");
      const cellColSpan = getCellSpan(cell, "colspan");
      for (let cellY = y; cellY < Math.min(y + cellRowSpan, tableRows); cellY++) {
        for (let cellX = x; cellX < Math.min(x + cellColSpan, tableColumns); cellX++)
          virtualTable[cellY][cellX] = true;
      }
      rowHeight = Math.min(rowHeight, cellRowSpan);
      x++;
      if (!cell.classList.contains("week_block"))
        continue;
      const linkNode = cell.$css("a .link")[0] ?? cell.$tag("a")[0];
      const texts = [...linkNode.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((node) => node.textContent);
      const other = cell.$classAr("resource").map((res) => res.innerText);
      let location = other.find((text) => /Hörsaal|Audimax|^[A-Z]\d+/i.test(text));
      if (other.find((text) => /Virtueller Raum/.test(text)))
        location = location ? `${location} / Online` : "Online";
      const timeAndTitleMatches = texts[0].match(/(\d\d):(\d\d)\s*-\s*(\d\d):(\d\d)/);
      const weekDayIndex = getWeekDayIndex(x, dayColumnStartEnd);
      schedule.days[weekDayIndex].blocks.push({
        startMinutes: parseInt(timeAndTitleMatches[1]) * 60 + parseInt(timeAndTitleMatches[2]),
        endMinutes: parseInt(timeAndTitleMatches[3]) * 60 + parseInt(timeAndTitleMatches[4]),
        title: texts[1].replace(/\s+/g, " "),
        location,
        people: cell.getElementsByClassName("person")[0]?.innerText ?? "",
        other,
        scheduleIndex: null,
        colorScheme: colorMap[cell.style.getPropertyValue("background-color")] ?? "default"
      });
    }
    for (let i = 0; i < rowHeight; i++)
      y++;
  }
  for (const day of schedule.days) {
    day.startHour = Math.min(...day.blocks.map((block) => Math.floor(block.startMinutes / 60)), 8);
    day.endHour = Math.max(...day.blocks.map((block) => Math.ceil(block.endMinutes / 60)), 16);
    for (const block of day.blocks) {
      let scheduleIndex = 0;
      while (day.blocks.findIndex((b) => b.scheduleIndex === scheduleIndex && (block.startMinutes <= b.endMinutes && block.endMinutes >= b.startMinutes)) !== -1) {
        scheduleIndex++;
      }
      block.scheduleIndex = scheduleIndex;
      schedule.maxSlots = Math.max(schedule.maxSlots, scheduleIndex);
    }
  }
  schedule.maxSlots++;
  return schedule;
}
function getCellSpan(cell, type) {
  return parseInt(cell.getAttribute(type) ?? "1");
}
function getWeekDayIndex(x, dayColumnStartEnd) {
  return dayColumnStartEnd.findIndex((startEnd) => x >= startEnd[0] && x < startEnd[1]);
}

// scripts/common/dragger.ts
var startX = 0;
var startY = 0;
var lastX = 0;
var lastY = 0;
var isDragging = false;
var dragStart = 0;
var isSelectionDisabled = false;
function dragOnMouseDown(e) {
  if (classInElementTree(e.target, "block"))
    return;
  if (!classInElementTree(e.target, "newCalendar"))
    return;
  startX = e.screenX;
  startY = e.screenY;
  lastX = e.screenX;
  lastY = e.screenY;
  isDragging = true;
  dragStart = Date.now();
  isSelectionDisabled = false;
}
function dragOnMouseUp() {
  isDragging = false;
  document.body.classList.remove("isDragging");
}
function dragOnMouseMove(e) {
  if (!isDragging)
    return;
  const deltaX = (lastX - e.screenX) / (devicePixelRatio || 1);
  const deltaY = (lastY - e.screenY) / (devicePixelRatio || 1);
  document.body.scrollBy(deltaX, deltaY);
  lastX = e.screenX;
  lastY = e.screenY;
  const startDeltaX = startX - e.screenX;
  const startDeltaY = startY - e.screenY;
  if (!isSelectionDisabled && Math.abs(startDeltaX + startDeltaY) > 5) {
    document.body.classList.add("isDragging");
    isSelectionDisabled = true;
  }
}

// scripts/common/main.ts
var weekSchedule;
var timeMarker;
var mainExecuted = false;
function main() {
  if (mainExecuted)
    return;
  mainExecuted = true;
  document.body.classList.remove("loading");
  weekSchedule = getWeekSchedule();
  document.head.insertAdjacentHTML("beforeend", `<meta content="width=device-width, initial-scale=1" name="viewport" />`);
  document.head.insertAdjacentHTML("beforeend", `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">`);
  $id("calendar").remove();
  rearrangeHeader();
  document.body.append(makeElement("div", { class: "newCalendar" }, [
    timeMarker = makeElement("div", { class: "timeMarker hide" }),
    makeElement("div", { class: "center" }, weekSchedule.days.map((day) => makeElement("div", { class: "day", style: `--dayLengthInMinutes: ${(day.endHour - day.startHour) * 60}` }, [
      makeElement("div", { class: "header" }, [
        makeElement("div", { class: "dayTitle" }, `${day.dayName} ${nDigitNumber(day.day)}.${nDigitNumber(day.month)}.`),
        makeElement("div", { class: "hours" }, Array(day.endHour - day.startHour).fill(null).map((_, i) => day.startHour + i).map((hour) => makeElement("div", { class: "hour" }, hour.toString())))
      ]),
      makeElement("div", { class: "blocks", style: `--max-slots: ${weekSchedule.maxSlots}` }, day.blocks.map((block) => makeElement("div", {
        class: `block ${block.colorScheme}`,
        style: `--start-minutes: ${block.startMinutes - day.startHour * 60}; --minutes: ${block.endMinutes - block.startMinutes}; --index: ${block.scheduleIndex}`,
        onclick: toggleBlock
      }, [
        makeElement("div", { class: "title" }, block.title),
        makeElement("div", { class: "time" }, `${minutesToTimeStr(block.startMinutes)} - ${minutesToTimeStr(block.endMinutes)}`),
        block.location && makeElement("div", { class: "location" }, `${block.location}`),
        block.people && makeElement("div", { class: "people expandedOnly" }, `${block.people}`),
        ...block.other.map((other) => makeElement("div", { class: "other expandedOnly" }, other)),
        makeSvgArrow()
      ])))
    ])))
  ]));
  for (let block of $css("div.block")) {
    const overflowHeightDiff = block.scrollHeight - block.offsetHeight;
    if (overflowHeightDiff < 7)
      continue;
    block.classList.add("slightlySmaller");
    if (overflowHeightDiff > 12)
      block.classList.add("smaller");
  }
  updateTimeMarker();
  setInterval(updateTimeMarker, 1e3);
  window.addEventListener("mousedown", dragOnMouseDown);
  window.addEventListener("mouseup", dragOnMouseUp);
  window.addEventListener("mousemove", dragOnMouseMove);
}
function rearrangeHeader() {
  const title = $css("h2.title")[0];
  const form = $css(".datechooser > form")[0];
  const prevBtn = $css("input[type=submit][name=prev]")[0];
  const nextBtn = $css("input[type=submit][name=next]")[0];
  const todayBtn = $css("input[type=submit][name=today]")[0];
  const showDateBtn = $css("input[type=submit][name=goto]")[0];
  const hiddenInputs = $css("input[type=hidden]");
  const selects = $css("select[name]");
  $css(".datechooser")[0].remove();
  form.innerText = "";
  form.append(...hiddenInputs, prevBtn, todayBtn, ...selects, showDateBtn, nextBtn);
  const newHeader = makeElement("div", { class: "newHeader" }, [
    title,
    form
  ]);
  document.body.insertAdjacentElement("afterbegin", newHeader);
}
function toggleBlock() {
  if (this.classList.contains("expanded")) {
    if (document.getSelection().toString())
      return;
    this.classList.remove("expanded");
    this.style.removeProperty("max-height");
    this.style.removeProperty("min-height");
  } else {
    this.classList.add("expanded");
    this.style.minHeight = `${Math.max(this.offsetHeight, this.scrollHeight) + 8}px`;
    this.style.maxHeight = `${Math.max(this.offsetHeight, this.scrollHeight) + 8}px`;
  }
}
function updateTimeMarker() {
  const nowDate = new Date();
  const dayColumn = weekSchedule.days.findIndex((day) => day.day === nowDate.getDate());
  const todayData = weekSchedule.days[dayColumn];
  let dayStartMinutes = todayData?.startHour * 60;
  let dayDurationMinutes = (todayData?.endHour - todayData?.startHour) * 60;
  const dayElement = $css(".center > .day")[dayColumn];
  if (dayElement && timeMarker.classList.contains("hide")) {
    const bounds = dayElement.getBoundingClientRect();
    if (bounds.left < 0 || bounds.right > window.innerHeight)
      document.body.scrollBy({ left: bounds.left - 100 });
  }
  if (dayColumn === -1 || todayData.month !== nowDate.getMonth() + 1 || nowDate.getHours() * 60 < dayStartMinutes || nowDate.getHours() * 60 >= dayStartMinutes + dayDurationMinutes) {
    timeMarker.classList.add("hide");
    return;
  }
  if (timeMarker.classList.contains("hide")) {
    timeMarker.classList.remove("hide");
  }
  const previousDaysMinutes = weekSchedule.days.slice(0, dayColumn).reduce((prev, curr) => prev + (curr.endHour - curr.startHour), 0) * 60;
  timeMarker.style.setProperty("--minutes", (previousDaysMinutes + (nowDate.getHours() - todayData.startHour) * 60 + nowDate.getMinutes()).toString());
}
var downArrowSvg;
function makeSvgArrow() {
  if (!downArrowSvg) {
    const dummy = document.createElement("div");
    dummy.innerHTML = `<svg class="downArrow" xmlns="http://www.w3.org/2000/svg" data-name="Layer 2" viewBox="0 0 48 48" x="0px" y="0px"><title>video music player</title><path d="M24,31a2,2,0,0,1-1.41-.59l-10-10a2,2,0,0,1,2.82-2.82L24,26.17l8.59-8.58a2,2,0,0,1,2.82,2.82l-10,10A2,2,0,0,1,24,31Z"></path></svg>`;
    downArrowSvg = dummy.children[0];
  }
  return downArrowSvg.cloneNode(true);
}

// universal/injected.ts
function inject() {
  const style = `@import"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap";*{padding:0;margin:0;border:none;background:none;box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:"Poppins",sans-serif;scrollbar-width:thin;scrollbar-color:#ababab transparent}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#ababab}::-webkit-scrollbar-thumb:hover{background:#8d8d8d}@media (max-width: 600px),(max-height: 450px){:root{font-size:.85rem}}html,body{overflow-x:auto;height:100%}body{background:#f9f9f9;transition:opacity .25s ease}body.isDragging{user-select:none}body.loading{opacity:0;transition-duration:0s}.newCalendar{width:max-content;display:flex;margin-top:4rem;background-color:#f9f9f9;background-image:linear-gradient(to right,#e2e2e2 1px,transparent 1px);background-size:3.75rem 5.5rem;position:relative}.newCalendar>.center{display:flex}.newCalendar>.center .day{--dayLengthInMinutes: 60 * 10;width:calc(.0625rem * var(--dayLengthInMinutes));min-width:calc(.0625rem * var(--dayLengthInMinutes));position:relative}.newCalendar>.center .day+.day{border-left:1px solid #0000000d}.newCalendar>.center .day .header{position:sticky;top:4rem;z-index:1;background:white;border-bottom:1px solid #0000000d}.newCalendar>.center .day .header .dayTitle{font-size:1.125rem;width:100%;height:3rem;line-height:3rem;text-align:center;font-weight:600}.newCalendar>.center .day .header .hours{display:flex;width:100%;height:3rem}.newCalendar>.center .day .header .hours .hour{flex:1 1 0;height:3rem;line-height:3rem;text-align:center;font-size:1rem;font-weight:600}.newCalendar>.center .day .header .hours .hour+.hour{border-left:1px solid #0000000d}.newCalendar>.center .day .blocks{--max-slots: 1;position:relative;height:max(calc(var(--max-slots) * 5.5rem),calc(100vh - 10rem - 10px));--multi: .05;background-image:linear-gradient(180deg,rgba(0,0,0,calc(var(--multi) * 1)) 0rem,rgba(0,0,0,calc(var(--multi) * .85)) .4rem,rgba(0,0,0,calc(var(--multi) * .72)) .8rem,rgba(0,0,0,calc(var(--multi) * .59)) 1.2rem,rgba(0,0,0,calc(var(--multi) * .46)) 1.6rem,rgba(0,0,0,calc(var(--multi) * .35)) 2rem,rgba(0,0,0,calc(var(--multi) * .25)) 2.4rem,rgba(0,0,0,calc(var(--multi) * .16)) 2.8rem,rgba(0,0,0,calc(var(--multi) * .09)) 3.2rem,rgba(0,0,0,calc(var(--multi) * .03)) 3.6rem,rgba(0,0,0,calc(var(--multi) * 0)) 4rem)}.newCalendar>.center .day .blocks .block{--start-minutes: 0;--minutes: 0;--index: 0;--background: white;--color: black;background-color:var(--background);text-shadow:0 0 2px var(--background),0 0 4px var(--background),0 0 6px var(--background);color:var(--color);padding:.5rem 0 .5rem .5rem;display:flex;flex-flow:column;position:absolute;top:calc(5.5rem * var(--index) + .375rem);left:calc(.0625rem * var(--start-minutes) + .0625rem);border-radius:.65rem;width:calc(var(--minutes) * .0625rem - .125rem);min-height:calc(5.5rem - .75rem);max-height:calc(5.5rem - .75rem);height:max-content;transition:all .125s ease;font-size:.9rem;cursor:pointer}.newCalendar>.center .day .blocks .block.expanded{min-width:min-content;z-index:1;box-shadow:0 0 #0000001a,0 2px 4px #0000001a,0 8px 8px #0000001a,0 12px 16px #0000001a}.newCalendar>.center .day .blocks .block:hover .downArrow{opacity:1}.newCalendar>.center .day .blocks .block:not(.expanded)>*{line-height:1.15em}.newCalendar>.center .day .blocks .block:not(.expanded) .expandedOnly{display:none;opacity:0;transition-duration:.25s}.newCalendar>.center .day .blocks .block:not(.expanded).slightlySmaller{padding-top:.25rem}.newCalendar>.center .day .blocks .block:not(.expanded).slightlySmaller>*{font-size:.85rem}.newCalendar>.center .day .blocks .block:not(.expanded).smaller>*{font-size:.8em}.newCalendar>.center .day .blocks .block .expandedOnly{transition:opacity .125s ease}.newCalendar>.center .day .blocks .block .title{text-align:initial;font-weight:600;line-height:1em}.newCalendar>.center .day .blocks .block .downArrow{position:absolute;top:0;right:.1rem;opacity:0;width:2rem;height:2rem;fill:var(--color);transition:opacity .125s ease}.newCalendar>.center .day .blocks .block.default{--background: #c7dcff;--color: #28446f}.newCalendar>.center .day .blocks .block.red{--background: #e02838;--color: #fff7f7}.newCalendar>.center .day .blocks .block.blueish{--background: #4b60c7;--color: #e8edff}.newCalendar>.center .day .blocks .block.darkgray{--background: #757575;--color: #f8f8f8}.newCalendar .timeMarker{--minutes: 0;position:absolute;top:0;left:calc(var(--minutes) * .0625rem - 4rem + 2px);width:4rem;height:100%;border-right:2px solid #4388ff;background-image:linear-gradient(to right,transparent 0%,#4388ff28 100%)}.newCalendar .timeMarker.hide{display:none}.newHeader{position:fixed;top:0;z-index:2;background:white;width:100%;height:4rem;display:flex;align-items:center;border-bottom:1px solid #0000000d;overflow-x:auto;overflow-y:hidden}.newHeader h2.title{padding:0 2rem}.newHeader form{display:flex;gap:.75rem;margin-left:auto;margin-right:2rem}.newHeader form input[type=submit],.newHeader form select{border-radius:.65rem;background:#f3f3f3;padding:.4rem .75rem;cursor:pointer;transition:all .15s ease;font-weight:600;font-size:.9rem}.newHeader form input[type=submit]:hover,.newHeader form input[type=submit]:focus-visible,.newHeader form select:hover,.newHeader form select:focus-visible{background:#e8e8e8;outline:none}.newHeader form input[type=submit]:active,.newHeader form select:active{background:#d8d8d8}
`;
  document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);
  main();
}
if (["complete", "interactive"].includes(document.readyState))
  inject();
else {
  document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive")
      return;
    inject();
  });
}
