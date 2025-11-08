# 🎨 Survey SaaS - Frontend (Next.js 14)

## 📦 Lo Que Está Incluido

Este paquete contiene la base completa del frontend con:

✅ **Configuración Completa**
- Next.js 14 con App Router
- TypeScript configurado
- Tailwind CSS + PostCSS
- ESLint y Prettier
- Estructura de carpetas profesional

✅ **Sistema de Tipos**
- Types completos para Survey, Question, Response
- Interfaces para Analytics
- Enums para QuestionType

✅ **API Client**
- Axios configurado con interceptors
- Endpoints para todos los módulos:
  - Auth
  - Surveys
  - Questions
  - Responses
  - Analytics

✅ **Firebase Integration**
- Firebase configurado
- Auth setup

✅ **Pusher Integration (Real-time)**
- Configuración de Pusher
- Hooks personalizados para eventos en tiempo real
- Actualizaciones automáticas del dashboard
- Documentación completa en [PUSHER_SETUP.md](PUSHER_SETUP.md)

✅ **Componentes UI Base**
- Button
- Card
- Input
- Switch
- Alert Dialog
- Toaster
- Utils (cn helper)

✅ **Páginas Completas**
- Home page (landing)
- Login / Register
- Dashboard con gestión de encuestas
- Crear / Editar encuestas
- Layout principal

✅ **Funcionalidades Avanzadas**
- Eliminar encuestas con verificación de roles (admin/creador)
- Copiar link público de encuestas
- Toggle para activar/desactivar encuestas
- Actualizaciones en tiempo real con Pusher
- Manejo completo de errores y estados de carga

## 🚀 Instalación y Setup

### 1. Extraer el proyecto
```bash
tar -xzf frontend-complete.tar.gz
cd frontend
```

### 2. Instalar dependencias
```bash
npm install
# o
pnpm install
# o
yarn install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Edita `.env.local`:
```env
# API (apunta a tu backend)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Firebase (de tu proyecto Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secret-random

# Pusher (para real-time)
NEXT_PUBLIC_PUSHER_KEY=tu-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

### 4. Iniciar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Grupo de rutas de autenticación
│   │   ├── login/               # Página de login
│   │   └── register/            # Página de registro
│   ├── (public)/                # Grupo de rutas públicas
│   │   └── survey/[id]/         # Vista pública de encuesta
│   ├── (dashboard)/             # Grupo de rutas del dashboard
│   │   └── dashboard/
│   │       ├── surveys/         # Gestión de encuestas
│   │       │   ├── new/         # Crear encuesta
│   │       │   └── [id]/
│   │       │       ├── edit/    # Editar encuesta
│   │       │       └── results/ # Ver resultados
│   │       └── settings/        # Configuración
│   ├── api/                     # API Routes
│   │   └── auth/                # NextAuth endpoints
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Home page
│
├── components/
│   ├── ui/                      # Componentes de shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/                  # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── auth/                    # Componentes de auth
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── surveys/                 # Componentes de encuestas
│   │   ├── SurveyCard.tsx
│   │   ├── SurveyList.tsx
│   │   └── SurveyForm.tsx
│   ├── questions/               # Componentes de preguntas
│   │   ├── QuestionBuilder.tsx
│   │   └── QuestionList.tsx
│   └── analytics/               # Componentes de analytics
│       ├── RealtimeChart.tsx
│       └── StatsCard.tsx
│
├── lib/
│   ├── api/                     # Cliente API
│   │   ├── client.ts           # Axios instance
│   │   ├── surveys.ts          # Surveys API
│   │   ├── questions.ts        # Questions API
│   │   ├── responses.ts        # Responses API
│   │   ├── analytics.ts        # Analytics API
│   │   └── auth.ts             # Auth API
│   ├── firebase/                # Firebase setup
│   │   └── config.ts
│   ├── hooks/                   # Custom hooks
│   ├── stores/                  # Zustand stores (si usas)
│   └── utils.ts                 # Utilidades
│
├── types/
│   └── index.ts                 # TypeScript types
│
├── public/                      # Assets estáticos
│
└── Configuration files:
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── postcss.config.js
    └── .env.example
```

## 🎨 Completar los Componentes UI

La base ya tiene Button, Card, e Input. Para agregar más componentes de shadcn/ui:

### Método Recomendado: CLI de shadcn/ui

```bash
# Instalar CLI de shadcn/ui
npx shadcn-ui@latest init

