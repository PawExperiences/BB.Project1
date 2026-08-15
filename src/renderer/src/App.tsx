import { useEffect, useRef, useState } from 'react'

const SAVE_DEBOUNCE_MS = 500

function App(): React.JSX.Element {
  const [text, setText] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.notesApi.load().then(setText)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = event.target.value
    setText(value)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.notesApi.save(value)
    }, SAVE_DEBOUNCE_MS)
  }

  return (
    <textarea
      value={text}
      onChange={handleChange}
      spellCheck={false}
      style={{
        width: '100%',
        height: '100vh',
        boxSizing: 'border-box',
        border: 'none',
        outline: 'none',
        resize: 'none',
        padding: '12px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px'
      }}
    />
  )
}

export default App
