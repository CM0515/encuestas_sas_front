"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth";
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
  const [error, setError] = useState("");
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    // Cargar Firebase solo en el cliente
    if (typeof window !== "undefined") {
      import("@/lib/firebase/config").then((module) => {
        const { initFirebase } = module;
        const { auth: firebaseAuth } = initFirebase();
        setAuth(firebaseAuth);
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!auth) {
      setError("Firebase no está configurado. Por favor, configura las variables de entorno.");
      setLoading(false);
      return;
    }

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Exchange for JWT
      const response: any = await authApi.login(idToken);
      
      // El interceptor ya devuelve response.data, así que response es directamente el objeto de datos
      const token = response?.accessToken || response?.token || response?.data?.accessToken;
      
      if (typeof window !== "undefined" && token) {
        localStorage.setItem("token", token);
        console.log("✅ Token guardado en localStorage");
      } else {
        console.error("❌ No se recibió token en la respuesta:", response);
        setError("Error: No se recibió token de autenticación del servidor");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Error al iniciar sesión. Por favor, verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError("Firebase no está configurado. Por favor, configura las variables de entorno.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();

      const response: any = await authApi.login(idToken);
      
      // El interceptor ya devuelve response.data, así que response es directamente el objeto de datos
      const token = response?.accessToken || response?.token || response?.data?.accessToken;
      
      if (typeof window !== "undefined" && token) {
        localStorage.setItem("token", token);
        console.log("✅ Token guardado en localStorage (Google)");
      } else {
        console.error("❌ No se recibió token en la respuesta:", response);
        setError("Error: No se recibió token de autenticación del servidor");
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || "Error al iniciar sesión con Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to SurveyPro</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
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
            <Button variant="outline" onClick={handleGoogleLogin} className="w-full" disabled={!auth}>
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

