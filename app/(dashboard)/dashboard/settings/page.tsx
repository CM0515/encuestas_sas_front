"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Mail } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Por ahora solo mostramos un mensaje
      // En el futuro se puede implementar la actualización del perfil
      toast({
        title: "Próximamente",
        description: "La funcionalidad de actualización de perfil estará disponible pronto",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    toast({
      title: "Cerrando sesión",
      description: "Estás siendo desconectado...",
      variant: "default",
    });
    auth?.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  La edición del nombre estará disponible próximamente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El correo electrónico no se puede modificar
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Información de la Cuenta
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Usuario ID:</span> {user?.uid || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Cuenta creada:</span>{" "}
                    {user?.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString("es-ES")
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Último acceso:</span>{" "}
                    {user?.metadata?.lastSignInTime
                      ? new Date(user.metadata.lastSignInTime).toLocaleDateString("es-ES")
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Botón deshabilitado por ahora */}
              {/* <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div> */}
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Las siguientes acciones son permanentes y no se pueden deshacer.
            </p>
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => cerrarSesion()}
            >
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
