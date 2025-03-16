"use client";
import { useEffect, useState } from "react";
import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";
import SensorDashboard from "./Sensor";

interface IDataSensor {
    waktu: number;
    nilai: number;
}

interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    data: IDataSensor[];
    current_value: number;
    batas_atas: number;
}

export default function Dashboard() {
    const router = useRouter();
    const [sensor, setSensor] = useState<ISensor[]>([]);
    const [loading, setLoading] = useState("Loading...");
    // const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        async function fetchSensor() {
            const res = await fetch("/api/sensor");
            const resJson = await res.json();
            if (res.status == 401) return router.replace("/");
            if (res.status != 200) return setLoading(resJson.pesan);
            setSensor(
                resJson.map((r: ISensor) => {
                    const { current_value, batas_atas } =
                        hitungCurrentValueDanBatasAtas(r.data);
                    return {
                        ...r,
                        current_value,
                        batas_atas,
                    };
                })
            );
            setLoading("");
        }
        fetchSensor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hitungCurrentValueDanBatasAtas = (data: IDataSensor[]) => {
        let current_value = 0;
        let batas_atas = 0;
        if (data.length > 0) {
            current_value = Number(data[data.length - 1].nilai);
        }
        data.forEach((e) => {
            batas_atas = e.nilai > batas_atas ? e.nilai : batas_atas;
        });
        return { current_value, batas_atas };
    };

    useEffect(() => {
        console.log("Sensor page.tsx : ");
        console.log(sensor);
    }, [sensor]);

    return (
        <>
            <NavAtas
                title="Hai, Galih!"
                subtitle="Dashboard"
                menu={[
                    {
                        url: "/",
                        teks: "Tambah",
                    },
                    {
                        url: "/",
                        teks: "Tambah AWdwqdw",
                    },
                    {
                        url: "/",
                        teks: "Tambah AWdwqdw",
                    },
                ]}
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
                            />
                        ))}
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
