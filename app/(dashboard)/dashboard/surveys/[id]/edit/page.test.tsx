import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditSurveyPage from './page'

// Mock APIs
const mockGetSurvey = jest.fn()
const mockUpdateSurvey = jest.fn()
const mockUpdateQuestion = jest.fn()

jest.mock('@/lib/api/surveys', () => ({
  surveysApi: {
    getById: (...args: any[]) => mockGetSurvey(...args),
    getOne: (...args: any[]) => mockGetSurvey(...args),
    update: (...args: any[]) => mockUpdateSurvey(...args),
  },
}))

const mockGetQuestions = jest.fn()

jest.mock('@/lib/api/questions', () => ({
  questionsApi: {
    getBySurvey: (...args: any[]) => mockGetQuestions(...args),
    update: (...args: any[]) => mockUpdateQuestion(...args),
    create: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock Pusher hooks
jest.mock('@/lib/hooks/usePusher', () => ({
  useSurveyUpdates: jest.fn(() => {}),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('EditSurveyPage', () => {
  const mockPush = jest.fn()
  const mockSurvey = {
    id: 'survey-123',
    title: 'Customer Survey',
    description: 'Feedback',
    active: true,
    questions: [
      {
        id: 'q1',
        text: 'Question 1',
        type: 'TEXT',
        required: true,
        order: 0,
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()

    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({
      id: 'survey-123',
    })

    mockGetSurvey.mockResolvedValue({ data: mockSurvey })
    mockGetQuestions.mockResolvedValue({ data: mockSurvey.questions })
    mockUpdateSurvey.mockResolvedValue({ data: mockSurvey })
  })

  it('renders edit page', async () => {
    render(<EditSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText('Editar Encuesta')).toBeInTheDocument()
    })
  })

  it('loads survey data', async () => {
    render(<EditSurveyPage />)

    await waitFor(() => {
      expect(mockGetSurvey).toHaveBeenCalledWith('survey-123')
      expect(screen.getByDisplayValue('Customer Survey')).toBeInTheDocument()
    })
  })

  it('displays questions', async () => {
    render(<EditSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText('Pregunta 1')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    mockGetSurvey.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<EditSurveyPage />)
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('shows error when survey not found', async () => {
    mockGetSurvey.mockRejectedValue(new Error('Not found'))

    render(<EditSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/encuesta no encontrada/i)).toBeInTheDocument()
    })
  })

  it('allows editing title', async () => {
    const user = userEvent.setup()
    render(<EditSurveyPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer Survey')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue('Customer Survey') as HTMLInputElement
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Survey')

    expect(titleInput.value).toBe('Updated Survey')
  })
})
