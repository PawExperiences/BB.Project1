# BuildBoard Notes

A single-window desktop notes app: one full-height textarea that auto-saves
as you type and restores your last note on the next launch.

## Stack

Electron + React + TypeScript, bundled with [electron-vite](https://electron-vite.org)
(main/preload/renderer split, output to `out/`), packaged with
[electron-builder](https://www.electron.build).

## Install

```sh
npm install
```

## Develop

Runs the app with hot reload:

```sh
npm run dev
```

## Build installers

Builds the app and packages Linux (AppImage, deb) and Windows (nsis)
installers into `dist/`, without publishing:

```sh
npm run build
```

## How it works

- The renderer never touches Node or the filesystem directly:
  `contextIsolation` is on and `nodeIntegration` is off. The only bridge
  between renderer and main is a `contextBridge` API (`window.notesApi`)
  exposing exactly two methods, `load()` and `save(text)`.
- Note text is persisted to `notes.txt` inside Electron's `userData`
  directory, written at most once every 500ms while typing (trailing
  debounce).
- On launch, the textarea is pre-filled with the last saved note (or empty
  if `notes.txt` doesn't exist yet).
