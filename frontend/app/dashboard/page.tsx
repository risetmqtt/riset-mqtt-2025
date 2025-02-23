"use client";
import { useEffect, useState } from "react";
import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";
import GrafikBtg from "../components/GrafikBtg";

interface IDataSensor {
    waktu: number;
    nilai?: number;
    celcius?: number;
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
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        async function fetchSensor() {
            const res = await fetch("/api/sensor");
            const resJson = await res.json();
            if (res.status == 401) return router.replace("/");
            if (res.status != 200) return setLoading(resJson.pesan);
            setSensor(
                resJson.map((r: ISensor, i: number) => {
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

        const newWs = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URL}`);
        newWs.onopen = () => {
            console.log("Websocket berhasil terkoneksi");
            setSocket(newWs);
        };
        newWs.onerror = (err) => {
            console.error("WebSocket eror : " + err);
        };
        newWs.onmessage = (event) => {
            const datanya = JSON.parse(event.data);
            setSensor((prevSensor) =>
                prevSensor.map((s, i) => {
                    const { current_value, batas_atas } =
                        hitungCurrentValueDanBatasAtas(s.data);
                    return s.id === datanya.id
                        ? {
                              ...s,
                              data: [
                                  ...s.data,
                                  s.id_struktur == 1
                                      ? {
                                            waktu: datanya.waktu,
                                            nilai: datanya.nilai,
                                        }
                                      : {
                                            waktu: datanya.waktu,
                                            celcius: datanya.nilai,
                                        },
                              ],
                              current_value,
                              batas_atas,
                          }
                        : s;
                })
            );
        };
        return () => {
            newWs.close();
        };
    }, []);

    const hitungCurrentValueDanBatasAtas = (data: IDataSensor[]) => {
        let current_value = 0;
        let batas_atas = 0;
        if (data.length > 0) {
            if (data[0].nilai) {
                current_value = Number(data[data.length - 1].nilai);
            } else if (data[0].celcius) {
                current_value = Number(data[data.length - 1].celcius);
            }
        }
        data.forEach((e) => {
            if (e.nilai) {
                batas_atas = e.nilai > batas_atas ? e.nilai : batas_atas;
            } else if (e.celcius) {
                batas_atas = e.celcius > batas_atas ? e.celcius : batas_atas;
            }
        });
        return { current_value, batas_atas };
    };

    useEffect(() => {
        console.log("Sensor : ");
        console.log(sensor);
    }, [sensor]);

    const generateWarna = (index: number) => {
        switch (index % 3) {
            case 0:
                return "bg-hijau";
            case 1:
                return "bg-coklat";
            case 2:
                return "bg-ungu";
            default:
                return "";
        }
    };

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
                            <div
                                onClick={() => {
                                    router.push(`/sensor/${s.id}`);
                                }}
                                key={ind_s}
                                className={styles.itemGrid + " p-5"}
                            >
                                <p>ID : {s.id}</p>
                                <div
                                    style={{ flex: 1 }}
                                    className="w-full my-2"
                                >
                                    <GrafikBtg
                                        warna={generateWarna(ind_s)}
                                        data={s.data}
                                    />
                                </div>
                                <p className="font-bold text-hitam">
                                    {s.label}
                                </p>
                                <p className="text-sm">
                                    Currect value : {s.current_value}
                                </p>
                                <p className="text-sm">
                                    Batas atas : {s.batas_atas}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
