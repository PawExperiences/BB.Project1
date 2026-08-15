import type { NotesApi } from './index'

declare global {
  interface Window {
    notesApi: NotesApi
  }
}
