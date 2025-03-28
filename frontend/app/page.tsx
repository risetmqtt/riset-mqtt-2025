"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import Notif from "./components/Notif";
import useNotifStore from "@/store/notifStore";
import useUserStore from "@/store/userStore";

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        sandi: "",
    });
    const { notifShow, notifText, showNotification } = useNotifStore();
    const [eyePass, setEyePass] = useState(false);
    const { setUser } = useUserStore();

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        console.log(formData);
        async function funFetchLogin() {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (response.status !== 200) {
                showNotification(result.pesan);
                return;
            }
            setUser(String(result.idUser), result.emailUser);
            router.push("/dashboard");
        }
        funFetchLogin();
    };

    return (
        <>
            <Notif show={notifShow} teks={notifText} />
            <div className="flex flex-col p-10" style={{ height: "100%" }}>
                <div
                    style={{ flex: "1" }}
                    className="flex flex-col justify-center items-center"
                >
                    <h1>IOT App</h1>
                    <p>Everything is connected</p>
                </div>
                <div
                    className="px-10 pt-8 pb-10"
                    style={{
                        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                        borderRadius: "2em",
                    }}
                >
                    <h1 className="mb-3">Login</h1>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="input1" className="input-icon mb-2">
                            <div className="icon">
                                <MdOutlineEmail />
                            </div>
                            <input
                                id="input1"
                                type="email"
                                name="email"
                                required
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <label htmlFor="input2" className="input-icon">
                            <div className="icon">
                                <TbLockPassword />
                            </div>
                            <input
                                id="input2"
                                type={eyePass ? "text" : "password"}
                                required
                                name="sandi"
                                placeholder="Sandi"
                                value={formData.sandi}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        sandi: e.target.value,
                                    })
                                }
                            />
                            <div
                                className={"icon" + (eyePass ? " active" : "")}
                                onClick={() => {
                                    setEyePass((prev) => !prev);
                                }}
                            >
                                {eyePass ? (
                                    <IoEyeOffOutline />
                                ) : (
                                    <IoEyeOutline />
                                )}
                            </div>
                        </label>
                        <button
                            type="submit"
                            className="bg-hijau1 btn text-hijau w-full mt-3"
                        >
                            Masuk
                        </button>
                    </form>
                    <div className="flex flex-col items-center mt-4 gap-1">
                        <p className="text-center text-sm ">
                            Belum punya akun?
                        </p>
                        <Link
                            className="btn text-hitam border border-black"
                            href={"/daftar"}
                        >
                            Daftar
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
