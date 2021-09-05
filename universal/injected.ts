console.log("injected")
import {main} from "../scripts/common/main.js";

const style = `@import"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap";*{padding:0;margin:0;border:none;background:none;box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:"Poppins",sans-serif;scrollbar-width:thin;scrollbar-color:#ababab transparent}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#ababab}::-webkit-scrollbar-thumb:hover{background:#8d8d8d}@media (max-width: 600px),(max-height: 450px){:root{font-size:.85rem}}html,body{overflow-x:auto;height:100%}body{background:#f9f9f9}body.isDragging{user-select:none}.newCalendar{width:max-content;display:flex;margin-top:4rem;background-color:#f9f9f9;background-image:linear-gradient(to right,#e2e2e2 1px,transparent 1px);background-size:3.75rem 5.5rem;position:relative}.newCalendar>.center{display:flex}.newCalendar>.center .day{width:37.5rem;min-width:37.5rem;position:relative}.newCalendar>.center .day+.day{border-left:1px solid #0000000d}.newCalendar>.center .day .header{position:sticky;top:4rem;z-index:1;background:white;border-bottom:1px solid #0000000d}.newCalendar>.center .day .header .dayTitle{font-size:1.125rem;width:100%;height:3rem;line-height:3rem;text-align:center;font-weight:600}.newCalendar>.center .day .header .hours{display:flex;width:100%;height:3rem}.newCalendar>.center .day .header .hours .hour{flex:1 1 0;height:3rem;line-height:3rem;text-align:center;font-size:1rem;font-weight:600}.newCalendar>.center .day .header .hours .hour+.hour{border-left:1px solid #0000000d}.newCalendar>.center .day .blocks{--max-slots: 1;position:relative;height:max(calc(var(--max-slots) * 5.5rem),calc(100vh - 10rem - 10px));--multi: .05;background-image:linear-gradient(180deg,rgba(0,0,0,calc(var(--multi) * 1)) 0rem,rgba(0,0,0,calc(var(--multi) * .85)) .4rem,rgba(0,0,0,calc(var(--multi) * .72)) .8rem,rgba(0,0,0,calc(var(--multi) * .59)) 1.2rem,rgba(0,0,0,calc(var(--multi) * .46)) 1.6rem,rgba(0,0,0,calc(var(--multi) * .35)) 2rem,rgba(0,0,0,calc(var(--multi) * .25)) 2.4rem,rgba(0,0,0,calc(var(--multi) * .16)) 2.8rem,rgba(0,0,0,calc(var(--multi) * .09)) 3.2rem,rgba(0,0,0,calc(var(--multi) * .03)) 3.6rem,rgba(0,0,0,calc(var(--multi) * 0)) 4rem)}.newCalendar>.center .day .blocks .block{--start-minutes: 0;--minutes: 0;--index: 0;--background: white;--color: black;background-color:var(--background);color:var(--color);padding:.5rem;display:flex;flex-flow:column;position:absolute;top:calc(5.5rem * var(--index) + .375rem);left:calc(.0625rem * var(--start-minutes) + .0625rem);border-radius:.65rem;width:calc(var(--minutes) * .0625rem - .125rem);min-height:calc(5.5rem - .75rem);max-height:calc(5.5rem - .75rem);height:max-content;transition:all .125s ease;font-size:.9rem;cursor:pointer}.newCalendar>.center .day .blocks .block.expanded{min-width:min-content;z-index:1;box-shadow:0 0 #0000001a,0 2px 4px #0000001a,0 8px 8px #0000001a,0 12px 16px #0000001a}.newCalendar>.center .day .blocks .block:hover .downArrow{opacity:1}.newCalendar>.center .day .blocks .block:not(.expanded) .expandedOnly{display:none;opacity:0;transition-duration:.25s}.newCalendar>.center .day .blocks .block .expandedOnly{transition:opacity .125s ease}.newCalendar>.center .day .blocks .block .title{text-align:initial;font-weight:bold;line-height:1em}.newCalendar>.center .day .blocks .block .downArrow{position:absolute;top:0;right:.1rem;opacity:0;width:2rem;height:2rem;fill:var(--color);transition:opacity .125s ease}.newCalendar>.center .day .blocks .block.default{--background: #c7dcff;--color: #28446f}.newCalendar>.center .day .blocks .block.red{--background: #e02838;--color: #fff7f7}.newCalendar>.center .day .blocks .block.blueish{--background: #4b60c7;--color: #e8edff}.newCalendar>.center .day .blocks .block.darkgray{--background: #757575;--color: #f8f8f8}.newCalendar .timeMarker{--minutes: 0;position:absolute;top:0;left:calc(var(--minutes) * .0625rem - 4rem + 2px);width:4rem;height:100%;border-right:2px solid #4388ff;background-image:linear-gradient(to right,transparent 0%,#4388ff28 100%)}.newCalendar .timeMarker.hide{display:none}.newHeader{position:fixed;top:0;z-index:2;background:white;width:100%;height:4rem;display:flex;align-items:center;border-bottom:1px solid #0000000d;overflow-x:auto;overflow-y:hidden}.newHeader h2.title{padding:0 2rem}.newHeader form{display:flex;gap:.75rem;margin-left:auto;margin-right:2rem}.newHeader form input[type=submit],.newHeader form select{border-radius:.65rem;background:#f3f3f3;padding:.4rem .75rem;cursor:pointer;transition:all .15s ease;font-weight:600;font-size:.9rem}.newHeader form input[type=submit]:hover,.newHeader form input[type=submit]:focus-visible,.newHeader form select:hover,.newHeader form select:focus-visible{background:#e8e8e8;outline:none}.newHeader form input[type=submit]:active,.newHeader form select:active{background:#d8d8d8}`;

function inject() {
	document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`)
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

