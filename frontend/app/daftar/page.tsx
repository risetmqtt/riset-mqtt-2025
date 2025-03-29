"use client";

import useNotifStore from "@/store/notifStore";
import Link from "next/link";
import { SyntheticEvent, useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import Notif from "../components/Notif";

export default function Daftar() {
    const [formData, setFormData] = useState({
        email: "",
        sandi: "",
    });
    const { notifShow, notifText, showNotification } = useNotifStore();

    const [eyePass, setEyePass] = useState(false);
    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        console.log(formData);
        async function funFetchLogin() {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            console.log(result);
            showNotification(result.pesan);
            // router.push("/dashboard");
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
                    <form onSubmit={handleSubmit}>
                        <h1 className="mb-3">Sign up</h1>
                        <label htmlFor="input1" className="input-icon mb-2">
                            <div className="icon">
                                <MdOutlineEmail />
                            </div>
                            <input
                                id="input1"
                                type="email"
                                required
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    });
                                }}
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
                                placeholder="Password"
                                value={formData.sandi}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        sandi: e.target.value,
                                    });
                                }}
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
                            Sign up
                        </button>
                        <div className="flex flex-col items-center mt-4 gap-1">
                            <p className="text-center text-sm ">
                                Already have an account?
                            </p>
                            <Link
                                href={"/"}
                                type="submit"
                                className="btn bg-hijau text-white"
                            >
                                Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
