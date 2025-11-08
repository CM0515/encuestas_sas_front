import Pusher from "pusher-js";

let pusherInstance: Pusher | null = null;

export function getPusherInstance(): Pusher | null {
  // Solo inicializar en el navegador
  if (typeof window === "undefined") {
    return null;
  }

  // Si ya existe una instancia, devolverla
  if (pusherInstance) {
    return pusherInstance;
  }

  // Verificar que las variables de entorno estén configuradas
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

  if (!pusherKey) {
    console.warn("⚠️ Pusher key no configurada. Las actualizaciones en tiempo real no estarán disponibles.");
    return null;
  }

  try {
    // Crear instancia de Pusher
    pusherInstance = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    });

    // Log de conexión en desarrollo
    if (process.env.NODE_ENV === "development") {
      pusherInstance.connection.bind("connected", () => {
        console.log("✅ Pusher conectado");
      });

      pusherInstance.connection.bind("error", (err: any) => {
        console.error("❌ Error de conexión con Pusher:", err);
      });
    }

    return pusherInstance;
  } catch (error) {
    console.error("Error al inicializar Pusher:", error);
    return null;
  }
}

export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
    console.log("🔌 Pusher desconectado");
  }
}
