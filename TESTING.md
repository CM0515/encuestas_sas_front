# Testing Documentation

Este proyecto incluye **111 pruebas unitarias** configuradas con Jest y React Testing Library.

## Configuración

Las pruebas están configuradas con:

- **Jest**: Framework de testing
- **React Testing Library**: Para testing de componentes React
- **@testing-library/jest-dom**: Matchers personalizados para Jest
- **@testing-library/user-event**: Para simular interacciones del usuario

## Ejecutar las Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## Estructura de las Pruebas

Las pruebas están organizadas junto a los archivos que prueban:

```
components/ui/
├── button.tsx
├── button.test.tsx
├── card.tsx
├── card.test.tsx
├── input.tsx
└── input.test.tsx

lib/
├── utils.ts
└── utils.test.ts

hooks/
├── use-toast.ts
└── use-toast.test.ts

app/(dashboard)/dashboard/surveys/
├── survey-form.test.tsx

app/(auth)/
├── login/page.test.tsx
└── register/page.test.tsx

__tests__/pages/
└── page-rendering.test.tsx
```

## Archivos de Configuración

### jest.config.js

Configuración principal de Jest con soporte para Next.js:
- Usa `next/jest` para configuración automática
- Mapea aliases de paths (@/)
- Define patrones de cobertura

### jest.setup.js

Configuración inicial que se ejecuta antes de cada prueba:
- Importa `@testing-library/jest-dom` para matchers adicionales
- Mock de Next.js router (`next/navigation`)
- Mock de Firebase Auth y Firestore
- Mock de Axios para llamadas API
- Mock de Pusher para real-time updates
- Mock de Recharts para visualización de datos

## Pruebas Existentes

### Componentes UI

#### Button Component ([button.test.tsx](components/ui/button.test.tsx))
- ✅ Renderizado con texto
- ✅ Manejo de eventos click
- ✅ Variantes de estilo (default, destructive, outline, secondary, ghost, link)
- ✅ Tamaños (default, sm, lg, icon)
- ✅ Estado deshabilitado
- ✅ Clases personalizadas
- ✅ Forwarding de refs

#### Card Component ([card.test.tsx](components/ui/card.test.tsx))
- ✅ Card: renderizado, estilos, clases personalizadas
- ✅ CardHeader: renderizado y estilos
- ✅ CardTitle: renderizado como h3, estilos
- ✅ CardContent: renderizado y estilos
- ✅ Composición completa de Card

#### Input Component ([input.test.tsx](components/ui/input.test.tsx))
- ✅ Renderizado del input
- ✅ Entrada de texto del usuario
- ✅ Eventos onChange
- ✅ Diferentes tipos (text, email, password)
- ✅ Estado deshabilitado
- ✅ Placeholder
- ✅ Valores por defecto
- ✅ Inputs controlados

### Páginas de Autenticación

#### Login Page ([login/page.test.tsx](app/(auth)/login/page.test.tsx))
- ✅ Renderizado del formulario de login
- ✅ Botón de login con Google
- ✅ Link de registro
- ✅ Actualización de campos email y password
- ✅ Estado de carga durante login
- ✅ Mensajes de error en login fallido
- ✅ Deshabilitación de botón durante carga
- ✅ Validación de campos requeridos

#### Register Page ([register/page.test.tsx](app/(auth)/register/page.test.tsx))
- ✅ Renderizado del formulario de registro
- ✅ Botón de registro con Google
- ✅ Link de login
- ✅ Actualización de campos del formulario
- ✅ Validación de contraseñas no coinciden
- ✅ Validación de longitud mínima de contraseña
- ✅ Deshabilitación de botón durante registro
- ✅ Mensajes de error en registro fallido
- ✅ Validación de campos requeridos

### Hooks

#### useToast Hook ([use-toast.test.ts](hooks/use-toast.test.ts))
- ✅ Inicialización con array vacío
- ✅ Agregar toasts
- ✅ Variantes (success, destructive)
- ✅ Límite de toasts
- ✅ Descartar toasts específicos
- ✅ Función toast standalone

### Utilidades

