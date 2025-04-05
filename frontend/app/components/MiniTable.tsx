"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./minitable.module.css";

interface IData {
    waktu: number;
    nilai: string;
}

interface GrafikBtgProps {
    data: IData[];
    warna: string;
    limit?: number;
}

function formatTimeFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

const MiniTable: React.FC<GrafikBtgProps> = ({ data, warna, limit = 10 }) => {
    const [datanya, setDatanya] = useState<IData[]>([]);
    const containerElm = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const dataFilter = data.filter((e, ind_e) => {
            return ind_e >= data.length - limit;
        });
        setDatanya(dataFilter);

        setTimeout(() => {
            if (containerElm.current) {
                containerElm.current.scrollTop =
                    containerElm.current.scrollHeight;
            }
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    return (
        <div
            ref={containerElm}
            className={
                styles.container + " h-full " + styles[warna.split("-")[1]]
            }
            style={{ position: "relative", overflow: "auto" }}
        >
            <div
                style={{ position: "absolute" }}
                className="py-2 px-1 flex flex-col gap-1"
            >
                {datanya.map((d, ind_d) => (
                    <div
                        key={ind_d}
                        className={"flex gap-2"}
                        style={{ fontSize: "12px" }}
                    >
                        <p>{formatTimeFromTimestamp(d.waktu)}</p>
                        <p
                            className="text-gray-900"
                            style={{ textAlign: "left", lineHeight: "15px" }}
                        >
                            {d.nilai}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MiniTable;
