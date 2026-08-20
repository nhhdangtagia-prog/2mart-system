export class ServiceLocator {
  private static services: Map<string, any> = new Map();

  static register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  static resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`[ServiceLocator] Service not registered for key: ${key}`);
    }
    return service as T;
  }

  static clear(): void {
    this.services.clear();
  }
}
