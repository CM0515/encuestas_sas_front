"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { surveysApi } from "@/lib/api/surveys";
import { questionsApi } from "@/lib/api/questions";
import { responsesApi } from "@/lib/api/responses";
import { QuestionType } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function PublicSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Intentar cargar la encuesta pública (sin autenticación)
      const [surveyResponse, questionsResponse] = await Promise.all([
        surveysApi.getPublic(surveyId),
        questionsApi.getBySurvey(surveyId),
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

      // Manejar preguntas
      let questionsArray: any[] = [];
      if (questionsResponse) {
        if (Array.isArray(questionsResponse)) {
          questionsArray = questionsResponse;
        } else if ((questionsResponse as any)?.data) {
          questionsArray = (questionsResponse as any).data;
        }
      }

      // Verificar que la encuesta esté activa
      if (!surveyObj?.isActive) {
        setError("Esta encuesta no está disponible en este momento.");
        setLoading(false);
        return;
      }

      setSurvey(surveyObj);
      setQuestions(questionsArray.sort((a, b) => a.order - b.order));
    } catch (error: any) {
      console.error("Error loading survey:", error);
      setError("No se pudo cargar la encuesta. Por favor, verifica el link.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Validar que todas las preguntas requeridas tengan respuesta
      const requiredQuestions = questions.filter((q) => q.required);
      const missingAnswers = requiredQuestions.filter((q) => !answers[q.id]);

      if (missingAnswers.length > 0) {
        setError("Por favor, responde todas las preguntas requeridas.");
        setSubmitting(false);
        return;
      }

      // Enviar respuestas - el backend espera answers como objeto { questionId: answer }
      await responsesApi.submit({
        surveyId,
        answers: answers, // Ya es un objeto con formato { questionId: answer }
      });

      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting response:", error);
      const errorMessage = error?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError("Error al enviar la respuesta. Por favor, intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando encuesta...</div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Encuesta no disponible
              </h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Gracias por tu respuesta!
              </h2>
              <p className="text-gray-600 mb-6">
                Tu respuesta ha sido registrada exitosamente.
              </p>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
              >
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container max-w-3xl mx-auto">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-3xl font-bold text-gray-900">
              {survey?.title}
            </CardTitle>
            {survey?.description && (
              <p className="text-gray-600 mt-2 text-base">{survey.description}</p>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <label className="block">
                    <span className="text-lg font-medium text-gray-900">
                      {index + 1}. {question.text}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </label>

                  {/* Multiple Choice */}
                  {question.type === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-3 pl-4">
                      {question.options?.map((option: string) => (
                        <label
                          key={option}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) =>
                              setAnswers({ ...answers, [question.id]: e.target.value })
                            }
                            required={question.required}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Multiple Selection */}
                  {question.type === QuestionType.MULTIPLE_SELECTION && (
                    <div className="space-y-3 pl-4">
                      {question.options?.map((option: string) => (
                        <label
                          key={option}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={
                              Array.isArray(answers[question.id])
                                ? answers[question.id].includes(option)
                                : false
                            }
                            onChange={(e) => {
                              const currentAnswers = Array.isArray(answers[question.id])
                                ? answers[question.id]
                                : [];
                              if (e.target.checked) {
                                setAnswers({
                                  ...answers,
                                  [question.id]: [...currentAnswers, option],
                                });
                              } else {
                                setAnswers({
                                  ...answers,
                                  [question.id]: currentAnswers.filter(
                                    (a: string) => a !== option
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Yes/No */}
                  {question.type === QuestionType.YES_NO && (
                    <div className="space-y-3 pl-4">
                      {["Sí", "No"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) =>
                              setAnswers({ ...answers, [question.id]: e.target.value })
                            }
                            required={question.required}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Text */}
                  {question.type === QuestionType.TEXT && (
                    <Input
                      type="text"
                      placeholder="Escribe tu respuesta..."
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [question.id]: e.target.value })
                      }
                      required={question.required}
                      className="max-w-xl"
                    />
                  )}

                  {/* Scale */}
                  {question.type === QuestionType.SCALE && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {question.validation?.min || 1}
                        </span>
                        <input
                          type="range"
                          min={question.validation?.min || 1}
                          max={question.validation?.max || 10}
                          value={answers[question.id] || question.validation?.min || 1}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [question.id]: parseInt(e.target.value),
                            })
                          }
                          required={question.required}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <span className="text-sm text-gray-500">
                          {question.validation?.max || 10}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-purple-600">
                          {answers[question.id] || question.validation?.min || 1}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  {question.type === QuestionType.DATE && (
                    <Input
                      type="date"
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [question.id]: e.target.value })
                      }
                      required={question.required}
                      className="max-w-xs"
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? "Enviando..." : "Enviar respuestas"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          Powered by SurveyPro
        </div>
      </div>
    </div>
  );
}
