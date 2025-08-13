// Performance monitoring utilities for identifying bottlenecks

export class PerformanceTracker {
  private static timers: Map<string, number> = new Map();

  // Start timing an operation
  static start(label: string): void {
    this.timers.set(label, Date.now());
    console.time(`⏱️ ${label}`);
  }

  // End timing and log results
  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Performance timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    console.timeEnd(`⏱️ ${label}`);
    
    // Log slow operations prominently
    if (duration > 1000) {
      console.warn(`🐌 SLOW OPERATION: ${label} took ${duration}ms`);
    } else if (duration > 500) {
      console.log(`⚠️ MODERATE: ${label} took ${duration}ms`);
    } else {
      console.log(`✅ FAST: ${label} took ${duration}ms`);
    }

    this.timers.delete(label);
    return duration;
  }

  // Add Server-Timing header for client visibility
  static addServerTiming(response: Response, timings: Record<string, number>): void {
    const serverTimingEntries = Object.entries(timings)
      .map(([name, duration]) => `${name};dur=${duration}`)
      .join(', ');
    
    response.headers.set('Server-Timing', serverTimingEntries);
  }

  // Database query performance wrapper
  static async trackQuery<T>(
    label: string, 
    queryFn: () => Promise<T>
  ): Promise<T> {
    this.start(`DB: ${label}`);
    try {
      const result = await queryFn();
      this.end(`DB: ${label}`);
      return result;
    } catch (error) {
      this.end(`DB: ${label}`);
      console.error(`❌ Query failed: ${label}`, error);
      throw error;
    }
  }
}

// React component performance hook
export function usePerformanceTracker(componentName: string) {
  const startTime = Date.now();
  
  return {
    trackRender: () => {
      const renderTime = Date.now() - startTime;
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`🐌 SLOW RENDER: ${componentName} took ${renderTime}ms`);
      }
    }
  };
}
