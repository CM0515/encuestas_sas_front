import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-purple-600">SurveyPro</div>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Iniciar Sesión</Button>
          </Link>
          <Link href="/register">
            <Button>Comenzar</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Crea encuestas que generen
            <span className="text-purple-600"> resultados</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Crea encuestas atractivas, recopila respuestas y analiza los datos en tiempo real.
            Perfecto para empresas, investigadores y equipos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Prueba gratuita
              </Button>
            </Link>
            <Link href="/survey/demo">
              <Button size="lg" variant="outline" className="text-lg">
                Ver demostración
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Analítica en tiempo real</h3>
            <p className="text-gray-600">
              Observa las respuestas en vivo con gráficos e información detallada.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Fácil de compartir</h3>
            <p className="text-gray-600">
              Comparte tus encuestas mediante un enlace. No se requiere iniciar sesión para responder.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Zap className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Rápido y sencillo</h3>
            <p className="text-gray-600">
              Crea encuestas profesionales en minutos con nuestro constructor intuitivo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
