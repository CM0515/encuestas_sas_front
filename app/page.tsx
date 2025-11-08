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
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Surveys That Get
            <span className="text-purple-600"> Results</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Build beautiful surveys, collect responses, and analyze data in real-time.
            Perfect for businesses, researchers, and teams.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/survey/demo">
              <Button size="lg" variant="outline" className="text-lg">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
            <p className="text-gray-600">
              Watch responses come in live with beautiful charts and insights.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Easy to Share</h3>
            <p className="text-gray-600">
              Share surveys with anyone via link. No login required for respondents.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Zap className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Fast & Simple</h3>
            <p className="text-gray-600">
              Create professional surveys in minutes with our intuitive builder.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
