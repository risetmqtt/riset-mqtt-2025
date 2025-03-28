import { create } from "zustand";

interface NotifStore {
    notifShow: boolean;
    notifText: string;
    showNotification: (text: string) => void;
}

const useNotifStore = create<NotifStore>((set, get) => ({
    notifShow: false,
    notifText: "",
    showNotification: (text: string) => {
        set(() => ({
            notifShow: true,
            notifText: text,
        }));
        setTimeout(() => {
            set(() => ({ notifShow: false }));
        }, 3000);
    },
}));

export default useNotifStore;
