import axios from 'axios';

const API_BASE = 'https://rate-limiting.onrender.com';
const HEALTH_ENDPOINT = `${API_BASE}/health`;

// Wake-up service for Render backend
class BackendWakeUpService {
  constructor() {
    this.isWakingUp = false;
    this.isAwake = false;
  }

  // Check if backend is responsive
  async isBackendAwake() {
    try {
      const response = await axios.get(HEALTH_ENDPOINT, { 
        timeout: 8000 // 8 second timeout
      });
      this.isAwake = response.status === 200;
      return this.isAwake;
    } catch (error) {
      this.isAwake = false;
      return false;
    }
  }

  // Wake up backend with progress callback
  async wakeUpBackend(onProgress) {
    if (this.isWakingUp) {
      return; // Already waking up
    }

    this.isWakingUp = true;
    let attempt = 0;
    const maxAttempts = 24; // 2 minutes max (24 * 5 seconds)

    onProgress && onProgress({
      message: "🚀 Waking up backend server...",
      progress: 0,
      isWaking: true
    });

    while (attempt < maxAttempts) {
      try {
        const response = await axios.get(HEALTH_ENDPOINT, { 
          timeout: 10000 
        });
        
        if (response.status === 200) {
          this.isAwake = true;
          this.isWakingUp = false;
          
          onProgress && onProgress({
            message: "✅ Backend is ready!",
            progress: 100,
            isWaking: false,
            isReady: true
          });
          
          return true;
        }
      } catch (error) {
        // Still sleeping, continue trying
      }

      attempt++;
      const progress = Math.min((attempt / maxAttempts) * 100, 95);
      const timeRemaining = Math.max(0, 120 - (attempt * 5)); // Rough estimate
      
      onProgress && onProgress({
        message: `⏳ Waking up backend... (${timeRemaining}s remaining)`,
        progress: progress,
        isWaking: true,
        attempt: attempt
      });

      // Wait 5 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Timeout reached
    this.isWakingUp = false;
    onProgress && onProgress({
      message: "❌ Backend wake-up timeout. Please try again.",
      progress: 100,
      isWaking: false,
      hasError: true
    });

    return false;
  }

  // Smart API call with auto wake-up
  async makeAPICall(apiCall, onProgress) {
    // First check if backend is already awake
    if (await this.isBackendAwake()) {
      return await apiCall();
    }

    // Backend is sleeping, wake it up
    const wakeUpSuccess = await this.wakeUpBackend(onProgress);
    
    if (!wakeUpSuccess) {
      throw new Error('Backend failed to wake up');
    }

    // Now make the actual API call
    return await apiCall();
  }

  // Reset state (useful for testing)
  reset() {
    this.isWakingUp = false;
    this.isAwake = false;
  }
}

// Export singleton instance
export const backendWakeUp = new BackendWakeUpService();

// Export hook for React components
export const useBackendWakeUp = () => {
  return backendWakeUp;
};
