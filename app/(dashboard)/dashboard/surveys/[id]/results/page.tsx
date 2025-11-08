"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { surveysApi } from "@/lib/api/surveys";
import { questionsApi } from "@/lib/api/questions";
import { responsesApi } from "@/lib/api/responses";
import { analyticsApi } from "@/lib/api/analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  RefreshCw
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
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [surveyResponse, questionsResponse, responsesResponse] = await Promise.all([
        surveysApi.getOne(surveyId),
        questionsApi.getBySurvey(surveyId),
        responsesApi.getBySurvey(surveyId),
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

      // Calcular analytics
      calculateAnalytics(questionsArray, responsesArray);
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
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const counts: Record<string, number> = {};
        answers.forEach((answer) => {
          counts[answer] = (counts[answer] || 0) + 1;
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

      // Crear CSV manualmente
      const headers = ["Fecha de respuesta", ...questions.map((q) => q.text)];
      const rows = responses.map((response) => {
        console.log("Response createdAt:", response.createdAt);
        const row = [
          new Date(response.createdAt).toLocaleString(),
          ...questions.map((q) => response.answers?.[q.id] || ""),
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

      console.log("✅ CSV exportado exitosamente");
    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      alert("Error al exportar CSV");
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
                <p className="text-sm text-gray-600">Resultados y análisis</p>
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

                return (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {index + 1}. {question.text}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({questionAnalytics.responses.length} respuestas)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Multiple Choice - Bar Chart y Pie Chart */}
                      {question.type === QuestionType.MULTIPLE_CHOICE && (
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold mb-4">Distribución</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={Object.entries(questionAnalytics.summary).map(
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
                                  data={Object.entries(questionAnalytics.summary).map(
                                    ([name, value]) => ({
                                      name,
                                      value,
                                    })
                                  )}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(entry) =>
                                    `${entry.name}: ${entry.value} (${(
                                      (entry.value / questionAnalytics.responses.length) *
                                      100
                                    ).toFixed(1)}%)`
                                  }
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {Object.keys(questionAnalytics.summary).map(
                                    (entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    )
                                  )}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Scale - Stats */}
                      {question.type === QuestionType.SCALE && (
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Promedio</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {questionAnalytics.summary.average}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Mínimo</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {questionAnalytics.summary.min}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Máximo</p>
                            <p className="text-2xl font-bold text-green-600">
                              {questionAnalytics.summary.max}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {questionAnalytics.summary.count}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Text/Date - Muestras */}
                      {(question.type === QuestionType.TEXT ||
                        question.type === QuestionType.DATE) && (
                          <div>
                            <p className="text-sm font-semibold mb-2">
                              Ejemplos de respuestas ({questionAnalytics.summary.count} total):
                            </p>
                            <ul className="space-y-2">
                              {questionAnalytics.summary.samples.map(
                                (sample: string, idx: number) => (
                                  <li key={idx} className="bg-gray-50 p-3 rounded border">
                                    {sample}
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

            {/* Tabla de Respuestas Detalladas */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Respuestas Detalladas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          #
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Fecha
                        </th>
                        {questions.map((q) => (
                          <th
                            key={q.id}
                            className="px-4 py-3 text-left font-semibold text-gray-700"
                          >
                            {q.text.length > 30
                              ? q.text.substring(0, 30) + "..."
                              : q.text}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {responses.map((response, idx) => (
                        <tr key={response.id || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(response.submittedAt._seconds * 1000).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          {questions.map((q) => (
                            <td key={q.id} className="px-4 py-3 text-gray-900">
                              {response.answers?.[q.id] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
