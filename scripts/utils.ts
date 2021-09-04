
export function makeElement<K extends keyof HTMLElementTagNameMap>(
	tagName: K | string,
	attributes?: Record<string, string | EventListener>,
	inner?: (HTMLElement | Node | string)[] | string,
	useInnerHTML = false
): HTMLElement {
	attributes = attributes || {};
	inner = inner || [];
	const elem = document.createElement(tagName);
	for (const [k, v] of Object.entries(attributes)) {
		if (/^on/.test(k))
			elem.addEventListener(k.match(/on(.*)/)?.[1], v as EventListener);
		else
			elem.setAttribute(k, v as string);
	}
	if (inner instanceof Array)
		elem.append(...inner.filter(value => Boolean(value)));
	else if (!useInnerHTML)
		elem.innerText = inner;
	else
		elem.innerHTML = inner;
	return elem;
}

export function minutesToTimeStr(minutes: number): string {
	return `${nDigitNumber(Math.floor(minutes / 60))}:${nDigitNumber(minutes % 60)}`;
}

export function nDigitNumber(num: number, digits = 2): string {
	const numStr = num.toString();
	return "0".repeat(Math.max(0, digits - numStr.length)) + numStr;
}

export function classInElementTree(elem: Element, className: string): boolean {
	return Boolean(elem) && (elem.classList.contains(className) || classInElementTree(elem.parentElement, className));
}

/** document.getElementById replacement */
export function $id(id: string): HTMLElement {
	return document.getElementById(id);
}

/** document.getElementsByClassName shorthand */
export function $class(c: string): HTMLCollectionOf<HTMLElement> {
	return document.getElementsByClassName(c) as HTMLCollectionOf<HTMLElement>;
}

/** Array.from(document.getElementsByClassName) shorthand */
export function $classAr(c: string): Array<HTMLElement> {
	return Array.from(document.getElementsByClassName(c) as HTMLCollectionOf<HTMLElement>);
}

/** document.querySelectorAll shorthand */
export function $css(query: string): NodeListOf<HTMLElement> {
	return document.querySelectorAll(query) as NodeListOf<HTMLElement>;
}

/** Array.from(document.querySelectorAll) shorthand */
export function $cssAr(query: string): Array<HTMLElement> {
	return Array.from(document.querySelectorAll(query));
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
