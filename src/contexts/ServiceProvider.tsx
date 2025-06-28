// Service provider for dependency injection
import React, { createContext, useContext } from 'react';
import { ThreeJSEngineService } from '../services/ThreeJSEngineService';
import type { I3DEngineService } from '../services/interfaces';

interface ServiceContainer {
  engineService: I3DEngineService;
  // Add other services as they are implemented
  // assetService: IAssetService;
  // fileSystemService: IFileSystemService;
}

const ServiceContext = createContext<ServiceContainer | null>(null);

interface ServiceProviderProps {
  children: React.ReactNode;
  services?: Partial<ServiceContainer>;
}

export function ServiceProvider({ children, services }: ServiceProviderProps) {
  // Create default services if not provided (for production)
  const defaultServices: ServiceContainer = {
    engineService: new ThreeJSEngineService(),
    // Add other default services here
  };

  // Merge provided services with defaults (useful for testing)
  const containerServices = { ...defaultServices, ...services };

  return (
    <ServiceContext.Provider value={containerServices}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices(): ServiceContainer {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return services;
}

// Convenience hooks for individual services
export function useEngineService(): I3DEngineService {
  return useServices().engineService;
}
