import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GlobalSearchBox } from './global-search-box'
const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
describe('GlobalSearchBox', () => {
  it('navigates to encoded search results', () => {
    render(<GlobalSearchBox />)
    fireEvent.change(screen.getByLabelText('Search HIVE'), { target: { value: 'Client launch' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(push).toHaveBeenCalledWith('/dashboard/search?q=Client%20launch')
  })
})
