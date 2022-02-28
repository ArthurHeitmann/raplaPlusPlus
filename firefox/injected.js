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
      let location2 = other.find((text) => /Hörsaal|Audimax|^[A-Z]\d+/i.test(text));
      if (other.find((text) => /Virtueller Raum/.test(text)))
        location2 = location2 ? `${location2} / Online` : "Online";
      const timeAndTitleMatches = texts[0].match(/(\d\d):(\d\d)\s*-\s*(\d\d):(\d\d)/);
      const weekDayIndex = getWeekDayIndex(x, dayColumnStartEnd);
      schedule.days[weekDayIndex].blocks.push({
        startMinutes: parseInt(timeAndTitleMatches[1]) * 60 + parseInt(timeAndTitleMatches[2]),
        endMinutes: parseInt(timeAndTitleMatches[3]) * 60 + parseInt(timeAndTitleMatches[4]),
        title: texts[1].replace(/\s+/g, " "),
        location: location2,
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
  scrollIntoTodayOnce(dayColumn);
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
var hasScrolledOnce = false;
function scrollIntoTodayOnce(dayColumn) {
  if (hasScrolledOnce)
    return;
  hasScrolledOnce = true;
  const dayElement = $css(".center > .day")[dayColumn];
  if (!(dayElement && timeMarker.classList.contains("hide"))) {
    return;
  }
  const bounds = dayElement.getBoundingClientRect();
  if (bounds.left < 0 || bounds.right > window.innerHeight)
    document.body.scrollBy({ left: bounds.left - 100 });
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

// firefox/injected.ts
var isReady = false;
browser.storage.local.get("enabled").then(({ enabled }) => {
  if (!enabled)
    return;
  if (isReady)
    main();
  else
    isReady = true;
});
document.addEventListener("readystatechange", () => {
  if (document.readyState !== "interactive")
    return;
  if (isReady)
    main();
  else
    isReady = true;
});
browser.storage.onChanged.addListener((changes) => {
  if ("enabled" in changes) {
    if (changes.enabled.newValue)
      main();
    else
      location.reload();
  }
});
