import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from './page'

// Mock Firebase
jest.mock('@/lib/firebase/config', () => {
  const mockSignOut = jest.fn()
  return {
    auth: {
      currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        metadata: {
          creationTime: '2024-01-15T10:00:00Z',
          lastSignInTime: '2024-01-20T15:30:00Z',
        },
      },
      signOut: mockSignOut,
    },
  }
})

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('SettingsPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })
  })

  it('renders settings page', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })

  it('displays user profile information', () => {
    render(<SettingsPage />)

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('displays user ID', () => {
    render(<SettingsPage />)

    expect(screen.getByText('test-user-123')).toBeInTheDocument()
  })

  it('disables name and email inputs', () => {
    render(<SettingsPage />)

    const nameInput = screen.getByDisplayValue('Test User') as HTMLInputElement
    const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement

    expect(nameInput).toBeDisabled()
    expect(emailInput).toBeDisabled()
  })

  it('handles logout', async () => {
    const user = userEvent.setup()
    const { auth } = require('@/lib/firebase/config')
    render(<SettingsPage />)

    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled()
      expect(auth.signOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
