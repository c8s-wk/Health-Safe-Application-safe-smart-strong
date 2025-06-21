export interface Alert {
  id: number;
  title: string;
  message: string;
  category: string;
  location: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

// Global type declarations
interface Window {
  alertSystem?: {
    checkForAlerts: () => void;
    addAlert: (alert: any) => void;
    getNotifications: () => any[];
  };
}

export {}; 