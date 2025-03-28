"use client";

import GrafikBtg from "@/app/components/GrafikBtg";
import NavAtas from "@/app/components/NavAtas";
import NavBawah from "@/app/components/NavBawah";
import useWebSocketStore from "@/store/websocketStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiUser } from "react-icons/fi";

interface IDataSensor {
    waktu: number;
    nilai: number;
}

// interface ISensor {
//     id: string;
//     label: string;
//     id_struktur: number;
//     data: IDataSensor[];
//     current_value: number;
//     batas_atas: number;
//     satuan: string;
// }
interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    data: IDataSensor[];
    current_value: number;
    batas_bawah: number;
    batas_atas: number;
    satuan: string;
}

interface IUser {
    id: string;
    email: string;
    status: string;
}

function timeDifference(current: number, previous: number) {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = current - previous;

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

const limitData = 50;

export default function Sensor({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState("Loading ...");
    const [sensor, setSensor] = useState<ISensor>({
        id: "00000",
        label: "Loading",
        id_struktur: 1,
        data: [],
        current_value: 0,
        batas_atas: 0,
        batas_bawah: 0,
        satuan: "",
    });
    const [user, setUser] = useState<IUser[]>([]);
    const { connectWebSocket, disconnectWebSocket, sensorData } =
        useWebSocketStore();

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

            setLoading("");
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (sensor.id !== "00000") {
            connectWebSocket(sensor, limitData);
            return () => {
                disconnectWebSocket(sensor);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensor.id, connectWebSocket, disconnectWebSocket]);

    return (
        <>
            <NavAtas
                title={sensor.label}
                subtitle={`ID : ${sensor.id}`}
                menu={[
                    {
                        url: `/edit/${sensor.id}`,
                        teks: "Edit konfigurasi",
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
                            {sensorData[sensor.id]
                                ? sensorData[sensor.id].current_value
                                : sensor.data[sensor.data.length - 1]
                                      .nilai}{" "}
                            {sensor.satuan.split("@")[0]}
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
                                    <p style={{ fontSize: "12px" }}>
                                        {sensorData[sensor.id]
                                            ? sensorData[sensor.id].batas_atas
                                            : "Nan"}
                                        {sensor.satuan.split("@")[1]}
                                    </p>
                                    <p style={{ fontSize: "12px" }}>
                                        {sensorData[sensor.id]
                                            ? sensorData[sensor.id].batas_bawah
                                            : "Nan"}
                                        {sensor.satuan.split("@")[1]}
                                    </p>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    className="w-full pt-2"
                                    style={{ height: "100px" }}
                                >
                                    <GrafikBtg
                                        warna={"bg-hijau"}
                                        data={
                                            sensorData[sensor.id]
                                                ? sensorData[sensor.id].data
                                                : sensor.data
                                        }
                                        limit={limitData}
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
                            <b
                                className={
                                    sensorData[sensor.id]
                                        ? "text-hijau"
                                        : "text-merah"
                                }
                            >
                                {sensorData[sensor.id]
                                    ? "Connected"
                                    : "Disconnect"}
                            </b>
                        </p>
                        <h3 className="font-bold m-0 mt-3">Pengguna lain</h3>
                        <p
                            className="text-abu mb-1"
                            style={{ fontSize: "12px", marginTop: "-5px" }}
                        >
                            Pengguna lain hanya dapat melihat
                        </p>
                        {user.length > 0 ? (
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
                        ) : (
                            <div>
                                <p className="text-abu">
                                    <i>Tidak ada pengguna lain</i>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
