"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { surveysApi } from "@/lib/api/surveys";
import { questionsApi } from "@/lib/api/questions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionType, type Question, type Survey } from "@/types";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Array<Partial<Question>>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const [surveyResponse, questionsResponse] = await Promise.all([
        surveysApi.getOne(surveyId),
        questionsApi.getBySurvey(surveyId),
      ]);

      console.log("📊 Respuesta de encuesta:", surveyResponse);
      console.log("📊 Respuesta de preguntas:", questionsResponse);

      // Manejar diferentes formatos de respuesta del backend
      // El backend puede devolver { data: {...} } o directamente el objeto
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

      // Manejar diferentes formatos de respuesta de preguntas
      let questionsArray: any[] = [];
      if (questionsResponse) {
        if (Array.isArray(questionsResponse)) {
          questionsArray = questionsResponse;
        } else if ((questionsResponse as any)?.data) {
          if (Array.isArray((questionsResponse as any).data)) {
            questionsArray = (questionsResponse as any).data;
          } else if ((questionsResponse as any)?.data?.data && Array.isArray((questionsResponse as any).data.data)) {
            questionsArray = (questionsResponse as any).data.data;
          }
        }
      }

      setSurvey(surveyObj);
      setTitle(surveyObj.title || "");
      setDescription(surveyObj.description || "");
      setQuestions(
        questionsArray
          .sort((a: Question, b: Question) => (a.order || 0) - (b.order || 0))
          .map((q: Question) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            required: q.required || false,
            order: q.order || 0,
            options: q.options || [],
          }))
      );
    } catch (error: any) {
      console.error("Error loading survey:", error);
      setError("Error al cargar la encuesta. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: QuestionType.TEXT,
        required: false,
        order: questions.length,
        options: [],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options = [...(updated[questionIndex].options || []), ""];
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = [...updated[questionIndex].options];
      updated[questionIndex].options![optionIndex] = value;
    }
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.filter(
        (_, i) => i !== optionIndex
      );
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim()) {
      setError("El título es requerido");
      setSaving(false);
      return;
    }

    if (questions.length === 0) {
      setError("Debes agregar al menos una pregunta");
      setSaving(false);
      return;
    }

    // Validar que todas las preguntas tengan texto
    const invalidQuestions = questions.some((q) => !q.text?.trim());
    if (invalidQuestions) {
      setError("Todas las preguntas deben tener un texto");
      setSaving(false);
      return;
    }

    // Validar que las preguntas de opción múltiple tengan opciones
    const invalidOptions = questions.some(
      (q) =>
        q.type === QuestionType.MULTIPLE_CHOICE &&
        (!q.options || q.options.length === 0 || q.options.some((opt) => !opt.trim()))
    );
    if (invalidOptions) {
      setError("Las preguntas de opción múltiple deben tener al menos una opción válida");
      setSaving(false);
      return;
    }

    try {
      // Actualizar la encuesta
      const surveyData: any = {
        title: title.trim(),
        ...(description.trim() && { description: description.trim() }),
      };

      if (!description.trim()) {
        delete surveyData.description;
      }

      console.log("📝 Actualizando encuesta:", surveyData);
      await surveysApi.update(surveyId, surveyData);
      console.log("✅ Encuesta actualizada");

      // Obtener las preguntas existentes para comparar
      const existingQuestions = questions.filter((q) => q.id);
      const newQuestions = questions.filter((q) => !q.id);

      // Actualizar preguntas existentes
      for (const question of existingQuestions) {
        const questionData: any = {
          text: question.text!.trim(),
          type: question.type,
          required: question.required || false,
          order: question.order || 0,
        };

        if (question.type === QuestionType.MULTIPLE_CHOICE && question.options && question.options.length > 0) {
          const validOptions = question.options.filter((opt) => opt && opt.trim() !== "");
          if (validOptions.length > 0) {
            questionData.options = validOptions;
          }
        }

        console.log(`📝 Actualizando pregunta ${question.id}:`, questionData);
        await questionsApi.update(question.id!, questionData);
      }

      // Crear nuevas preguntas
      for (let i = 0; i < newQuestions.length; i++) {
        const question = newQuestions[i];
        const questionData: any = {
          surveyId: surveyId,
          text: question.text!.trim(),
          type: question.type,
          required: question.required || false,
          order: existingQuestions.length + i,
        };

        if (question.type === QuestionType.MULTIPLE_CHOICE && question.options && question.options.length > 0) {
          const validOptions = question.options.filter((opt) => opt && opt.trim() !== "");
          if (validOptions.length > 0) {
            questionData.options = validOptions;
          }
        }

        console.log(`📝 Creando nueva pregunta:`, questionData);
        await questionsApi.create(questionData);
      }

      console.log("✅ Encuesta y preguntas actualizadas exitosamente");

      // Recargar los datos
      await loadSurvey();
      
      // Mostrar mensaje de éxito (opcional)
      alert("Encuesta actualizada exitosamente");
    } catch (error: any) {
      console.error("❌ Error al actualizar encuesta:", error);
      const errorMessage = error?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError(error?.message || "Error al actualizar la encuesta. Por favor, intenta nuevamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando encuesta...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-700">Encuesta no encontrada</p>
            <Link href="/dashboard">
              <Button className="mt-4">Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Editar Encuesta</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información de la Encuesta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Encuesta de Satisfacción del Cliente"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito de esta encuesta..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preguntas</CardTitle>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Pregunta
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay preguntas aún.</p>
                  <p className="text-sm">Haz clic en "Agregar Pregunta" para comenzar.</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card key={question.id || index} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Pregunta {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Texto de la Pregunta <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={question.text || ""}
                          onChange={(e) => updateQuestion(index, "text", e.target.value)}
                          placeholder="Ej: ¿Qué tan satisfecho está con nuestro servicio?"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Pregunta
                        </label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={question.type}
                          onChange={(e) =>
                            updateQuestion(index, "type", e.target.value as QuestionType)
                          }
                        >
                          <option value={QuestionType.TEXT}>Texto</option>
                          <option value={QuestionType.MULTIPLE_CHOICE}>Opción Múltiple</option>
                          <option value={QuestionType.SCALE}>Escala</option>
                          <option value={QuestionType.DATE}>Fecha</option>
                        </select>
                      </div>

                      {question.type === QuestionType.MULTIPLE_CHOICE && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opciones <span className="text-red-500">*</span>
                          </label>
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex gap-2">
                                <Input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(index, optIndex, e.target.value)
                                  }
                                  placeholder={`Opción ${optIndex + 1}`}
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index, optIndex)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar Opción
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={question.required || false}
                          onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`required-${index}`} className="text-sm text-gray-700">
                          Pregunta requerida
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

