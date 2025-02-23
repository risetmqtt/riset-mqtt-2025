"use client";

import GrafikBtg from "@/app/components/GrafikBtg";
import NavAtas from "@/app/components/NavAtas";
import NavBawah from "@/app/components/NavBawah";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiUser } from "react-icons/fi";

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
    satuan: string;
}

interface IUser {
    id: string;
    email: string;
    status: string;
}

export default function Sensor({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sensor, setSensor] = useState<ISensor>({
        id: "00000",
        label: "Loading",
        id_struktur: 1,
        data: [],
        current_value: 0,
        batas_atas: 0,
        satuan: "",
    });
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [user, setUser] = useState<IUser[]>([]);

    const hitungCurrentValue = (data: IDataSensor[]) => {
        let current_value = 0;
        if (data.length > 0) {
            if (data[0].nilai) {
                current_value = Number(data[data.length - 1].nilai);
            } else if (data[0].celcius) {
                current_value = Number(data[data.length - 1].celcius);
            }
        }
        return current_value;
    };

    useEffect(() => {
        async function fetchData() {
            const respoonse = await fetch(`/api/sensor/${(await params).id}`);
            const resJson = await respoonse.json();
            if (respoonse.status == 401) return router.replace("/");
            if (respoonse.status != 200) return setLoading(resJson.pesan);
            setSensor(resJson);

            const resUser = await fetch(
                `/api/sensor/userlain/${(await params).id}`
            );
            const resUserJson = await resUser.json();
            if (resUser.status == 401) return router.replace("/");
            if (resUser.status != 200) return setLoading(resUserJson.pesan);
            setUser(resUserJson);

            setLoading(false);
        }
        fetchData();

        const newWs = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URL}`);
        newWs.onopen = () => {
            setSocket(newWs);
        };
        newWs.onerror = (err) => {
            console.log("WebSocket eror : ");
            console.log(err);
        };
        newWs.onmessage = (event) => {
            const datanya = JSON.parse(event.data);
            if (datanya.id == sensor.id) {
                const current_value = hitungCurrentValue(sensor.data);
                setSensor({
                    ...sensor,
                    data: [
                        ...sensor.data,
                        sensor.id_struktur == 1
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
                });
            }
        };
        return () => {
            newWs.close();
        };
    }, []);

    function timeDifference(current: any, previous: any) {
        var msPerMinute = 60 * 1000;
        var msPerHour = msPerMinute * 60;
        var msPerDay = msPerHour * 24;
        var msPerMonth = msPerDay * 30;
        var msPerYear = msPerDay * 365;

        var elapsed = current - previous;

        if (elapsed < msPerMinute) {
            return Math.round(elapsed / 1000) + " sec";
        } else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + " min";
        } else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + " hours";
        } else if (elapsed < msPerMonth) {
            return Math.round(elapsed / msPerDay) + " days";
        } else if (elapsed < msPerYear) {
            return Math.round(elapsed / msPerMonth) + " months";
        } else {
            return Math.round(elapsed / msPerYear) + " years ago";
        }
    }

    return (
        <>
            <NavAtas
                title={sensor.label}
                subtitle={`ID : ${sensor.id}`}
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
                    <div>
                        <p className="text-hijau">Current value</p>
                        <h1 className="mb-2">
                            120 {sensor.satuan.split("@")[0]}
                        </h1>
                        <div className="w-full flex gap-2 bg-hijau1 p-4 rounded-lg mb-3">
                            <div>
                                <div
                                    style={{
                                        borderRight: "1px solid var(--hijau)",
                                        height: "100px",
                                    }}
                                    className="pe-2 flex flex-col justify-between items-end"
                                >
                                    <p style={{ fontSize: "12px" }}>120v</p>
                                    <p style={{ fontSize: "12px" }}>10v</p>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    className="w-full pt-2"
                                    style={{ height: "100px" }}
                                >
                                    <GrafikBtg
                                        warna={"bg-hijau"}
                                        data={sensor.data}
                                        limit={50}
                                    />
                                </div>
                                <div className="flex justify-between">
                                    <p style={{ fontSize: "12px" }}>12:00</p>
                                    <p style={{ fontSize: "12px" }}>17:29</p>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-bold mb-1">Keterangan</h3>
                        <p className="text-abu">
                            Life time :{" "}
                            {sensor.data.length > 0
                                ? timeDifference(
                                      Date.now(),
                                      sensor.data[0].waktu
                                  )
                                : "Menunggu data pertama"}
                        </p>
                        <p className="text-abu">
                            Websocket status :{" "}
                            <b className={socket ? "text-hijau" : "text-merah"}>
                                {socket ? "Connected" : "Disconnect"}
                            </b>
                        </p>
                        <h3 className="font-bold m-0 mt-3">Pengguna lain</h3>
                        <p
                            className="text-abu mb-1"
                            style={{ fontSize: "12px", marginTop: "-5px" }}
                        >
                            Pengguna lain hanya dapat melihat
                        </p>
                        <div>
                            {user.map((u, ind_u) => (
                                <div
                                    key={ind_u}
                                    className="flex w-full items-center gap-2 text-abu"
                                >
                                    <FiUser size={14} />
                                    <p style={{ flex: 1 }}>{u.email}</p>
                                    <p>IDUSER{u.id}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
