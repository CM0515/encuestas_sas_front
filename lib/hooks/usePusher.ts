import { useEffect, useRef, useCallback } from "react";
import { getPusherInstance } from "@/lib/pusher/config";
import type Pusher from "pusher-js";
import type { Channel } from "pusher-js";

interface UsePusherOptions {
  channelName: string;
  eventName: string;
  onEvent: (data: any) => void;
  enabled?: boolean;
}

export function usePusher({ channelName, eventName, onEvent, enabled = true }: UsePusherOptions) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  // Usar useCallback para memoizar la función de evento
  const eventHandler = useCallback(onEvent, [onEvent]);

  useEffect(() => {
    // No hacer nada si está deshabilitado o no estamos en el navegador
    if (!enabled || typeof window === "undefined") {
      return;
    }

    // Obtener instancia de Pusher
    const pusher = getPusherInstance();

    if (!pusher) {
      console.warn("⚠️ Pusher no disponible");
      return;
    }

    pusherRef.current = pusher;

    // Suscribirse al canal
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Escuchar el evento
    channel.bind(eventName, eventHandler);

    if (process.env.NODE_ENV === "development") {
      console.log(`📡 Suscrito a canal: ${channelName}, evento: ${eventName}`);
    }

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventName, eventHandler);
        pusherRef.current?.unsubscribe(channelName);

        if (process.env.NODE_ENV === "development") {
          console.log(`🔌 Desuscrito de canal: ${channelName}, evento: ${eventName}`);
        }
      }
    };
  }, [channelName, eventName, eventHandler, enabled]);

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
  };
}

// Hook simplificado para escuchar cambios en encuestas
export function useSurveyUpdates(onUpdate: (data: any) => void, enabled = true) {
  return usePusher({
    channelName: "surveys",
    eventName: "survey-updated",
    onEvent: onUpdate,
    enabled,
  });
}

// Hook para escuchar cuando se crea una nueva encuesta
export function useSurveyCreated(onCreate: (data: any) => void, enabled = true) {
  return usePusher({
    channelName: "surveys",
    eventName: "survey-created",
    onEvent: onCreate,
    enabled,
  });
}

// Hook para escuchar cuando se elimina una encuesta
export function useSurveyDeleted(onDelete: (data: any) => void, enabled = true) {
  return usePusher({
    channelName: "surveys",
    eventName: "survey-deleted",
    onEvent: onDelete,
    enabled,
  });
}

// Hook para escuchar nuevas respuestas a una encuesta específica
export function useSurveyResponses(surveyId: string, onResponse: (data: any) => void, enabled = true) {
  return usePusher({
    channelName: `survey-${surveyId}`,
    eventName: "new-response",
    onEvent: onResponse,
    enabled,
  });
}
