"use client";

import { MdLabelOutline } from "react-icons/md";
import NavAtas from "@/app/components/NavAtas";
import NavBawah from "@/app/components/NavBawah";
import React, { SyntheticEvent, useEffect, useState } from "react";
import { AiOutlineDeploymentUnit } from "react-icons/ai";
import { useRouter } from "next/navigation";
import useNotifStore from "@/store/notifStore";
import Notif from "@/app/components/Notif";

interface ISatuan {
    id: string;
    nama: string;
    satuan: string;
    string: boolean;
}

const Edit = ({ params }: { params: Promise<{ id: string }> }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        label: "",
        satuan: "",
    });
    // const [sensor, setSensor] = useState<ISensor | null>(null);
    const [satuan, setSatuan] = useState<ISatuan[]>([]);
    const { notifShow, notifText, showNotification } = useNotifStore();
    const [loading, setLoading] = useState("Loading ...");
    const [idSensorCur, setIdSensorCur] = useState("");

    useEffect(() => {
        async function fetchData() {
            const resSensor = await fetch(`/api/sensor/${(await params).id}`);
            const resJsonSensor = await resSensor.json();
            if (resSensor.status == 401) return router.replace("/");
            if (resSensor.status != 200) return setLoading(resJsonSensor.pesan);
            setFormData({
                label: resJsonSensor.label,
                satuan: resJsonSensor.id_struktur,
            });
            setIdSensorCur(resJsonSensor.id);

            const res = await fetch("/api/satuan");
            const resJson = await res.json();
            if (resJsonSensor.string) {
                setSatuan(
                    resJson.filter(
                        (s: ISatuan) => s.string == resJsonSensor.string
                    )
                );
            } else {
                setSatuan(resJson);
            }
            setLoading("");
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        const response = await fetch(`/api/sensor/${idSensorCur}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        showNotification(result.pesan);
        if (response.status == 200) router.push(`/sensor/${idSensorCur}`);
    };

    const generateDisabledSubmitBtn = () => {
        if (formData.label == "" || formData.satuan == "") {
            return true;
        }
        return false;
    };
    const generateClassSubmitBtn = () => {
        if (formData.label == "" || formData.satuan == "") {
            return "bg-gray-100 text-gray-400";
        }
        return "bg-coklat1 text-coklat";
    };

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <NavAtas
                title={"Edit Record"}
                subtitle={`ID : ${idSensorCur}`}
                back_url={`/sensor/${idSensorCur}`}
            />
            <div className="konten px-6 pb-6">
                {loading ? (
                    <p className="text-sm text-center">
                        <i>{loading}</i>
                    </p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p className="text-coklat font-bold">Label</p>
                        <label className="input-icon mb-1">
                            <div className="icon">
                                <MdLabelOutline />
                            </div>
                            <input
                                type="text"
                                required
                                placeholder="Record name"
                                value={formData.label}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        label: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <p className="text-coklat font-bold">Satuan</p>
                        <label className="input-icon mb-2">
                            <div className="icon">
                                <AiOutlineDeploymentUnit />
                            </div>
                            <select
                                value={formData.satuan}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        satuan: e.target.value,
                                    });
                                }}
                            >
                                {satuan.map((s, ind_s) => (
                                    <option key={ind_s} value={s.id}>
                                        {s.nama} ({s.satuan.replace("@", " / ")}
                                        )
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="submit"
                            disabled={generateDisabledSubmitBtn()}
                            className={
                                "btn w-full mt-7 " + generateClassSubmitBtn()
                            }
                        >
                            Save changes
                        </button>
                    </form>
                )}
            </div>
            <NavBawah />
        </>
    );
};
export default Edit;
