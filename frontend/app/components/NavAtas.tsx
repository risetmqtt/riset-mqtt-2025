"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { CiMenuKebab } from "react-icons/ci";
import { MdChevronLeft } from "react-icons/md";

interface IMenu {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    teks: string;
    url: string;
}

interface NavbarProps {
    title: string;
    subtitle: string;
    back_url?: string;
    menu?: IMenu[];
}

const NavAtas: React.FC<NavbarProps> = ({
    title,
    subtitle,
    back_url,
    menu,
}) => {
    const [bukaMenu, setBukaMenu] = useState(false);
    const router = useRouter();
    const handleClickMenu = () => {
        setBukaMenu((prev) => !prev);
    };
    return (
        <>
            <div
                className={
                    "navbar-menu rounded-lg py-2 " + (bukaMenu ? "show" : "")
                }
            >
                {menu && (
                    <div className="flex flex-col px-3">
                        {menu.map((m, ind_m) => (
                            <span
                                style={{ cursor: "pointer" }}
                                className={
                                    "px-5 py-1 flex items-center gap-4" +
                                    (ind_m > 0 ? " border-t" : "")
                                }
                                key={ind_m}
                                onClick={() => {
                                    setBukaMenu(false);
                                    router.push(m.url);
                                }}
                            >
                                <p>{m.teks}</p>
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <nav
                className="flex items-center w-full px-6 py-6 gap-2"
                style={{
                    backgroundColor: "white",
                    zIndex: 3,
                    // boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                }}
            >
                {back_url && (
                    <div style={{ width: "30px" }}>
                        <Link href={back_url}>
                            <MdChevronLeft size={26} color="black" />
                        </Link>
                    </div>
                )}
                <div style={{ flex: "1" }} className="flex flex-col">
                    <h2>{title}</h2>
                    <p className="text-gray-400 text-sm">{subtitle}</p>
                </div>
                <div style={{ width: "30px" }}>
                    {menu && (
                        <button
                            className="flex items-center"
                            onClick={handleClickMenu}
                        >
                            <CiMenuKebab size={24} />
                        </button>
                    )}
                </div>
            </nav>
        </>
    );
};

export default NavAtas;
