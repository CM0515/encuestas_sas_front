"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { surveysApi } from "@/lib/api/surveys";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, FileText, Settings, Trash2, Link2, Copy, Check } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useSurveyUpdates, useSurveyCreated, useSurveyDeleted } from "@/lib/hooks/usePusher";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null);
  const [copiedSurveyId, setCopiedSurveyId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar que hay un token antes de hacer la petición
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("token");
          if (!token) {
            console.warn("⚠️ No hay token, redirigiendo al login");
            router.push("/login");
            return;
          }
        }
        
        // Verificar autenticación
        const userData = await authApi.getMe();

        // Guardar información del usuario actual
        setCurrentUser(userData);
        
        // Cargar encuestas
        const surveysResponse = await surveysApi.getAll();
        
        // El backend devuelve { data: [...], timestamp: ..., path: ... }
        // Necesitamos extraer el array del campo 'data'
        let surveysArray: any[] = [];
        
        if (Array.isArray(surveysResponse)) {
          // Si la respuesta es directamente un array
          surveysArray = surveysResponse;
        } else if (surveysResponse?.data && Array.isArray(surveysResponse.data)) {
          // Si la respuesta tiene un campo 'data' que es un array
          surveysArray = surveysResponse.data;
        } else if (surveysResponse?.data?.data && Array.isArray(surveysResponse.data.data)) {
          // Caso anidado adicional
          surveysArray = surveysResponse.data.data;
        }
      
        setSurveys(surveysArray);
      } catch (error: any) {
        console.error("❌ Error loading dashboard:", error);
        console.error("Error details:", {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
        
        // Solo redirigir al login si es un error de autenticación (401 o 403)
        // No redirigir si es un error de conexión (backend no disponible)
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          console.warn("🚪 Error de autenticación, redirigiendo al login");
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            router.push("/login");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para verificar si el usuario puede eliminar una encuesta
  const canDeleteSurvey = (survey: any): boolean => {
    if (!currentUser) return false;
    // El usuario puede eliminar si:
    // 1. Es el creador de la encuesta
    // 2. O tiene rol de admin
    const isCreator = survey.createdBy === currentUser.data.uid || survey.createdBy === currentUser.data.id;
    const isAdmin = currentUser.data.role === "admin" || currentUser.data.role === "ADMIN";

    return isCreator || isAdmin;
  };

  // Función para eliminar una encuesta
  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      setDeletingSurveyId(surveyId);

      await surveysApi.delete(surveyId);

      // Actualizar la lista de encuestas eliminando la encuesta borrada
      setSurveys((prevSurveys) => prevSurveys.filter((s) => s.id !== surveyId));

    } catch (error: any) {
      console.error("❌ Error al eliminar encuesta:", error);
      alert(error?.response?.data?.message || "Error al eliminar la encuesta");
    } finally {
      setDeletingSurveyId(null);
    }
  };

  // Función para copiar el link público de la encuesta
  const handleCopyPublicLink = async (surveyId: string) => {
    const publicUrl = `${window.location.origin}/surveys/${surveyId}/public`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedSurveyId(surveyId);

      // Resetear el estado después de 2 segundos
      setTimeout(() => {
        setCopiedSurveyId(null);
      }, 2000);
    } catch (error) {
      console.error("Error al copiar el link:", error);
      alert("Error al copiar el link al portapapeles");
    }
  };

  // Función para cambiar el estado activo/inactivo de una encuesta
  const handleToggleActive = async (surveyId: string, currentStatus: boolean) => {
    try {
      setTogglingStatusId(surveyId);

      await surveysApi.update(surveyId, { isActive: !currentStatus });

      // Actualizar la encuesta en el estado local
      setSurveys((prevSurveys) =>
        prevSurveys.map((s) =>
          s.id === surveyId ? { ...s, isActive: !currentStatus } : s
        )
      );

      console.log(`✅ Encuesta ${!currentStatus ? "activada" : "desactivada"}`);
    } catch (error: any) {
      console.error("❌ Error al cambiar estado de encuesta:", error);
      alert(error?.response?.data?.message || "Error al cambiar el estado de la encuesta");
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Hooks de Pusher para actualizaciones en tiempo real
  useSurveyUpdates((data) => {
    console.log("📡 Encuesta actualizada:", data);
    setSurveys((prevSurveys) =>
      prevSurveys.map((s) => (s.id === data.id ? { ...s, ...data } : s))
    );
  });

  useSurveyCreated((data) => {
    console.log("📡 Nueva encuesta creada:", data);
    setSurveys((prevSurveys) => [...prevSurveys, data]);
  });

  useSurveyDeleted((data) => {
    console.log("📡 Encuesta eliminada:", data);
    setSurveys((prevSurveys) => prevSurveys.filter((s) => s.id !== data.id));
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">SurveyPro Dashboard</h1>
          <div className="space-x-4">
            <Link href="/dashboard/settings">
              <Button variant="ghost">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("token");
                  router.push("/login");
                }
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">My Surveys</h2>
          <Link href="/dashboard/surveys/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Button>
          </Link>
        </div>

        {surveys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No surveys yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first survey
              </p>
              <Link href="/dashboard/surveys/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Survey
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey: any) => (
              <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{survey.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {survey.description || "No description"}
                  </p>

                  {/* Stats y Toggle de estado */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      {survey.responseCount || 0} responses
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${survey.isActive ? "text-green-600" : "text-gray-500"}`}>
                        {survey.isActive ? "Activa" : "Inactiva"}
                      </span>
                      <Switch
                        checked={survey.isActive}
                        onCheckedChange={() => handleToggleActive(survey.id, survey.isActive)}
                        disabled={togglingStatusId === survey.id}
                      />
                    </div>
                  </div>

                  {/* Botón para copiar link público */}
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => handleCopyPublicLink(survey.id)}
                  >
                    {copiedSurveyId === survey.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-green-600">Link copiado!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Copiar link público
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/surveys/${survey.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/dashboard/surveys/${survey.id}/results`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Results
                      </Button>
                    </Link>
                  </div>

                  {/* Botón de eliminar con verificación de roles */}
                  {canDeleteSurvey(survey) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          disabled={deletingSurveyId === survey.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletingSurveyId === survey.id ? "Eliminando..." : "Eliminar"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la encuesta
                            &quot;{survey.title}&quot; y todas sus respuestas asociadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSurvey(survey.id)}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

