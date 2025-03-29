import { create } from "zustand";

interface ToastStore {
    toastShow: boolean;
    toastText: string;
    toastURL: string;
    showToast: (text: string, url: string) => void;
    closeToast: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
    toastShow: false,
    toastText: "",
    toastURL: "",
    showToast: (text: string, url: string) => {
        set(() => ({
            toastShow: true,
            toastText: text,
            toastURL: url,
        }));
    },
    closeToast: () => {
        set(() => ({
            toastShow: false,
        }));
    },
}));

export default useToastStore;
