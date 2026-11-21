// Browser storage is scoped to the tab and is not encrypted like native SecureStore.
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    return typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== "undefined")
      window.sessionStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
  },
};
