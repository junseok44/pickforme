import {
  atomWithStorage as baseAtomWithStorage,
  createJSONStorage,
} from "jotai/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";

const customAsyncStorage = {
  getItem: async (key: string) => {
    try {
      const response = await AsyncStorage.getItem(key);
      if (!response) {
        return undefined;
      }
      return JSON.parse(response);
    } catch (error) {
      console.log(error);
      return undefined;
    }
  },
  setItem: async (key: string, newValue: any) => {
    if (newValue) {
      await AsyncStorage.setItem(key, JSON.stringify(newValue));
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export function atomWithStorage<T>(key: string, value: T) {
  const storage = createJSONStorage<T>(() => customAsyncStorage);
  return baseAtomWithStorage<T>(key, value, storage);
}
