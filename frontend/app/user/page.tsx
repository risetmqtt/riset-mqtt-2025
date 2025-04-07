"use client";

import NavAtas from "../components/NavAtas";
import NavBawah from "../components/NavBawah";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useNotifStore from "@/store/notifStore";
import Notif from "../components/Notif";
import { HiOutlineMail } from "react-icons/hi";
import useUserStore from "@/store/userStore";
import { RiLockPasswordLine } from "react-icons/ri";

const User = () => {
    const router = useRouter();
    const { notifShow, notifText, showNotification } = useNotifStore();
    const { emailUser } = useUserStore();
    const [passkey, setPasskey] = useState("");
    const [perubaha, setPerubahan] = useState(false);

    useEffect(() => {
        async function fetchSatuan() {
            const res = await fetch("/api/passkey");
            const resJson = await res.json();
            setPasskey(resJson.passkey);
        }
        fetchSatuan();
    }, []);

    const handleLogout = () => {
        async function funFetchLogin() {
            await fetch("/api/logout", {
                method: "POST",
            });
            router.push("/");
        }
        funFetchLogin();
    };
    const handleSubmit = () => {
        async function funFetchPasskey() {
            const response = await fetch("/api/passkey", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ passkey }),
            });
            const result = await response.json();
            showNotification(result.pesan);
            if (response.status == 200) setPerubahan(false);
        }
        funFetchPasskey();
    };

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <NavAtas title={"Account"} subtitle={`Account information`} />
            <div className="konten px-6 pb-6">
                <p className="text-ungu font-bold">Email</p>
                <label className="input-icon mb-2">
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
                <p className="text-ungu font-bold">Passkey</p>
                <label className="input-icon mb-2">
                    <div className="icon">
                        <RiLockPasswordLine />
                    </div>
                    <input
                        type="text"
                        required
                        placeholder="Enter your passkey"
                        value={passkey}
                        onChange={(e) => {
                            setPasskey(e.target.value);
                            setPerubahan(true);
                        }}
                    />
                </label>
                <p className="text-sm text-abu mb-7">
                    *Passkey is used in Websocket URL parameters when writing
                    data to make your data more secure
                </p>
                {perubaha && (
                    <button
                        onClick={() => {
                            handleSubmit();
                        }}
                        className={"btn w-full bg-ungu1 text-ungu"}
                    >
                        Simpan perubahan
                    </button>
                )}
                <button
                    onClick={() => {
                        handleLogout();
                    }}
                    className={"btn w-full mt-1 bg-red-100 text-red-500"}
                >
                    Logout
                </button>
            </div>
            <NavBawah />
        </>
    );
};
export default User;