# Agregar componentes individuales
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
```

Los componentes se agregarán automáticamente a `components/ui/`

## 📄 Páginas a Implementar

### 1. Autenticación

#### `app/(auth)/login/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Exchange for JWT
      const { data } = await authApi.login(idToken);
      localStorage.setItem("token", data.accessToken);

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();

      const { data } = await authApi.login(idToken);
      localStorage.setItem("token", data.accessToken);

      router.push("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to SurveyPro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>

          <div className="mt-4">
            <Button variant="outline" onClick={handleGoogleLogin} className="w-full">
              Continue with Google
            </Button>
          </div>

          <p className="text-center mt-4 text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-purple-600 hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Dashboard Principal

#### `app/(dashboard)/dashboard/page.tsx`
```typescript
"use client";

import { useEffect, useState } from "react";
import { surveysApi } from "@/lib/api/surveys";
import { Survey } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, FileText } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const { data } = await surveysApi.getAll();
      setSurveys(data);
    } catch (error) {
      console.error("Error loading surveys:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: surveys.length,
    active: surveys.filter(s => s.isActive).length,
    totalResponses: surveys.reduce((acc, s) => acc + s.responseCount, 0),
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/dashboard/surveys/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Survey
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalResponses}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : surveys.length === 0 ? (
            <p className="text-gray-500">No surveys yet. Create your first one!</p>
          ) : (
            <div className="space-y-4">
              {surveys.slice(0, 5).map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{survey.title}</h3>
                    <p className="text-sm text-gray-500">{survey.responseCount} responses</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/surveys/${survey.id}/results`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/surveys/${survey.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Vista Pública de Encuesta

#### `app/(public)/survey/[id]/page.tsx`
```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { surveysApi } from "@/lib/api/surveys";
import { questionsApi } from "@/lib/api/questions";
import { responsesApi } from "@/lib/api/responses";
import { Survey, Question } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PublicSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async () => {
    try {
      const [surveyRes, questionsRes] = await Promise.all([
        surveysApi.getPublic(surveyId),
        questionsApi.getBySurvey(surveyId),
      ]);

      setSurvey(surveyRes.data);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error("Error loading survey:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await responsesApi.submit({
        surveyId,
        answers,
      });

      alert("Thank you for your response!");
      router.push("/");
    } catch (error: any) {
      console.error("Error submitting response:", error);
      alert(error.response?.data?.message || "Error submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!survey) {
    return <div className="p-8">Survey not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{survey.title}</CardTitle>
            {survey.description && (
              <p className="text-gray-600 mt-2">{survey.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <label className="font-medium">
                    {index + 1}. {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {question.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {question.options?.map((option) => (
                        <label key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            onChange={(e) =>
                              setAnswers({ ...answers, [question.id]: e.target.value })
                            }
                            required={question.required}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === "text" && (
                    <Input
                      type="text"
                      onChange={(e) =>
                        setAnswers({ ...answers, [question.id]: e.target.value })
                      }
                      required={question.required}
                    />
                  )}

                  {question.type === "scale" && (
                    <div className="flex items-center space-x-4">
                      <span>{question.validation?.min}</span>
                      <input
                        type="range"
                        min={question.validation?.min}
                        max={question.validation?.max}
                        onChange={(e) =>
                          setAnswers({ ...answers, [question.id]: parseInt(e.target.value) })
                        }
                        required={question.required}
                        className="flex-1"
                      />
                      <span>{question.validation?.max}</span>
                      <span className="font-bold">{answers[question.id] || question.validation?.min}</span>
                    </div>
                  )}

                  {question.type === "date" && (
                    <Input
                      type="date"
                      onChange={(e) =>
                        setAnswers({ ...answers, [question.id]: e.target.value })
                      }
                      required={question.required}
                    />
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Response"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## 🔌 Integración con Pusher (Real-time)

### Configuración Rápida

1. **Agregar variables de entorno en `.env.local`:**
```env
NEXT_PUBLIC_PUSHER_KEY=tu-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

2. **Uso de Hooks Personalizados:**

```typescript
import { useSurveyUpdates, useSurveyCreated, useSurveyDeleted } from "@/lib/hooks/usePusher";

function DashboardComponent() {
  // Escuchar actualizaciones de encuestas
  useSurveyUpdates((data) => {
    console.log("Encuesta actualizada:", data);
    // Actualizar estado
  });

  // Escuchar nuevas encuestas
  useSurveyCreated((data) => {
    console.log("Nueva encuesta:", data);
  });

  // Escuchar encuestas eliminadas
  useSurveyDeleted((data) => {
    console.log("Encuesta eliminada:", data);
  });

  return <div>Dashboard</div>;
}
```

3. **Para respuestas en tiempo real:**

```typescript
import { useSurveyResponses } from "@/lib/hooks/usePusher";

function SurveyResults({ surveyId }: { surveyId: string }) {
  useSurveyResponses(surveyId, (data) => {
    console.log("Nueva respuesta recibida:", data);
    // Actualizar gráficos y estadísticas
  });

  return <div>Resultados</div>;
}
```

### Documentación Completa

Para más detalles sobre configuración, eventos disponibles y troubleshooting, consulta [PUSHER_SETUP.md](PUSHER_SETUP.md)

## ✨ Funcionalidades Implementadas del Dashboard

### 1. Gestión de Encuestas con Roles

El sistema incluye verificación de permisos basada en roles para todas las operaciones:

**Roles soportados:**
- `admin` / `ADMIN`: Puede eliminar cualquier encuesta
- `creator`: Solo puede eliminar sus propias encuestas

```typescript
// Verificación automática en el dashboard
const canDeleteSurvey = (survey: any): boolean => {
  if (!currentUser) return false;

  const isCreator = survey.createdBy === currentUser.data.uid ||
                    survey.createdBy === currentUser.data.id;
  const isAdmin = currentUser.data.role === "admin" ||
                  currentUser.data.role === "ADMIN";

  return isCreator || isAdmin;
};
```

### 2. Copiar Link Público

Cada encuesta tiene un botón para copiar su link público al portapapeles:

- Click en "Copiar link público"
- El link se copia automáticamente
- Feedback visual con checkmark verde
- Link formato: `https://tu-dominio.com/surveys/{surveyId}/public`

### 3. Toggle de Activación/Desactivación

Control en tiempo real del estado de las encuestas:

- **Switch toggle** visual para cada encuesta
- Cambio inmediato del estado `isActive`
- Actualización automática en el backend
- Indicador visual del estado (Activa/Inactiva)
- Estado de loading durante el cambio

**Comportamiento:**
- ✅ Encuesta activa → Usuarios pueden responder
- ❌ Encuesta inactiva → No acepta nuevas respuestas

### 4. Eliminación Segura

Sistema de eliminación con múltiples capas de seguridad:

- **Modal de confirmación** antes de eliminar
- Mensaje claro sobre la acción irreversible
- Botón rojo para acciones destructivas
- Deshabilitado durante la operación
- Solo visible para usuarios autorizados

### 5. Actualizaciones en Tiempo Real

Gracias a Pusher, el dashboard se actualiza automáticamente cuando:

- Otro usuario crea una encuesta
- Alguien actualiza una encuesta
- Se elimina una encuesta
- Llegan nuevas respuestas

**Sin necesidad de recargar la página!**

## 📊 Gráficos con Recharts

```bash
npm install recharts
```

```typescript
// components/analytics/BarChartComponent.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export function BarChartComponent({ data }: { data: any[] }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
  );
}
```

## 🚀 Deploy en Vercel

### Método 1: CLI
```bash
npm i -g vercel
vercel
```

### Método 2: GitHub
1. Push a GitHub
2. Importar en Vercel
3. Configurar variables de entorno
4. Deploy automático

## ✅ Checklist de Implementación

### Páginas Principales
- [ ] Home page (landing) ✅
- [ ] Login/Register
- [ ] Dashboard principal
- [ ] Crear encuesta
- [ ] Editar encuesta
- [ ] Ver resultados
- [ ] Vista pública de encuesta

### Componentes
- [ ] UI Components (shadcn/ui)
- [ ] Layout (Header, Sidebar)
- [ ] SurveyCard
- [ ] SurveyForm
- [ ] QuestionBuilder
- [ ] AnalyticsDashboard
- [ ] Charts (Recharts)

### Funcionalidades
- [ ] Autenticación con Firebase
- [ ] CRUD de encuestas
- [ ] CRUD de preguntas
- [ ] Enviar respuestas
- [ ] Ver analytics
- [ ] Real-time con Pusher
- [ ] Exportar CSV

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Recharts](https://recharts.org/en-US/)
- [Pusher](https://pusher.com/docs)

## 🆘 Troubleshooting

### Error: Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase Auth Error
- Verifica las variables de entorno
- Asegúrate de habilitar los métodos de auth en Firebase Console

### API Connection Error
- Verifica que el backend esté corriendo
- Verifica NEXT_PUBLIC_API_URL en .env.local

---

**¡Listo para construir! 🚀**
