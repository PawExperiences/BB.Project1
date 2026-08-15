import styles from './App.module.css'

const standup = {
  date: 'Monday, August 17, 2026',
  yesterday: [
    'Reviewed pull requests from the team',
    'Fixed the login redirect bug',
    'Wrote unit tests for the auth module',
  ],
  today: [
    'Pair on the new dashboard layout',
    'Deploy the staging build',
    'Triage bug backlog',
  ],
  blockers: [] as string[],
}

function App() {
  return (
    <div className={styles.card}>
      <h1 className={styles.date}>{standup.date}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Yesterday</h2>
        <ul className={styles.list}>
          {standup.yesterday.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Today</h2>
        <ul className={styles.list}>
          {standup.today.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Blockers</h2>
        {standup.blockers.length > 0 ? (
          <ul className={styles.list}>
            {standup.blockers.map((item) => (
              <li key={item}>{item}</li>
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
