# Configuración de Pusher - Actualizaciones en Tiempo Real

Este documento explica cómo configurar Pusher para habilitar las actualizaciones en tiempo real en la aplicación SurveyPro.

## ¿Qué es Pusher?

Pusher es un servicio que permite agregar funcionalidad de tiempo real a las aplicaciones web mediante WebSockets. En SurveyPro, se utiliza para:

- **Actualizar encuestas en tiempo real** cuando alguien las modifica
- **Recibir notificaciones** cuando se crea una nueva encuesta
- **Actualizar automáticamente** cuando se elimina una encuesta
- **Mostrar respuestas en vivo** mientras los usuarios responden encuestas

## Configuración del Frontend

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=tu-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

**Nota:** Estas variables ya están pre-configuradas en `.env.example`.

### 2. Obtener las Credenciales de Pusher

1. Ve a [https://pusher.com/](https://pusher.com/) y crea una cuenta gratuita
2. Crea una nueva "Channel" app
3. Selecciona el cluster más cercano a tu ubicación (ej: `us2`, `eu`, `ap1`)
4. En la sección "App Keys", encontrarás:
   - **app_id**: Necesario para el backend
   - **key**: Esta es tu `NEXT_PUBLIC_PUSHER_KEY`
   - **secret**: Necesario para el backend
   - **cluster**: Esta es tu `NEXT_PUBLIC_PUSHER_CLUSTER`

### 3. Archivos Creados

La implementación de Pusher incluye los siguientes archivos:

#### `lib/pusher/config.ts`
Configuración e inicialización de Pusher:
- Singleton para mantener una única instancia
- Autenticación con JWT token
- Manejo de conexión/desconexión
- Logging en modo desarrollo

#### `lib/hooks/usePusher.ts`
Hooks personalizados para React:
- `usePusher`: Hook genérico para suscribirse a eventos
- `useSurveyUpdates`: Escucha actualizaciones de encuestas
- `useSurveyCreated`: Escucha cuando se crean encuestas
- `useSurveyDeleted`: Escucha cuando se eliminan encuestas
- `useSurveyResponses`: Escucha respuestas de una encuesta específica

## Uso en Componentes

### Ejemplo Básico

```typescript
import { useSurveyUpdates } from "@/lib/hooks/usePusher";

function MyComponent() {
  useSurveyUpdates((data) => {
    console.log("Encuesta actualizada:", data);
    // Actualizar el estado del componente
  });

  return <div>Mi Componente</div>;
}
```

### Ejemplo en el Dashboard

```typescript
// Escuchar actualizaciones de encuestas
useSurveyUpdates((data) => {
  setSurveys((prevSurveys) =>
    prevSurveys.map((s) => (s.id === data.id ? { ...s, ...data } : s))
  );
});

// Escuchar nuevas encuestas
useSurveyCreated((data) => {
  setSurveys((prevSurveys) => [...prevSurveys, data]);
});

// Escuchar encuestas eliminadas
useSurveyDeleted((data) => {
  setSurveys((prevSurveys) => prevSurveys.filter((s) => s.id !== data.id));
});
```

## Eventos Disponibles

### Canal: `surveys`

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `survey-created` | Se crea una nueva encuesta | `{ id, title, description, ... }` |
| `survey-updated` | Se actualiza una encuesta | `{ id, title, isActive, ... }` |
| `survey-deleted` | Se elimina una encuesta | `{ id }` |

### Canal: `survey-{surveyId}`

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `new-response` | Nueva respuesta a la encuesta | `{ surveyId, responseId, ... }` |

## Configuración del Backend

El backend debe emitir eventos de Pusher cuando ocurran cambios. Ejemplo con NestJS:

```typescript
import * as Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Cuando se actualiza una encuesta
pusher.trigger('surveys', 'survey-updated', {
  id: survey.id,
  title: survey.title,
  isActive: survey.isActive,
  // ... otros campos
});

// Cuando se crea una encuesta
pusher.trigger('surveys', 'survey-created', survey);

// Cuando se elimina una encuesta
pusher.trigger('surveys', 'survey-deleted', { id: surveyId });
```

## Autenticación de Canales Privados

Si necesitas canales privados (recomendado para producción), el backend debe proporcionar un endpoint de autenticación:

```typescript
// Backend: /api/pusher/auth
@Post('pusher/auth')
async authenticatePusher(@Req() req, @Body() body) {
  const socketId = body.socket_id;
  const channel = body.channel_name;

  // Verificar que el usuario está autenticado
  const user = req.user;

  const auth = pusher.authenticate(socketId, channel, {
    user_id: user.id,
    user_info: {
      name: user.name,
      email: user.email,
    },
  });

  return auth;
}
```

## Desactivar Pusher

Si no quieres usar Pusher temporalmente, simplemente no configures las variables de entorno. La aplicación funcionará normalmente sin actualizaciones en tiempo real.

## Solución de Problemas

### No se reciben actualizaciones en tiempo real

1. Verifica que las variables de entorno estén correctamente configuradas
2. Abre la consola del navegador y busca logs de Pusher
3. Verifica que el backend esté emitiendo eventos correctamente
4. Comprueba que el cluster sea el correcto

### Error de autenticación

1. Verifica que el token JWT sea válido
2. Asegúrate de que el endpoint `/api/pusher/auth` del backend esté funcionando
3. Comprueba que el token se esté enviando correctamente en los headers

### Conexión lenta o inestable

1. Verifica que estés usando el cluster más cercano a tu ubicación
2. Comprueba tu conexión a internet
3. Revisa los límites de tu plan de Pusher (plan gratuito: 200k mensajes/día)

## Plan Gratuito de Pusher

El plan gratuito de Pusher incluye:
- 200,000 mensajes por día
- 100 conexiones simultáneas
- Canales ilimitados
- Perfecto para desarrollo y aplicaciones pequeñas

## Recursos Adicionales

- [Documentación oficial de Pusher](https://pusher.com/docs)
- [Pusher Channels Dashboard](https://dashboard.pusher.com/)
- [Guía de React con Pusher](https://pusher.com/docs/channels/getting_started/javascript/)
