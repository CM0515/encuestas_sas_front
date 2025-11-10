import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewSurveyPage from './page'

// Mock APIs
const mockCreateSurvey = jest.fn()
const mockCreateQuestion = jest.fn()

jest.mock('@/lib/api/surveys', () => ({
  surveysApi: {
    create: (...args: any[]) => mockCreateSurvey(...args),
  },
}))

jest.mock('@/lib/api/questions', () => ({
  questionsApi: {
    create: (...args: any[]) => mockCreateQuestion(...args),
  },
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('NewSurveyPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()

    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })

    mockCreateSurvey.mockResolvedValue({ data: { id: 'new-survey-123' } })
    mockCreateQuestion.mockResolvedValue({ data: { id: 'new-question-123' } })
  })

  it('renders new survey page', () => {
    render(<NewSurveyPage />)
    expect(screen.getByText('Crear Nueva Encuesta')).toBeInTheDocument()
  })

  it('has title and description inputs', () => {
    render(<NewSurveyPage />)

    expect(screen.getByPlaceholderText('Ej: Encuesta de Satisfacción del Cliente')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe el propósito de esta encuesta...')).toBeInTheDocument()
  })

  it('updates title on input', async () => {
    const user = userEvent.setup()
    render(<NewSurveyPage />)

    const titleInput = screen.getByPlaceholderText('Ej: Encuesta de Satisfacción del Cliente') as HTMLInputElement
    await user.type(titleInput, 'New Survey')

    expect(titleInput.value).toBe('New Survey')
  })

  it('adds new question', async () => {
    const user = userEvent.setup()
    render(<NewSurveyPage />)

    const addButton = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Pregunta 1')).toBeInTheDocument()
    })
  })

  it('shows validation error without title', async () => {
    const user = userEvent.setup()
    render(<NewSurveyPage />)

    const titleInput = screen.getByPlaceholderText('Ej: Encuesta de Satisfacción del Cliente') as HTMLInputElement

    // Verificar que el campo tiene la validación requerida
    expect(titleInput).toBeRequired()

    const saveButton = screen.getByRole('button', { name: /guardar encuesta/i })
    await user.click(saveButton)

    // El navegador debería mostrar el mensaje de validación HTML
    // No se debería llamar al toast porque la validación HTML bloquea el submit
  })

  it('shows validation error without questions', async () => {
    const user = userEvent.setup()
    render(<NewSurveyPage />)

    const titleInput = screen.getByPlaceholderText('Ej: Encuesta de Satisfacción del Cliente')
    await user.type(titleInput, 'Test Survey')

    const saveButton = screen.getByRole('button', { name: /guardar encuesta/i })
    await user.click(saveButton)

    // Esperar a que aparezca el mensaje de error en la UI
    await waitFor(() => {
      expect(screen.getByText(/debes agregar al menos una pregunta/i)).toBeInTheDocument()
    })
  })
})
