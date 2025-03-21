"use client";
import { useEffect, useState } from "react";
import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import styles from "./uji.module.css";
import { useRouter } from "next/navigation";

interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    data: {
        waktu: number;
        nilai?: number;
        celcius?: number;
    }[];
}

// interface IData {
//     waktu: number;
//     nilai?: number;
//     celcius?: number;
// }

export default function Dashboard() {
    const router = useRouter();
    const [sensor, setSensor] = useState<ISensor[]>([]);
    const [loading, setLoading] = useState("Loading...");
    // const [data, setData] = useState<IData[]>();
    const [socket, setSocket] = useState<WebSocket[] | null[]>([]);

    useEffect(() => {
        async function fetchSensor() {
            const res = await fetch("/api/sensor");
            const resJson = await res.json();
            if (res.status == 401) return router.replace("/");
            if (res.status != 200) return setLoading(resJson.pesan);
            console.log(resJson);
            const newWsDum = [] as WebSocket[];
            resJson.forEach((s: ISensor, ind_s: number) => {
                newWsDum[ind_s] = new WebSocket(
                    `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/?idsensor=${s.id}`
                );
                newWsDum[ind_s].onopen = () => {
                    console.log("Websocket berhasil terkoneksi 00001");
                };
                newWsDum[ind_s].onerror = (err) => {
                    console.error("WebSocket eror : " + err);
                };
                return () => {
                    newWsDum[ind_s].close();
                };
            });
            setSocket(newWsDum);
            setSensor(resJson);
            setLoading("");
        }
        fetchSensor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (socket[index] && socket[index].readyState === WebSocket.OPEN) {
            socket[index].send(e.target.value);
        } else {
            console.warn("WebSocket belum siap atau tidak tersedia.");
        }
    };

    return (
        <>
            <NavAtas title="Uji Sensor" subtitle="Dashboard" />
            <div className="konten px-6 pb-6">
                {loading ? (
                    <p className="text-sm text-center">
                        <i>{loading}</i>
                    </p>
                ) : (
                    <div className={styles.grid}>
                        {sensor.map((s, ind_s) => (
                            <div
                                key={ind_s}
                                className={styles.itemGrid + " p-5"}
                            >
                                <p>ID : {s.id}</p>
                                <p className="font-bold text-hitam">
                                    {s.label}
                                </p>
                                <p className="text-sm">Currect value : 220</p>
                                <input
                                    type="range"
                                    onChange={(e) => {
                                        handleChange(ind_s, e);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
