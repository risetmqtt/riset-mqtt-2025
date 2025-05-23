"use client";
import { useEffect, useState } from "react";
import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";
import SensorDashboard from "./Sensor";
import useNotifStore from "@/store/notifStore";
import Notif from "../components/Notif";
import useUserStore from "@/store/userStore";

interface IDataSensor {
    id: number;
    waktu: number;
    nilai: string;
}

interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    data: IDataSensor[];
    current_value: number;
    batas_bawah: number;
    batas_atas: number;
    satuan: string;
    string: boolean;
}

const limitData = 17;

export default function Dashboard() {
    const router = useRouter();
    const [sensor, setSensor] = useState<ISensor[]>([]);
    const [loading, setLoading] = useState("Loading...");
    const { notifShow, notifText } = useNotifStore();
    const { emailUser } = useUserStore();

    useEffect(() => {
        async function fetchSensor() {
            const res = await fetch("/api/sensor");
            const resJson = await res.json();
            if (res.status == 401) return router.replace("/");
            if (res.status != 200) return setLoading(resJson.pesan);
            setSensor(resJson);
            setLoading("");
        }
        fetchSensor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <NavAtas
                title={`Hai, ${emailUser?.split("@")[0]}`}
                subtitle="Dashboard"
            />
            <div className="konten px-6 pb-6">
                {loading ? (
                    <p className="text-sm text-center">
                        <i>{loading}</i>
                    </p>
                ) : (
                    <div className={styles.grid}>
                        {sensor.map((s, ind_s) => (
                            <SensorDashboard
                                key={ind_s}
                                sensor={s}
                                ind_sensor={ind_s}
                                limit={limitData}
                            />
                        ))}
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
