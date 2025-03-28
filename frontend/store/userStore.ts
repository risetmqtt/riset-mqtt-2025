import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
    idUser: string | null;
    emailUser: string | null;
    setUser: (idUser: string, emailUser: string) => void;
    clearUser: () => void;
}

const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            idUser: null,
            emailUser: null,
            setUser: (idUser, emailUser) => set({ idUser, emailUser }),
            clearUser: () => set({ idUser: null, emailUser: null }),
        }),
        {
            name: "user-storage", // Nama key di localStorage
            partialize: (state) => ({
                idUser: state.idUser,
                emailUser: state.emailUser,
            }), // Menyimpan hanya idUser dan emailUser
        }
    )
);

export default useUserStore;
