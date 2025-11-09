import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from './page'

// Mock Firebase auth functions
const mockCreateUserWithEmailAndPassword = jest.fn()
const mockSignInWithPopup = jest.fn()

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
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

describe('RegisterPage', () => {
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

  it('renders register form', () => {
    render(<RegisterPage />)

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('renders Google signup button', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('renders login link', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByText('Login')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('updates form fields on input', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText(/^Password$/i) as HTMLInputElement
    const confirmInput = screen.getByPlaceholderText(/confirm password/i) as HTMLInputElement

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
    expect(confirmInput.value).toBe('password123')
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText(/^Password$/i)
    const confirmInput = screen.getByPlaceholderText(/confirm password/i)
    const registerButton = screen.getByRole('button', { name: /register/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'differentpassword')
    await user.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
    })
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText(/^Password$/i)
    const confirmInput = screen.getByPlaceholderText(/confirm password/i)
    const registerButton = screen.getByRole('button', { name: /register/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '12345')
    await user.type(confirmInput, '12345')
    await user.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()
    })
  })

  it('disables button during registration', async () => {
    const user = userEvent.setup()

    mockCreateUserWithEmailAndPassword.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<RegisterPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText(/^Password$/i)
    const confirmInput = screen.getByPlaceholderText(/confirm password/i)
    const registerButton = screen.getByRole('button', { name: /register/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')
    await user.click(registerButton)

    await waitFor(() => {
      expect(registerButton).toBeDisabled()
    })
  })

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup()

    mockCreateUserWithEmailAndPassword.mockRejectedValue(
      new Error('Email already in use')
    )

    render(<RegisterPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText(/^Password$/i)
    const confirmInput = screen.getByPlaceholderText(/confirm password/i)
    const registerButton = screen.getByRole('button', { name: /register/i })

    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')
    await user.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
    })
  })

  it('validates required fields', () => {
    render(<RegisterPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText(/^Password$/i)
    const confirmInput = screen.getByPlaceholderText(/confirm password/i)

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(confirmInput).toBeRequired()
  })
})
