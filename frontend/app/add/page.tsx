"use client";

import { MdLabelOutline } from "react-icons/md";
import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import React, { SyntheticEvent, useEffect, useState } from "react";
import { AiOutlineDeploymentUnit, AiOutlineTool } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { FiUser } from "react-icons/fi";
import { BiSolidSelectMultiple } from "react-icons/bi";
import useNotifStore from "@/store/notifStore";
import Notif from "../components/Notif";

interface IDataSensor {
    waktu: number;
    nilai: number;
}

interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    id_user: number;
    email: number;
    data: IDataSensor[];
    satuan: string;
}
interface IUser {
    id: string;
    email: string;
    status: string;
}

interface ISatuan {
    id: string;
    nama: string;
    satuan: string;
}

const Add = () => {
    const router = useRouter();
    const [select, setSelect] = useState("1");
    const [formData, setFormData] = useState({
        label: "",
        id: "",
        satuan: "",
    });
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState(false);
    const [exist, setExist] = useState(false);
    const [sensor, setSensor] = useState<ISensor | null>(null);
    const [user, setUser] = useState<IUser[]>([]);
    const [satuan, setSatuan] = useState<ISatuan[]>([]);
    const { notifShow, notifText, showNotification } = useNotifStore();

    useEffect(() => {
        async function fetchSatuan() {
            const res = await fetch("/api/satuan");
            const resJson = await res.json();
            setSatuan(resJson);
            setFormData({ ...formData, satuan: String(resJson[0].id) });
        }
        fetchSatuan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCheckAvailable = async () => {
        if (!formData.id) return;
        setChecking(true);
        setAvailable(false);
        setExist(false);
        setSensor(null);
        const res = await fetch(`/api/sensor/${formData.id}`);
        const resJson = await res.json();
        console.log(resJson);
        if (res.status == 401) return router.replace("/");
        if (resJson.pesan) {
            setAvailable(true);
            setChecking(false);
            return;
        }

        const resUser = await fetch(`/api/sensor/userlain/${formData.id}`);
        const resUserJson = await resUser.json();
        if (resUser.status == 401) return router.replace("/");
        console.log(resUserJson);
        setUser(resUserJson);
        setSensor(resJson);
        setFormData({ ...formData, label: resJson.label });
        setExist(true);
        setChecking(false);
    };

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        console.log(formData);
        if (select == "1") {
            //buat sensor baru
            const response = await fetch(`/api/sensor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            console.log(result);
            showNotification(result.pesan);
            if (response.status == 200) router.push("/dashboard");
        } else {
            const response = await fetch(
                `/api/sensor/userlain/${formData.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );
            const result = await response.json();
            console.log(result);
            showNotification(result.pesan);
            if (response.status == 200) router.push("/dashboard");
        }
    };

    const generateDisabledSubmitBtn = () => {
        if (select == "1") {
            if (formData.label == "" || formData.satuan == "") return true;
        } else {
            if (
                formData.id == "" ||
                formData.label == "" ||
                formData.satuan == ""
            )
                return true;
        }
        return false;
    };

    const generateClassSubmitBtn = () => {
        if (select == "1") {
            if (formData.label == "" || formData.satuan == "")
                return "bg-gray-100 text-gray-400";
        } else {
            if (
                formData.id == "" ||
                formData.label == "" ||
                formData.satuan == ""
            )
                return "bg-gray-100 text-gray-400";
        }
        return "bg-coklat1 text-coklat";
    };

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <NavAtas title={"Tambah Sensor"} subtitle={`Konfigurasi`} />
            <div className="konten px-6 pb-6">
                <form onSubmit={handleSubmit}>
                    <p className="text-coklat font-bold">Jenis Penambahan</p>
                    <label className="input-icon mb-2">
                        <div className="icon">
                            <BiSolidSelectMultiple />
                        </div>
                        <select
                            value={select}
                            onChange={(e) => {
                                setSelect(e.target.value);
                                setAvailable(false);
                                setExist(false);
                                setChecking(false);
                                setFormData({
                                    id: "",
                                    label: "",
                                    satuan: String(satuan[0].id),
                                });
                            }}
                        >
                            <option value="1">Sensor Baru</option>
                            <option value="2">Cari sensor</option>
                        </select>
                    </label>
                    {select == "1" ? (
                        <>
                            <p className="text-coklat font-bold">Label</p>
                            <label className="input-icon mb-1">
                                <div className="icon">
                                    <MdLabelOutline />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className={
                                        exist
                                            ? "text-gray-400"
                                            : "text-gray-900"
                                    }
                                    disabled={exist}
                                    placeholder="Nama sensor"
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
                                            {s.nama} (
                                            {s.satuan.replace("@", " / ")})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : (
                        <>
                            <p className="text-coklat font-bold">ID Sensor</p>
                            <label className="input-icon mb-2">
                                <div className="icon">
                                    <AiOutlineTool />
                                </div>
                                <input
                                    type="number"
                                    required
                                    placeholder="Nomor ID sensor"
                                    value={formData.id}
                                    onChange={(e) => {
                                        setAvailable(false);
                                        setExist(false);
                                        setChecking(false);
                                        setFormData({
                                            id: e.target.value,
                                            label: "",
                                            satuan: String(satuan[0].id),
                                        });
                                    }}
                                />
                            </label>
                            <button
                                type="button"
                                className={
                                    "px-3 mb-3 " +
                                    (available
                                        ? "bg-red-100 text-red-500"
                                        : exist
                                        ? "bg-hijau1 text-hijau"
                                        : "bg-coklat1 text-coklat")
                                }
                                style={{ borderRadius: "3em" }}
                                onClick={handleCheckAvailable}
                            >
                                {checking
                                    ? `Checking id ${formData.id}`
                                    : available
                                    ? "Sensor tidak ditemukan"
                                    : exist
                                    ? "Sensor ditemukan"
                                    : "Tes ketersediaan id sensor"}
                            </button>
                        </>
                    )}
                    {exist && (
                        <>
                            <p className="text-coklat font-bold">Label</p>
                            <label className="input-icon mb-1">
                                <div className="icon">
                                    <MdLabelOutline />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className={
                                        exist
                                            ? "text-gray-400"
                                            : "text-gray-900"
                                    }
                                    disabled={exist}
                                    placeholder="Nama sensor"
                                    value={formData.label}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            label: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            {exist && (
                                <p className="mb-5 text-abu text-sm">
                                    * Label hanya bisa diubah oleh pemilih alat
                                </p>
                            )}
                            <h2 className="mb-1">Pemilik Alat</h2>
                            <div className="flex w-full items-center gap-2 text-abu mb-5">
                                <FiUser size={14} />
                                <p style={{ flex: 1 }}>
                                    {available ? "Anda" : sensor?.email}
                                </p>
                                <p>
                                    {available
                                        ? ""
                                        : `IDUSER${sensor?.id_user}`}
                                </p>
                            </div>
                            <h3 className="font-bold m-0 mt-3">
                                Pengguna lain
                            </h3>
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
                        </>
                    )}
                    <button
                        type="submit"
                        disabled={generateDisabledSubmitBtn()}
                        className={
                            "btn w-full mt-7 " + generateClassSubmitBtn()
                        }
                    >
                        Tambahkan
                    </button>
                </form>
            </div>
            <NavBawah />
        </>
    );
};
export default Add;
