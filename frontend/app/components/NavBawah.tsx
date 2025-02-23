"use client";

import Link from "next/link";
import { FiUser } from "react-icons/fi";
import { GoHome } from "react-icons/go";
import { IoAdd } from "react-icons/io5";

export default function NavBawah() {
    return (
        <nav
            className="flex px-7"
            style={{ height: "60px", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}
        >
            <Link
                href={"/dashboard"}
                style={{ flex: 1 }}
                className="flex justify-center items-center"
            >
                <GoHome size={20} />
            </Link>
            <Link
                href={"/add"}
                style={{ flex: 1 }}
                className="flex justify-center items-center"
            >
                <IoAdd size={20} />
            </Link>
            <Link
                href={"/user"}
                style={{ flex: 1 }}
                className="flex justify-center items-center"
            >
                <FiUser size={20} />
            </Link>
        </nav>
    );
}
