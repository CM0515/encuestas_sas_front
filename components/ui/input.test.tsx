import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('accepts text input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello World')

    expect(input).toHaveValue('Hello World')
  })

  it('handles onChange event', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(<Input onChange={handleChange} placeholder="Type here" />)
    const input = screen.getByPlaceholderText('Type here')

    await user.type(input, 'test')

    expect(handleChange).toHaveBeenCalled()
  })

  it('renders with different types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text')

    rerender(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
  })

  it('applies default styles', () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('displays placeholder text', () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
  })

  it('accepts default value', () => {
    render(<Input defaultValue="Default text" data-testid="input" />)
    const input = screen.getByTestId('input') as HTMLInputElement
    expect(input.value).toBe('Default text')
  })

  it('can be controlled with value prop', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled"
        />
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)

    const input = screen.getByPlaceholderText('Controlled')
    await user.type(input, 'controlled text')

    expect(input).toHaveValue('controlled text')
  })
})
