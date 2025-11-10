import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicSurveyPage from './page'

// Mock APIs
const mockGetSurvey = jest.fn()
const mockGetQuestions = jest.fn()
const mockSubmitResponse = jest.fn()

jest.mock('@/lib/api/surveys', () => ({
  surveysApi: {
    getById: (...args: any[]) => mockGetSurvey(...args),
    getPublic: (...args: any[]) => mockGetSurvey(...args),
  },
}))

jest.mock('@/lib/api/questions', () => ({
  questionsApi: {
    getBySurvey: (...args: any[]) => mockGetQuestions(...args),
  },
}))

jest.mock('@/lib/api/responses', () => ({
  responsesApi: {
    create: (...args: any[]) => mockSubmitResponse(...args),
  },
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('PublicSurveyPage', () => {
  const mockSurvey = {
    id: 'survey-123',
    title: 'Customer Survey',
    description: 'Your feedback matters',
    isActive: true,
    questions: [
      {
        id: 'q1',
        text: 'How satisfied are you?',
        type: 'TEXT',
        required: true,
        order: 0,
      },
      {
        id: 'q2',
        text: 'Rate us',
        type: 'SCALE',
        required: true,
        order: 1,
        min: 1,
        max: 5,
      },
      {
        id: 'q3',
        text: 'Choose option',
        type: 'MULTIPLE_CHOICE',
        required: false,
        order: 2,
        options: ['Option A', 'Option B'],
      },
      {
        id: 'q4',
        text: 'Recommend us?',
        type: 'YES_NO',
        required: true,
        order: 3,
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useParams
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({
      id: 'survey-123',
    })

    mockGetSurvey.mockResolvedValue({ data: mockSurvey })
    mockGetQuestions.mockResolvedValue({ data: mockSurvey.questions })
    mockSubmitResponse.mockResolvedValue({ data: { id: 'response-123' } })
  })

  it('renders survey title and description', async () => {
    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText('Customer Survey')).toBeInTheDocument()
      expect(screen.getByText('Your feedback matters')).toBeInTheDocument()
    })
  })

  it('displays all questions', async () => {
    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/How satisfied are you\?/)).toBeInTheDocument()
      expect(screen.getByText(/Rate us/)).toBeInTheDocument()
      expect(screen.getByText(/Choose option/)).toBeInTheDocument()
      expect(screen.getByText(/Recommend us\?/)).toBeInTheDocument()
    })
  })

  it('shows required indicators', async () => {
    render(<PublicSurveyPage />)

    await waitFor(() => {
      const requiredMarkers = screen.getAllByText('*')
      expect(requiredMarkers.length).toBeGreaterThan(0)
    })
  })

  it('shows loading state', () => {
    mockGetSurvey.mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<PublicSurveyPage />)
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('shows error when survey not found', async () => {
    mockGetSurvey.mockRejectedValueOnce(new Error('Not found'))

    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/encuesta no disponible/i)).toBeInTheDocument()
    })
  })

  it('shows error when survey is inactive', async () => {
    mockGetSurvey.mockResolvedValueOnce({
      data: { ...mockSurvey, isActive: false },
    })
    mockGetQuestions.mockResolvedValueOnce({ data: mockSurvey.questions })

    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/esta encuesta no está disponible en este momento/i)).toBeInTheDocument()
    })
  })

  it('allows text input', async () => {
    const user = userEvent.setup()
    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/How satisfied are you\?/)).toBeInTheDocument()
    })

    const textInputs = screen.getAllByRole('textbox')
    await user.type(textInputs[0], 'Very satisfied')

    expect((textInputs[0] as HTMLInputElement).value).toBe('Very satisfied')
  })

  it('allows radio selection', async () => {
    const user = userEvent.setup()
    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/Choose option/)).toBeInTheDocument()
    })

    const optionA = screen.getByRole('radio', { name: /option a/i })
    await user.click(optionA)

    expect(optionA).toBeChecked()
  })

  it('shows validation error for empty required fields', async () => {
    const user = userEvent.setup()
    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      )
    })
  })

  it('shows success message after submission', async () => {
    const user = userEvent.setup()
    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/How satisfied are you\?/)).toBeInTheDocument()
    })

    // Fill text field
    const textInputs = screen.getAllByRole('textbox')
    await user.type(textInputs[0], 'Great')

    // Select yes/no
    const yesOption = screen.getByRole('radio', { name: /sí/i })
    await user.click(yesOption)

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/¡gracias por tu respuesta!/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    mockSubmitResponse.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: { id: 'r1' } }), 100))
    )

    render(<PublicSurveyPage />)

    await waitFor(() => {
      expect(screen.getByText(/How satisfied are you\?/)).toBeInTheDocument()
    })

    const textInputs = screen.getAllByRole('textbox')
    await user.type(textInputs[0], 'Great')

    const yesOption = screen.getByRole('radio', { name: /sí/i })
    await user.click(yesOption)

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
})
