import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'

// Mock Firebase auth functions
const mockSignInWithEmailAndPassword = jest.fn()
const mockSignInWithPopup = jest.fn()
const mockGetIdToken = jest.fn()

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  GoogleAuthProvider: jest.fn(),
  Auth: jest.fn(),
}))

// Mock auth API
const mockAuthApiLogin = jest.fn()
jest.mock('@/lib/api/auth', () => ({
  authApi: {
    login: (...args: any[]) => mockAuthApiLogin(...args),
  },
}))

// Mock Firebase config
jest.mock('@/lib/firebase/config', () => ({
  initFirebase: jest.fn(() => ({
    auth: {
      currentUser: null,
    },
  })),
}))

describe('LoginPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock router
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders login form', () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    render(<LoginPage />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('renders register link', () => {
    render(<LoginPage />)

    const registerLink = screen.getByText('Register')
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('updates email and password fields on input', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('displays loading state during login', async () => {
    const user = userEvent.setup()

    // Mock a delayed login response
    mockSignInWithEmailAndPassword.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(loginButton)

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  it('shows error message on login failure', async () => {
    const user = userEvent.setup()

    mockSignInWithEmailAndPassword.mockRejectedValue(
      new Error('Invalid credentials')
    )

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables submit button when loading', async () => {
    const user = userEvent.setup()

    mockSignInWithEmailAndPassword.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(loginButton).toBeDisabled()
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })
})
