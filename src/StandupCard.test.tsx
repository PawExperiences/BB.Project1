import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StandupCard } from './StandupCard'

describe('StandupCard', () => {
  it('renders all three section labels and their items in order', () => {
    render(
      <StandupCard
        yesterday={['Shipped the login page']}
        today={['Write tests', 'Review PR']}
        blockers={['Waiting on design review']}
      />
    )

    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Blockers')).toBeInTheDocument()

    expect(screen.getByText('Shipped the login page')).toBeInTheDocument()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('Review PR')).toBeInTheDocument()
    expect(screen.getByText('Waiting on design review')).toBeInTheDocument()
  })

  it('renders empty sections without throwing when arrays are empty', () => {
    expect(() =>
      render(<StandupCard yesterday={[]} today={[]} blockers={[]} />)
    ).not.toThrow()

    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Blockers')).toBeInTheDocument()
  })
})
