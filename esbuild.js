import esbuild from "esbuild";
import {sassPlugin} from "esbuild-sass-plugin";
import {spawn} from "child_process";
import fs from "fs";

const isWatchMode = process.argv.includes("watch") || process.argv.includes("-w") || process.argv.includes("--watch");
const cssDestinations = [
	"chrome/main.css",
	"firefox/main.css",
]

const tscTypeChecker = spawn("npx", ["tsc", "--noEmit", "--preserveWatchOutput"].concat(isWatchMode ? "-w" : []), { shell: true });
function displayChunk(chunk) {
	if (/^\s*$/.test(chunk)
		|| /^\s*[\d.: ]+.{0,5}?Starting compilation in watch mode...\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?Found 0 errors. Watching for file changes.\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?Starting compilation in watch mode...\s*[\d.: ]+.{0,5}?Found 0 errors. Watching for file changes\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?File change detected. Starting incremental compilation...\s*[\d.: ]+.{0,5}?Found 0 errors. Watching for file changes\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?File change detected. Starting incremental compilation...\s*$/.test(chunk.toString()))
		return;
	process.stdout.write(chunk);
}
tscTypeChecker.stdout.on("data", displayChunk);
tscTypeChecker.stderr.on("data", chunk => {
	process.stderr.write(chunk);
});
tscTypeChecker.on("exit", code => {
	if (isWatchMode)
		return;
	if (code === 0) {
		console.log("tsc successful");
		return;
	}
	console.error("tsc failed");
	process.exit(1);
})
console.log("started tsc");

function watchFeedback(label) {
	return (error) => {
		if (error)
			console.error(`rebuild ${label} failed${error.errors.length > 0 ? ` with ${error.errors.length} ${error.errors.length === 1 ? "error" : "errors"}` : ""}`);
		else
			console.log(`rebuild ${label} done`);
	}
}
function makeGeneralConfig(label, shouldBundle, platform = undefined, onRebuildCallback = () => undefined) {
	return {
		bundle: shouldBundle,
		outdir: "/",
		outbase: "/",
		...(platform !== null ? { platform } : {}),
		format: "esm",
		sourcemap: false,
		watch: isWatchMode ? {
			onRebuild: (error, result) => {
				watchFeedback(label)(error);
				onRebuildCallback(error, result);
			},
		} : false
	}
}

esbuild.build({
	entryPoints: [
		"chrome/background.ts",
		"chrome/injected.ts",
		"chrome/popup.ts",
		"firefox/background.ts",
		"firefox/injected.ts",
		"firefox/popup.ts",
		"universal/injected.ts",
	],
	...makeGeneralConfig("Extension TS", true, "browser", copyCssToDestinations),
})
	.catch(() => process.exit(1))
	.then(() => {
		console.log("esbuild Extension TS transpiled");
		copyCssToDestinations();
	});

function copyCssToDestinations(error, buildResult) {
	if (error || buildResult?.errors?.length)
		return;

	for (const dest of cssDestinations)
		fs.copyFileSync("style/main.css", dest);
	try {
		const universalInjected = fs.readFileSync("universal/injected.js").toString();
		const generatedCss = fs.readFileSync("style/main.css").toString();
		const injectedCss = universalInjected.replace(/(?<=const style = `).*(?=`;)/s, generatedCss);
		fs.writeFileSync("universal/injected.js", injectedCss);
	} catch (e) {
		console.warn("Couldn't insert css to universal/injected.js (file doesn't exist)");
	}
}
esbuild.build({
	entryPoints: [
		"style/main.scss",
	],
	minify: true,
	plugins: [
		sassPlugin({
		})
	],
	...makeGeneralConfig("SCSS", false, undefined, copyCssToDestinations)

})
	.catch(() => process.exit(1))
	.then(() => {
		console.log("esbuild SCSS transpiled");
		copyCssToDestinations();
	});

if (isWatchMode)
	console.log("esbuild started watch");
