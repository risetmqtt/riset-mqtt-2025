"use client";

import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useNotifStore from "@/store/notifStore";
import Notif from "../components/Notif";
import { HiOutlineMail } from "react-icons/hi";
import useUserStore from "@/store/userStore";

const User = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        label: "",
        id: "",
        satuan: "",
    });
    const { notifShow, notifText } = useNotifStore();
    const { emailUser } = useUserStore();

    useEffect(() => {
        async function fetchSatuan() {
            const res = await fetch("/api/satuan");
            const resJson = await res.json();
            setFormData({ ...formData, satuan: String(resJson[0].id) });
        }
        fetchSatuan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        console.log(formData);
        async function funFetchLogin() {
            await fetch("/api/logout", {
                method: "POST",
            });
            router.push("/");
        }
        funFetchLogin();
    };

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <NavAtas title={"Akun"} subtitle={`Informasi Akun`} />
            <div className="konten px-6 pb-6">
                <p className="text-ungu font-bold">Email</p>
                <label className="input-icon mb-1">
                    <div className="icon">
                        <HiOutlineMail />
                    </div>
                    <input
                        type="text"
                        required
                        placeholder="Email"
                        disabled
                        className="text-gray-500"
                        value={emailUser ? emailUser : ""}
                    />
                </label>
                <button
                    onClick={() => {
                        handleLogout();
                    }}
                    className={"btn w-full mt-7 bg-red-100 text-red-500"}
                >
                    Logout
                </button>
            </div>
            <NavBawah />
        </>
    );
};
export default User;
