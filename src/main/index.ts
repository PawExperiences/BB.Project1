import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

function getNotesPath(): string {
  return join(app.getPath('userData'), 'notes.txt')
}

async function loadNotes(): Promise<string> {
  try {
    return await readFile(getNotesPath(), 'utf-8')
  } catch {
    return ''
  }
}

async function saveNotes(text: string): Promise<void> {
  await writeFile(getNotesPath(), text, 'utf-8')
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('notes:load', () => loadNotes())
  ipcMain.handle('notes:save', (_event, text: string) => saveNotes(text))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
