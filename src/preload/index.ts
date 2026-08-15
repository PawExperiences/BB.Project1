import { contextBridge, ipcRenderer } from 'electron'

const notesApi = {
  load: (): Promise<string> => ipcRenderer.invoke('notes:load'),
  save: (text: string): Promise<void> => ipcRenderer.invoke('notes:save', text)
}

contextBridge.exposeInMainWorld('notesApi', notesApi)

export type NotesApi = typeof notesApi
