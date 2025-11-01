/**
 * Settings Store - In-memory settings management
 */
class SettingsStore {
  private state = {
    showHiddenTags: false,
  };

  private listeners: Set<() => void> = new Set();

  getState() {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore
      }
    });
  }

  setShowHiddenTags(value: boolean) {
    this.state.showHiddenTags = value;
    this.notify();
  }
}

export const settingsStore = new SettingsStore();
