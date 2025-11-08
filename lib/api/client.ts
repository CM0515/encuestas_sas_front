import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // Verificar si estamos en el navegador antes de usar localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      // Asegurar que config.headers existe y es un objeto válido
      if (!config.headers) {
        config.headers = {} as any;
      }
      // Enviar el token en el header Authorization
      config.headers.Authorization = `Bearer ${token}`;
      // Debug: verificar que el token se está enviando (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Token enviado en request a:', config.url, '- Token:', token.substring(0, 30) + '...');
        console.log('📋 Headers:', JSON.stringify(config.headers, null, 2));
      }
    } else {
      // Debug: avisar si no hay token (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No hay token en localStorage para la petición:', config.url);
      }
    }
  } else {
    // Si estamos en el servidor, no podemos acceder a localStorage
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Intento de hacer petición desde el servidor sin token:', config.url);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const status = error.response.status;
      const data = error.response.data;
      
      // Solo loggear errores que no sean de conexión
      if (status !== 401 && status !== 403) {
        console.error("API Error:", data || error.message);
      }
      
      // Mantener la estructura del error para que el código pueda acceder a error.response
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: data,
          status: status,
        },
      });
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta (error de conexión)
      // No loggear errores de conexión para no saturar la consola
      return Promise.reject({
        ...error,
        code: error.code || "ERR_NETWORK",
        message: error.message || "Network error",
      });
    } else {
      // Algo pasó al configurar la petición
      console.error("API Request Error:", error.message);
      return Promise.reject(error);
    }
  }
);

export default apiClient;
