"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import Notif from "../components/Notif";
import useNotifStore from "@/store/notifStore";
import UsersTab from "./components/UsersTab";
import SensorsTab from "./components/SensorsTab";
import StructuresTab from "./components/StructuresTab";

type AdminTab = "users" | "sensors" | "structures";

export default function AdminPage() {
    const router = useRouter();
    const { notifShow, notifText, showNotification } = useNotifStore();
    const [tab, setTab] = useState<AdminTab>("users");
    const [checkingAccess, setCheckingAccess] = useState(true);

    useEffect(() => {
        const fetchAdminAccess = async () => {
            setCheckingAccess(true);
            const res = await fetch("/api/admin/ping");
            if (res.status === 401) {
                router.replace("/");
                return;
            }
            if (res.status === 403) {
                router.replace("/dashboard");
                return;
            }
            if (res.status !== 200) {
                showNotification("Gagal memvalidasi admin");
                router.replace("/dashboard");
                return;
            }
            setCheckingAccess(false);
        };

        fetchAdminAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (checkingAccess) {
        return (
            <>
                <Notif show={notifShow} teks={notifText} />
                <NavAtas title="Admin" subtitle="Checking access..." />
                <div className="konten px-6 pb-6">
                    <p className="text-sm text-center">
                        <i>Checking admin access...</i>
                    </p>
                </div>
                <NavBawah />
            </>
        );
    }

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <NavAtas title="Admin Dashboard" subtitle="Management Panel" />
            <div className="konten px-6 pb-6">
                <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
                    <button
                        type="button"
                        className={`btn ${
                            tab === "users"
                                ? "bg-ungu1 text-ungu"
                                : "bg-gray-100"
                        }`}
                        onClick={() => setTab("users")}
                    >
                        Users
                    </button>
                    <button
                        type="button"
                        className={`btn ${
                            tab === "sensors"
                                ? "bg-coklat1 text-coklat"
                                : "bg-gray-100"
                        }`}
                        onClick={() => setTab("sensors")}
                    >
                        Sensors
                    </button>
                    <button
                        type="button"
                        className={`btn ${
                            tab === "structures"
                                ? "bg-hijau1 text-hijau"
                                : "bg-gray-100"
                        }`}
                        onClick={() => setTab("structures")}
                    >
                        Structures
                    </button>
                </div>

                {tab === "users" ? (
                    <UsersTab showNotification={showNotification} />
                ) : null}
                {tab === "sensors" ? (
                    <SensorsTab showNotification={showNotification} />
                ) : null}
                {tab === "structures" ? (
                    <StructuresTab showNotification={showNotification} />
                ) : null}
            </div>
            <NavBawah />
        </>
    );
}