#### Utils ([utils.test.ts](lib/utils.test.ts))
- ✅ Función `cn`: merge de clases, clases condicionales, merge de Tailwind
- ✅ Función `formatDate`: formateo de Date object, strings, timestamps

### Validación de Formularios

#### Survey Form Validation ([survey-form.test.tsx](app/(dashboard)/dashboard/surveys/survey-form.test.tsx))
- ✅ Validación de título de encuesta
- ✅ Validación de preguntas (texto, tipo, opciones)
- ✅ Validación de preguntas de escala (min/max)
- ✅ Validación de envío de encuesta
- ✅ Validación de respuestas (requeridas, selección múltiple, escala, yes/no)

### Pruebas de Estructura de Aplicación

#### Page Structure Tests ([__tests__/pages/page-rendering.test.tsx](__tests__/pages/page-rendering.test.tsx))
- ✅ Estructura de rutas del dashboard
- ✅ Rutas de encuestas públicas
- ✅ Rutas de autenticación
- ✅ Disponibilidad de componentes UI
- ✅ Configuración de clientes API
- ✅ Definiciones de tipos (QuestionType, Survey, Question)
- ✅ Archivos de configuración (Jest, Next.js, TypeScript, Tailwind)
- ✅ Dependencias de paquetes (testing, UI, utilidades)
- ✅ Validación de reglas de negocio (título, contraseña, escala, toasts)

## Escribir Nuevas Pruebas

### Ejemplo de Prueba de Componente

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MiComponente } from './mi-componente'

describe('MiComponente', () => {
  it('renderiza correctamente', () => {
    render(<MiComponente />)
    expect(screen.getByText('Texto esperado')).toBeInTheDocument()
  })

  it('maneja click del usuario', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()

    render(<MiComponente onClick={handleClick} />)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Ejemplo de Prueba de Hook

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMiHook } from './use-mi-hook'

describe('useMiHook', () => {
  it('devuelve el valor inicial', () => {
    const { result } = renderHook(() => useMiHook())
    expect(result.current.value).toBe(initialValue)
  })

  it('actualiza el valor', () => {
    const { result } = renderHook(() => useMiHook())

    act(() => {
      result.current.setValue(newValue)
    })

    expect(result.current.value).toBe(newValue)
  })
})
```

## Mocks Disponibles

Los siguientes mocks están disponibles globalmente a través de `jest.setup.js`:

### Next.js Router
```typescript
const router = useRouter()
router.push('/path') // Mockeado
```

### Firebase
```typescript
import { auth } from '@/lib/firebase/config'
auth.currentUser // Mockeado
auth.signOut() // Mockeado
```

### Axios
```typescript
import axios from 'axios'
const client = axios.create() // Mockeado con interceptors
```

## Mejores Prácticas

1. **Nombres descriptivos**: Usa descripciones claras en `describe` e `it`
2. **Arrange-Act-Assert**: Organiza tus pruebas en estas tres fases
3. **Testing Library queries**: Usa queries que se asemejen a cómo los usuarios interactúan
   - Preferir: `getByRole`, `getByLabelText`, `getByPlaceholderText`
   - Evitar: `getByTestId` (solo cuando sea necesario)
4. **User Events**: Usa `@testing-library/user-event` en lugar de `fireEvent`
5. **Async**: Usa `waitFor` para operaciones asíncronas
6. **Cleanup**: No necesitas cleanup manual, Testing Library lo hace automáticamente

## Cobertura de Código

Para ver el reporte de cobertura:

```bash
npm run test:coverage
```

Esto generará un reporte en la carpeta `coverage/` con un archivo HTML que puedes abrir en el navegador.

## Problemas Comunes

### "React is not defined"
Importa React en tus archivos de prueba:
```typescript
import React from 'react'
```

### "act() warnings"
Envuelve actualizaciones de estado en `act()` o usa `waitFor()`:
```typescript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument()
})
```

### Mocks no funcionan
Asegúrate de que los mocks estén antes de los imports:
```typescript
jest.mock('@/lib/api', () => ({...}))
import { MyComponent } from './MyComponent'
```

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event](https://testing-library.com/docs/user-event/intro)
