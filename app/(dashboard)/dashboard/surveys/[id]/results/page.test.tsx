import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ResultsPage from './page'

// Mock APIs
const mockGetSurvey = jest.fn()
const mockGetAnalytics = jest.fn()

jest.mock('@/lib/api/surveys', () => ({
  surveysApi: {
    getOne: (...args: any[]) => mockGetSurvey(...args),
  },
}))

jest.mock('@/lib/api/questions', () => ({
  questionsApi: {
    getBySurvey: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/lib/api/responses', () => ({
  responsesApi: {
    getBySurvey: jest.fn(() => Promise.resolve({
      data: [
        {
          id: 'r1',
          answers: { 'q1': 'Response 1', 'q2': 4 },
          submittedAt: { _seconds: 1640000000 }
        },
        {
          id: 'r2',
          answers: { 'q1': 'Response 2', 'q2': 5 },
          submittedAt: { _seconds: 1640000100 }
        }
      ]
    })),
  },
}))

jest.mock('@/lib/api/analytics', () => ({
  analyticsApi: {
    getResults: (...args: any[]) => mockGetAnalytics(...args),
  },
}))

// Mock Pusher hooks
jest.mock('@/lib/hooks/usePusher', () => ({
  useSurveyResponses: jest.fn(() => {}),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('ResultsPage', () => {
  const mockPush = jest.fn()
  const mockSurvey = {
    id: 'survey-123',
    title: 'Customer Survey',
    description: 'Feedback',
    questions: [
      {
        id: 'q1',
        text: 'Question 1',
        type: 'TEXT',
        order: 0,
      },
      {
        id: 'q2',
        text: 'Question 2',
        type: 'SCALE',
        order: 1,
        min: 1,
        max: 5,
      },
    ],
  }

  const mockAnalytics = {
    totalResponses: 10,
    questions: {
      'q1': {
        questionId: 'q1',
        summary: {
          count: 10,
          samples: ['Response 1', 'Response 2'],
        },
      },
      'q2': {
        questionId: 'q2',
        summary: {
          average: 4.5,
          min: 3,
          max: 5,
          count: 10,
        },
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock router and params
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({
      id: 'survey-123',
    })

    mockGetSurvey.mockResolvedValue({ data: mockSurvey })
    mockGetAnalytics.mockResolvedValue({ data: mockAnalytics })
  })

  it('renders results page', async () => {
    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Customer Survey')).toBeInTheDocument()
    })
  })

  it('displays total responses', async () => {
    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Total de Respuestas')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('displays questions', async () => {
    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument()
      expect(screen.getByText('Question 2')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    mockGetSurvey.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<ResultsPage />)
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('shows error when survey not found', async () => {
    mockGetSurvey.mockRejectedValue(new Error('Not found'))

    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('shows no responses message', async () => {
    mockGetAnalytics.mockResolvedValue({
      data: {
        totalResponses: 0,
        questions: [],
      },
    })

    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText(/aún no hay respuestas/i)).toBeInTheDocument()
    })
  })

  it('displays text response samples', async () => {
    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument()
      expect(screen.getByText('Response 2')).toBeInTheDocument()
    })
  })

  it('displays scale statistics', async () => {
    render(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText(/promedio/i)).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })
  })
})
