"use client";
import { useEffect, useState } from "react";
import styles from "../uji.module.css";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { GoDotFill } from "react-icons/go";
import { FaCheck } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

interface ISensor {
    id: string;
    label: string;
    status: string;
}

export default function Dashboard() {
    const [sensor, setSensor] = useState<ISensor[]>([]);
    const [loading, setLoading] = useState("Loading...");
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function fetchSensor() {
            const res = await fetch("/api/fix/getall");
            const resJson = await res.json();
            if (res.status != 200) return setLoading(resJson.pesan);
            console.log(resJson);
            setSensor(resJson.map((s: ISensor) => ({ ...s, status: "" })));
            setLoading("");
        }
        fetchSensor();
    }, []);

    const handleFix = async () => {
        for (let i = 0; i < sensor.length; i++) {
            const s = sensor[i];
            setMessage(`Fixing ${s.label}...`);
            setSensor(
                sensor.map((s, ind_s) => {
                    if (ind_s == i) {
                        return { ...s, status: "process" };
                    }
                    return s;
                })
            );
            const res = await fetch(`/api/fix/${s.id}`);
            const resJson = await res.json();
            console.log(`Hasil fixing ${s.label} ==============`);
            console.log(resJson);
            if (res.status != 200) {
                setSensor(
                    sensor.map((s, ind_s) => {
                        if (ind_s == i) {
                            return { ...s, status: "fail" };
                        }
                        return s;
                    })
                );
            } else {
                setSensor(
                    sensor.map((s, ind_s) => {
                        if (ind_s == i) {
                            return { ...s, status: "success" };
                        }
                        return s;
                    })
                );
            }
        }
    };

    return (
        <>
            <div className="konten px-6 pb-6">
                {loading ? (
                    <p className="text-sm text-center">
                        <i>{loading}</i>
                    </p>
                ) : (
                    <>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => handleFix()}
                                className="btn text-hitam border border-black"
                            >
                                Fix data
                            </button>
                        </div>
                        {message && (
                            <p className="text-sm text-center bg-amber-100 text-amber-900 p-2 rounded-md my-2">
                                <i>{message}</i>
                            </p>
                        )}
                        <div className="flex flex-col gap-1">
                            {sensor.map((s, ind_s) => (
                                <div
                                    key={ind_s}
                                    className={"flex gap-2 items-center"}
                                >
                                    <div
                                        className={
                                            s.status == "process"
                                                ? styles.putar
                                                : ""
                                        }
                                    >
                                        {s.status == "" ? (
                                            <GoDotFill />
                                        ) : s.status == "process" ? (
                                            <AiOutlineLoading3Quarters />
                                        ) : s.status == "success" ? (
                                            <FaCheck />
                                        ) : (
                                            <IoMdClose />
                                        )}
                                    </div>
                                    <p>
                                        <b>{s.id}</b> |{s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
