interface Element {
	$id: (idName: string) => HTMLElement;
	$class: (className: string) => HTMLCollectionOf<HTMLElement>;
	$classAr: (className: string) => Array<HTMLElement>;
	$tag: (tagName: string) => HTMLCollectionOf<HTMLElement>;
	$tagAr: (tagName: string) => Array<HTMLElement>;
	$css: (cssQuery: string) => NodeListOf<HTMLElement>;
	$cssAr: (cssQuery: string) => Array<HTMLElement>;
}