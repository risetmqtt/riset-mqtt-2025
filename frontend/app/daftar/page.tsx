"use client";

import Link from "next/link";
import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";

export default function Daftar() {
    const [eyePass, setEyePass] = useState(false);
    return (
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
                <h1 className="mb-3">Daftar</h1>
                <label htmlFor="input1" className="input-icon mb-2">
                    <div className="icon">
                        <MdOutlineEmail />
                    </div>
                    <input
                        id="input1"
                        type="email"
                        required
                        placeholder="Email"
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
                        placeholder="Sandi"
                    />
                    <div
                        className={"icon" + (eyePass ? " active" : "")}
                        onClick={() => {
                            setEyePass((prev) => !prev);
                        }}
                    >
                        {eyePass ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </div>
                </label>
                <div className="flex flex-col items-center mt-4 gap-1">
                    <p className="text-center text-sm ">Belum punya akun?</p>
                    <Link className="btn bg-hijau text-white" href={"/daftar"}>
                        Daftar
                    </Link>
                </div>
            </div>
        </div>
    );
}
