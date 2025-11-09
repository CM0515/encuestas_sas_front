"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { surveysApi } from "@/lib/api/surveys";
import { questionsApi } from "@/lib/api/questions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionType, type Question } from "@/types";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewSurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Array<Partial<Question>>>([]);
  const [error, setError] = useState("");
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll automático cuando se agrega una nueva pregunta
  useEffect(() => {
    if (lastAddedIndex !== null && questionRefs.current[lastAddedIndex]) {
      questionRefs.current[lastAddedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Enfocar el input de texto de la pregunta
      setTimeout(() => {
        const textInput = questionRefs.current[lastAddedIndex]?.querySelector('input[type="text"]') as HTMLInputElement;
        textInput?.focus();
      }, 500);

      setLastAddedIndex(null);
    }
  }, [lastAddedIndex, questions.length]);

  const addQuestion = () => {
    const newIndex = questions.length;
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
    setLastAddedIndex(newIndex);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };

    // Si se cambia el tipo de pregunta a SCALE, inicializar min y max
    if (field === 'type' && value === QuestionType.SCALE) {
      updated[index].min = updated[index].min ?? 1;
      updated[index].max = updated[index].max ?? 5;
    }

    // Si se cambia de SCALE a otro tipo, eliminar min y max
    if (field === 'type' && value !== QuestionType.SCALE) {
      delete updated[index].min;
      delete updated[index].max;
    }

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
    setLoading(true);
    setError("");

    if (!title.trim()) {
      setError("El título es requerido");
      setLoading(false);
      return;
    }

    if (questions.length === 0) {
      setError("Debes agregar al menos una pregunta");
      setLoading(false);
      return;
    }

    // Validar que todas las preguntas tengan texto
    const invalidQuestions = questions.some((q) => !q.text?.trim());
    if (invalidQuestions) {
      setError("Todas las preguntas deben tener un texto");
      setLoading(false);
      return;
    }

    // Validar que las preguntas de opción múltiple tengan opciones
    const invalidOptions = questions.some(
      (q) =>
        (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.MULTIPLE_SELECTION) &&
        (!q.options || q.options.length === 0 || q.options.some((opt) => !opt.trim()))
    );
    if (invalidOptions) {
      setError("Las preguntas de opción múltiple y selección múltiple deben tener al menos una opción válida");
      setLoading(false);
      return;
    }

    // Validar que las preguntas de escala tengan min y max válidos
    const invalidScale = questions.some(
      (q) =>
        q.type === QuestionType.SCALE &&
        (q.min === undefined || q.max === undefined || q.min >= q.max)
    );
    if (invalidScale) {
      setError("Las preguntas de escala deben tener valores mínimo y máximo válidos (mín < máx)");
      setLoading(false);
      return;
    }

    try {
      // Crear la encuesta
      // El backend no acepta isActive al crear (se asigna automáticamente)
      // Solo enviamos las propiedades que el backend acepta en la creación
      const surveyData: any = {
        title: title.trim(),
        ...(description.trim() && { description: description.trim() }),
        settings: {
          allowAnonymous: true,
          allowMultipleResponses: false,
          showResults: false,
          requireLogin: false,
        },
      };
      
      // Si description está vacío, no lo incluimos en el objeto
      if (!description.trim()) {
        delete surveyData.description;
      }

      console.log("📝 Creando encuesta:", surveyData);
      const surveyResponse: any = await surveysApi.create(surveyData);
      console.log("✅ Respuesta completa de creación de encuesta:", JSON.stringify(surveyResponse, null, 2));
      
      // El interceptor devuelve response.data, así que surveyResponse es directamente el objeto
      // Intentar obtener el ID de diferentes formas posibles
      const surveyId = 
        surveyResponse?.id || 
        surveyResponse?._id || 
        surveyResponse?.data?.id || 
        surveyResponse?.data?._id ||
        surveyResponse?.survey?.id ||
        surveyResponse?.survey?._id;
      
      console.log("🔍 ID de encuesta extraído:", surveyId);
      console.log("🔍 Tipo del ID:", typeof surveyId);
      console.log("🔍 Estructura completa de la respuesta:", JSON.stringify(surveyResponse, null, 2));
      
      // Validar que el surveyId sea válido
      if (!surveyId || surveyId === "undefined" || surveyId === "null" || String(surveyId).trim() === "") {
        const errorMsg = `No se pudo obtener el ID de la encuesta creada. 
          Respuesta recibida: ${JSON.stringify(surveyResponse, null, 2)}
          ID extraído: ${surveyId}
          Tipo: ${typeof surveyId}`;
        console.error("❌", errorMsg);
        throw new Error(errorMsg);
      }

      // Asegurar que el surveyId sea un string válido
      const validSurveyId = String(surveyId).trim();
      console.log("✅ SurveyId válido para crear preguntas:", validSurveyId);

      // Crear las preguntas
      const questionsToCreate = questions.map((q, index) => {
        const questionData: any = {
          surveyId: validSurveyId, // Usar el ID validado
          text: q.text!.trim(),
          type: q.type,
          required: q.required || false,
          order: index,
        };

        // Solo agregar options si es multiple_choice o multiple_selection y tiene opciones válidas
        if ((q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.MULTIPLE_SELECTION) && q.options && q.options.length > 0) {
          const validOptions = q.options.filter(opt => opt && opt.trim() !== "");
          if (validOptions.length > 0) {
            questionData.options = validOptions;
          }
        }

        // Agregar validación con min y max si es una pregunta de escala
        if (q.type === QuestionType.SCALE && q.min !== undefined && q.max !== undefined) {
          questionData.validation = {
            min: q.min,
            max: q.max,
          };
          console.log(`✅ Pregunta SCALE con validation.min=${q.min}, validation.max=${q.max}, type="${q.type}"`);
        } else {
          console.log(`ℹ️ Pregunta tipo "${q.type}", min=${q.min}, max=${q.max}`);
        }

        return questionData;
      });

      console.log("📝 Creando preguntas con surveyId:", surveyId);
      console.log("📝 Datos de preguntas a crear:", JSON.stringify(questionsToCreate, null, 2));
      
      // Crear preguntas una por una o en batch (dependiendo de la API)
      for (let i = 0; i < questionsToCreate.length; i++) {
        const questionData = questionsToCreate[i];
        try {
          console.log(`📝 Creando pregunta ${i + 1}/${questionsToCreate.length}:`, questionData);
          const result = await questionsApi.create(questionData);
          console.log(`✅ Pregunta ${i + 1} creada:`, result);
        } catch (error: any) {
          console.error(`❌ Error al crear pregunta ${i + 1}:`, error);
          console.error("Datos enviados:", questionData);
          throw error; // Re-lanzar el error para que se capture en el catch principal
        }
      }

      console.log("✅ Preguntas creadas exitosamente");

      // Redirigir al dashboard o a editar la encuesta
      const finalSurveyId = surveyId || surveyResponse?.id || surveyResponse?._id;
      if (finalSurveyId) {
        router.push(`/dashboard/surveys/${finalSurveyId}/edit`);
      } else {
        // Si no hay ID, redirigir al dashboard
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("❌ Error al crear encuesta:", error);
      // Manejar errores de validación del backend
      const errorMessage = error?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError(error?.message || "Error al crear la encuesta. Por favor, intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Encuesta</h1>
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
            <CardHeader>
              <CardTitle>Preguntas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay preguntas aún.</p>
                  <p className="text-sm">Haz clic en "Agregar Pregunta" para comenzar.</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <div
                    key={index}
                    ref={(el) => { questionRefs.current[index] = el; }}
                  >
                    <Card className="border-2">
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
                          <option value={QuestionType.MULTIPLE_CHOICE}>Opción Múltiple (una respuesta)</option>
                          <option value={QuestionType.MULTIPLE_SELECTION}>Selección Múltiple (varias respuestas)</option>
                          <option value={QuestionType.YES_NO}>Sí o No</option>
                          <option value={QuestionType.SCALE}>Escala</option>
                          <option value={QuestionType.DATE}>Fecha</option>
                        </select>
                      </div>

                      {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.MULTIPLE_SELECTION) && (
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

                      {question.type === QuestionType.SCALE && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valor Mínimo <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              value={question.min ?? 1}
                              onChange={(e) => updateQuestion(index, "min", parseInt(e.target.value) || 1)}
                              placeholder="Ej: 1"
                              min="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valor Máximo <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              value={question.max ?? 5}
                              onChange={(e) => updateQuestion(index, "max", parseInt(e.target.value) || 5)}
                              placeholder="Ej: 5"
                              min={question.min ?? 1}
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">
                              Los usuarios podrán seleccionar un valor entre {question.min ?? 1} y {question.max ?? 5}
                            </p>
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Barra de acción fija en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex justify-between items-center gap-4">
            <Button
              type="button"
              onClick={addQuestion}
              variant="outline"
              className="flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Pregunta
            </Button>
            <div className="flex gap-4">
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Encuesta"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

