import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING;

export const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString,
    enableAutoRouteTracking: true, // Rastreo automático de cambios de ruta
  }
});

if (connectionString) {
  appInsights.loadAppInsights();
  appInsights.trackPageView(); // Rastrear la carga inicial
  console.log('✅ Application Insights inicializado');
} else {
  console.log('⚠️ Application Insights no configurado (VITE_APP_INSIGHTS_CONNECTION_STRING vacía)');
}
