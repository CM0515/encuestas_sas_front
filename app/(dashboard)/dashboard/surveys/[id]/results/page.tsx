"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { surveysApi } from "@/lib/api/surveys";
import { questionsApi } from "@/lib/api/questions";
import { responsesApi } from "@/lib/api/responses";
import { analyticsApi } from "@/lib/api/analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useSurveyResponses } from "@/lib/hooks/usePusher";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { QuestionType } from "@/types";

const COLORS = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function SurveyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [analyticsSource, setAnalyticsSource] = useState<'backend' | 'local'>('local');

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [surveyResponse, questionsResponse, responsesResponse, analyticsResponse] = await Promise.all([
        surveysApi.getOne(surveyId),
        questionsApi.getBySurvey(surveyId),
        responsesApi.getBySurvey(surveyId),
        analyticsApi.getResults(surveyId).catch((err) => {
          console.warn("Analytics service not available, calculating locally:", err);
          return null;
        }),
      ]);

      // Manejar diferentes formatos de respuesta
      let surveyObj: any = null;
      if (surveyResponse) {
        if ((surveyResponse as any)?.data && !Array.isArray((surveyResponse as any).data)) {
          surveyObj = (surveyResponse as any).data;
        } else if ((surveyResponse as any)?.data?.data) {
          surveyObj = (surveyResponse as any).data.data;
        } else {
          surveyObj = surveyResponse;
        }
      }

      let questionsArray: any[] = [];
      if (questionsResponse) {
        if (Array.isArray(questionsResponse)) {
          questionsArray = questionsResponse;
        } else if ((questionsResponse as any)?.data) {
          questionsArray = (questionsResponse as any).data;
        }
      }

      let responsesArray: any[] = [];
      if (responsesResponse) {
        if (Array.isArray(responsesResponse)) {
          responsesArray = responsesResponse;
        } else if ((responsesResponse as any)?.data) {
          responsesArray = (responsesResponse as any).data;
        }
      }

      setSurvey(surveyObj);
      setQuestions(questionsArray.sort((a, b) => a.order - b.order));
      console.log("Loaded responses:", responsesArray);
      setResponses(responsesArray);

      // Usar analytics del backend si está disponible, sino calcular localmente
      if (analyticsResponse && analyticsResponse.data) {
        console.log("📊 Using backend analytics:", analyticsResponse.data);
        setAnalytics(analyticsResponse.data);
        setAnalyticsSource('backend');
      } else {
        console.log("📊 Calculating analytics locally");
        calculateAnalytics(questionsArray, responsesArray);
        setAnalyticsSource('local');
      }
    } catch (error: any) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateAnalytics = (questionsList: any[], responsesList: any[]) => {
    const analyticsData: any = {
      totalResponses: responsesList.length,
      questions: {},
    };

    questionsList.forEach((question) => {
      const questionAnalytics: any = {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        responses: [],
        summary: {},
      };

      // Extraer respuestas para esta pregunta
      const answers = responsesList
        .map((response) => response.answers?.[question.id])
        .filter((answer) => answer !== undefined && answer !== null && answer !== "");

      questionAnalytics.responses = answers;

      // Calcular resumen según el tipo de pregunta
      if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.YES_NO) {
        const counts: Record<string, number> = {};
        answers.forEach((answer) => {
          counts[answer] = (counts[answer] || 0) + 1;
        });
        questionAnalytics.summary = counts;
      } else if (question.type === QuestionType.MULTIPLE_SELECTION) {
        // Para selección múltiple, las respuestas pueden ser arrays o strings separados por coma
        const counts: Record<string, number> = {};
        answers.forEach((answer) => {
          let options: string[] = [];
          if (Array.isArray(answer)) {
            options = answer;
          } else if (typeof answer === 'string') {
            options = answer.split(',').map(opt => opt.trim());
          }

          options.forEach((option) => {
            if (option) {
              counts[option] = (counts[option] || 0) + 1;
            }
          });
        });
        questionAnalytics.summary = counts;
      } else if (question.type === QuestionType.SCALE) {
        const numericAnswers = answers.map(Number).filter((n) => !isNaN(n));
        const avg = numericAnswers.length
          ? numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length
          : 0;
        questionAnalytics.summary = {
          average: avg.toFixed(2),
          min: Math.min(...numericAnswers),
          max: Math.max(...numericAnswers),
          count: numericAnswers.length,
        };
      } else {
        // TEXT o DATE
        questionAnalytics.summary = {
          count: answers.length,
          samples: answers.slice(0, 5), // Primeras 5 respuestas como muestra
        };
      }

      analyticsData.questions[question.id] = questionAnalytics;
    });

    setAnalytics(analyticsData);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      // Intentar usar el servicio de exportación del backend
      try {
        const exportResponse = await analyticsApi.exportCSV(surveyId);

        // Si el backend devuelve un CSV, descargarlo directamente
        if (exportResponse && exportResponse.data) {
          const csvContent = exportResponse.data;
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `survey-${surveyId}-results-${Date.now()}.csv`;
          link.click();
          console.log("✅ CSV exportado desde el backend exitosamente");
          return;
        }
      } catch (backendError) {
        console.warn("Backend export not available, creating CSV locally:", backendError);
      }

      // Fallback: Crear CSV manualmente si el backend no está disponible
      const headers = ["Fecha de respuesta", ...questions.map((q) => q.text)];
      const rows = responses.map((response) => {
        console.log("Response createdAt:", response.createdAt);
        const row = [
          new Date(response.createdAt).toLocaleString(),
          ...questions.map((q) => {
            const answer = response.answers?.[q.id];
            // Manejar respuestas de selección múltiple
            if (Array.isArray(answer)) {
              return answer.join('; ');
            }
            return answer || "";
          }),
        ];
        return row;
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Descargar archivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `survey-${surveyId}-results-${Date.now()}.csv`;
      link.click();

      console.log("✅ CSV exportado localmente exitosamente");
    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Error",
        description: "Error al exportar CSV",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Hook de Pusher para actualizaciones en tiempo real
  useSurveyResponses(surveyId, (data) => {
    console.log("📡 Nueva respuesta recibida:", data);
    loadData(true); // Recargar datos con refresh indicator
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando resultados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{survey?.title}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">Resultados y análisis</p>
                  {analyticsSource === 'backend' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Analytics del servidor
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button onClick={handleExportCSV} disabled={exporting || responses.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? "Exportando..." : "Exportar CSV"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics?.totalResponses || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Preguntas</p>
                  <p className="text-3xl font-bold text-blue-600">{questions.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-lg font-bold text-green-600">
                    {survey?.isActive ? "Activa" : "Inactiva"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Creada</p>
                  <p className="text-sm font-bold text-gray-900">
                    {survey?.createdAt
                      ? new Date(survey.createdAt._seconds * 1000).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {responses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay respuestas aún
              </h3>
              <p className="text-gray-600 mb-4">
                Comparte el link de la encuesta para empezar a recibir respuestas
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Analytics por pregunta */}
            <div className="space-y-6">
              {questions.map((question, index) => {
                const questionAnalytics = analytics?.questions?.[question.id];
                if (!questionAnalytics) return null;

                // Debug: Log analytics data
                console.log(`Question ${question.id} analytics:`, questionAnalytics);

                // Normalizar datos del backend vs local
                // El backend usa { data: { counts: {...} } }, local usa { summary: {...} }
                const normalizedSummary = questionAnalytics.summary ||
                  (questionAnalytics.data?.counts ? questionAnalytics.data.counts : questionAnalytics.data) ||
                  {};
                const normalizedResponses = questionAnalytics.responses ||
                  (questionAnalytics.data?.answers ? questionAnalytics.data.answers : []);
                const normalizedCount = questionAnalytics.summary?.count ||
                  questionAnalytics.data?.count ||
                  questionAnalytics.totalResponses ||
                  0;

                return (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {index + 1}. {question.text}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({Array.isArray(normalizedResponses) ? normalizedResponses.length : normalizedCount} respuestas)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Multiple Choice, Yes/No, y Multiple Selection - Bar Chart y Pie Chart */}
                      {(question.type === QuestionType.MULTIPLE_CHOICE ||
                        question.type === QuestionType.YES_NO ||
                        question.type === QuestionType.MULTIPLE_SELECTION) && (
                        <>
                          {normalizedSummary && Object.keys(normalizedSummary).length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-semibold mb-4">
                                  Distribución
                                  {question.type === QuestionType.MULTIPLE_SELECTION &&
                                    <span className="ml-2 text-xs text-gray-500">(varias respuestas permitidas)</span>
                                  }
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <BarChart
                                    data={Object.entries(normalizedSummary || {}).map(
                                      ([name, value]) => ({
                                        name,
                                        value,
                                      })
                                    )}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8b5cf6" name="Respuestas" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-4">Porcentaje</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <PieChart>
                                    <Pie
                                      data={Object.entries(normalizedSummary || {}).map(
                                        ([name, value]) => ({
                                          name,
                                          value,
                                        })
                                      )}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={true}
                                      label={(entry) => {
                                        const total = question.type === QuestionType.MULTIPLE_SELECTION
                                          ? Object.values(normalizedSummary || {}).reduce((a: any, b: any) => a + b, 0)
                                          : (Array.isArray(normalizedResponses) ? normalizedResponses.length : normalizedCount);
                                        const percentage = ((entry.value / (total || 1)) * 100).toFixed(1);
                                        // Solo mostrar etiqueta si el porcentaje es mayor a 5%
                                        if (parseFloat(percentage) > 5) {
                                          return `${entry.name}: ${percentage}%`;
                                        }
                                        return '';
                                      }}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {Object.keys(normalizedSummary || {}).map(
                                        (_entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                          />
                                        )
                                      )}
                                    </Pie>
                                    <Tooltip
                                      formatter={(value: any, name: string) => {
                                        const total = question.type === QuestionType.MULTIPLE_SELECTION
                                          ? Object.values(normalizedSummary || {}).reduce((a: any, b: any) => a + b, 0)
                                          : (Array.isArray(normalizedResponses) ? normalizedResponses.length : normalizedCount);
                                        const percentage = ((value / (total || 1)) * 100).toFixed(1);
                                        return [`${value} (${percentage}%)`, name];
                                      }}
                                    />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No hay respuestas suficientes para mostrar gráficas
                            </div>
                          )}
                        </>
                      )}

                      {/* Scale - Stats */}
                      {question.type === QuestionType.SCALE && normalizedSummary && (
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Promedio</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {normalizedSummary.average || 0}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Mínimo</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {normalizedSummary.min || 0}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Máximo</p>
                            <p className="text-2xl font-bold text-green-600">
                              {normalizedSummary.max || 0}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {normalizedCount}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Text/Date - Muestras */}
                      {(question.type === QuestionType.TEXT ||
                        question.type === QuestionType.DATE) && (
                          <div>
                            <p className="text-sm font-semibold mb-2">
                              Ejemplos de respuestas ({normalizedCount} total):
                            </p>
                            <ul className="space-y-2">
                              {(Array.isArray(normalizedResponses) ? normalizedResponses : normalizedSummary?.samples || [])
                                .slice(0, 5)
                                .map((sample: any, idx: number) => (
                                  <li key={idx} className="bg-gray-50 p-3 rounded border">
                                    {typeof sample === 'string' ? sample : sample.text || JSON.stringify(sample)}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Respuestas Detalladas - Diseño de Tarjetas */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Respuestas Detalladas ({responses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.map((response, idx) => {
                    const responseId = response.id || `response-${idx}`;
                    const isExpanded = expandedResponses.has(responseId);

                    return (
                      <div
                        key={responseId}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Header de la respuesta */}
                        <div
                          className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            const newExpanded = new Set(expandedResponses);
                            if (isExpanded) {
                              newExpanded.delete(responseId);
                            } else {
                              newExpanded.add(responseId);
                            }
                            setExpandedResponses(newExpanded);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-700">
                              Respuesta #{idx + 1}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(response.submittedAt._seconds * 1000).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>

                        {/* Contenido expandible */}
                        {isExpanded && (
                          <div className="p-4 bg-white">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {questions.map((question, qIdx) => (
                                <div
                                  key={question.id}
                                  className="border rounded-lg p-3 bg-gray-50"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                      {qIdx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-700 mb-1 line-clamp-2">
                                        {question.text}
                                      </p>
                                      <p className="text-sm text-gray-900 font-semibold break-words">
                                        {response.answers?.[question.id] || (
                                          <span className="text-gray-400 italic">Sin respuesta</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón para expandir/contraer todo */}
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedResponses(new Set(responses.map((r, i) => r.id || `response-${i}`)))}
                  >
                    Expandir Todo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedResponses(new Set())}
                  >
                    Contraer Todo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
