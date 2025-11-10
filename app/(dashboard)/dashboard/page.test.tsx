import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from './page'

// Mock APIs
const mockGetMe = jest.fn()
const mockGetAllSurveys = jest.fn()
const mockDeleteSurvey = jest.fn()
const mockUpdateSurvey = jest.fn()

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    getMe: (...args: any[]) => mockGetMe(...args),
  },
}))

jest.mock('@/lib/api/surveys', () => ({
  surveysApi: {
    getAll: (...args: any[]) => mockGetAllSurveys(...args),
    delete: (...args: any[]) => mockDeleteSurvey(...args),
    update: (...args: any[]) => mockUpdateSurvey(...args),
  },
}))

// Mock Pusher hooks
jest.mock('@/lib/hooks/usePusher', () => ({
  useSurveyUpdates: jest.fn(),
  useSurveyCreated: jest.fn(),
  useSurveyDeleted: jest.fn(),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})

describe('DashboardPage', () => {
  const mockPush = jest.fn()
  const mockUser = {
    data: {
      id: 'user-1',
      uid: 'user-1',
      email: 'test@example.com',
      role: 'user',
    },
  }

  const mockSurveys = [
    {
      id: 'survey-1',
      title: 'Customer Satisfaction',
      description: 'Help us improve',
      isActive: true,
      responseCount: 10,
      createdBy: 'user-1',
      createdAt: '2024-01-15',
    },
    {
      id: 'survey-2',
      title: 'Employee Feedback',
      description: 'Annual review',
      isActive: false,
      responseCount: 5,
      createdBy: 'user-2',
      createdAt: '2024-01-10',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock router
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'fake-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Default mock responses
    mockGetMe.mockResolvedValue(mockUser)
    mockGetAllSurveys.mockResolvedValue({ data: mockSurveys })
    mockDeleteSurvey.mockResolvedValue({})
    mockUpdateSurvey.mockResolvedValue({})
  })

  it('renders dashboard with title', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('My Surveys')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects to login when no token', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
      },
      writable: true,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('loads and displays surveys', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument()
      expect(screen.getByText('Employee Feedback')).toBeInTheDocument()
    })
  })

  it('displays survey response counts', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/10 responses/i)).toBeInTheDocument()
      expect(screen.getByText(/5 responses/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no surveys', async () => {
    mockGetAllSurveys.mockResolvedValue({ data: [] })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/no surveys yet/i)).toBeInTheDocument()
    })
  })

  it('handles auth error and redirects to login', async () => {
    mockGetMe.mockRejectedValue({
      response: { status: 401 },
      message: 'Unauthorized',
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
