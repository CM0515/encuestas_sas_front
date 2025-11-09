import { renderHook, act } from '@testing-library/react'
import { useToast, toast } from './use-toast'

describe('useToast', () => {
  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test description',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Test Toast')
    expect(result.current.toasts[0].description).toBe('Test description')
  })

  it('adds toast with variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Success',
        variant: 'success',
      })
    })

    expect(result.current.toasts[0].variant).toBe('success')
  })

  it('adds toast with destructive variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Error',
        variant: 'destructive',
      })
    })

    expect(result.current.toasts[0].variant).toBe('destructive')
  })

  it('limits toasts to TOAST_LIMIT', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })

    // Based on TOAST_LIMIT = 1 from toaster.tsx
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 3')
  })

  it('dismisses a specific toast', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string

    act(() => {
      const { id } = result.current.toast({ title: 'Test' })
      toastId = id
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId)
    })

    // After dismiss, open should be false
    expect(result.current.toasts[0].open).toBe(false)
  })
})

describe('toast function', () => {
  it('can be called directly', () => {
    act(() => {
      const result = toast({
        title: 'Direct toast',
        description: 'Called directly',
      })

      expect(result.id).toBeDefined()
      expect(result.dismiss).toBeDefined()
      expect(result.update).toBeDefined()
    })
  })

  it('returns methods to control the toast', () => {
    let toastResult: ReturnType<typeof toast>

    act(() => {
      toastResult = toast({ title: 'Test' })
    })

    expect(typeof toastResult.dismiss).toBe('function')
    expect(typeof toastResult.update).toBe('function')
    expect(typeof toastResult.id).toBe('string')
  })
})
