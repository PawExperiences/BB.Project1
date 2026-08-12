import styles from './App.module.css'

interface StandupData {
  yesterday: string[]
  today: string[]
  blockers: string[]
}

const standupData: StandupData = {
  yesterday: [
    'Reviewed the card component PR',
    'Fixed empty-state styling for the Blockers section',
    'Synced with design on the standup card layout',
  ],
  today: [
    'Wire up the standup card app shell',
    'Write the README',
    'Prep for the team demo',
  ],
  blockers: [],
}

function App() {
  const heading = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className={styles.card}>
      <h1 className={styles.heading}>Standup — {heading}</h1>

      <section className={styles.section}>
        <h2 className={styles.label}>Yesterday</h2>
        <ul className={styles.list}>
          {standupData.yesterday.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>Today</h2>
        <ul className={styles.list}>
          {standupData.today.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>Blockers</h2>
        {standupData.blockers.length > 0 ? (
          <ul className={styles.list}>
            {standupData.blockers.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>none</p>
        )}
      </section>
    </div>
  )
}

export default App
