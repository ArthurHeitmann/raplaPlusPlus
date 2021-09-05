# Rapla++

Rapla aber übersichtlicher

![Screenshot](readmeImgs/screenshot.png)

## Installation

3. Unterschiedliche Optionen

### Chrome

1. [chrome://extensions/](chrome://extensions/)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. `chrome` Ordner auswählen

### Tampermonkey

Utilities > File > Import **Browse**

`universal/rapla++_tampermonkey.json` importieren

### Universal

`universal/injected.js` mit einem JS injector Plugin für `https://rapla.dhbw-karlsruhe.de/rapla?page=calendar*`

### Firefox

Open `about:debugging` in Firefox > Click "This Firefox" > Click "Load Temporary Add-on" > Choose `firefox/manifest.json`<br>
Sadly, after a restart of Firefox, you currently need to load the Add-on again.

## Development

```shell
# einmalig
npm install
```

```shell
# einfacher build
npm run build 
```

```shell
# auto rebuild
npm run watch 
```
