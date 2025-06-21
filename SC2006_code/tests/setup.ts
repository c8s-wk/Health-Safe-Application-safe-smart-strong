// tests/setup.ts
import { vi } from 'vitest';

// 模拟 localStorage 实现
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

// 注入全局对象
vi.stubGlobal('localStorage', localStorageMock);