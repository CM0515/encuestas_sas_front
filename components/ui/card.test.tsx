import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from './card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card with content', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies default styles', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg', 'border', 'shadow-sm')
    })

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })

    it('forwards ref correctly', () => {
      const ref = jest.fn()
      render(<Card ref={ref}>Content</Card>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('CardHeader', () => {
    it('renders header with content', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies default styles', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders title with content', () => {
      render(<CardTitle>Title content</CardTitle>)
      expect(screen.getByText('Title content')).toBeInTheDocument()
    })

    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title.tagName).toBe('H3')
    })

    it('applies default styles', () => {
      render(<CardTitle>Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none')
    })

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardContent', () => {
    it('renders content', () => {
      render(<CardContent>Body content</CardContent>)
      expect(screen.getByText('Body content')).toBeInTheDocument()
    })

    it('applies default styles', () => {
      render(<CardContent data-testid="content">Text</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Text</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('Card Composition', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
          <CardContent>Test Content</CardContent>
        </Card>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })
})
