"use client";

import { useEffect, useState } from "react";
import styles from "./grafikbtg.module.css";

interface IData {
    waktu: number;
    nilai: string;
}

interface GrafikBtgProps {
    data: IData[];
    warna: string;
    limit?: number;
    yAxis?: {
        show: boolean;
        batasAtas: number;
        batasBawah: number;
    };
}

const GrafikBtg: React.FC<GrafikBtgProps> = ({
    data,
    warna,
    limit = 20,
    yAxis,
}) => {
    const [datanya, setDatanya] = useState<IData[]>([]);
    useEffect(() => {
        const dataFilter = data.filter((e, ind_e) => {
            return ind_e >= data.length - limit;
        });
        setDatanya(dataFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const hitungHeight = (datanya: IData) => {
        return `${
            (Number(datanya.nilai) / (yAxis ? yAxis.batasAtas : 0)) * 100
        }%`;
    };
    return (
        <div className="flex gap-1 h-full">
            {yAxis?.show && (
                <div
                    className={
                        styles.axis + " flex flex-col justify-between pe-1"
                    }
                >
                    <p style={{ fontSize: "10px" }}>
                        {yAxis ? yAxis.batasAtas : 0}
                    </p>
                    <p style={{ fontSize: "10px" }}>
                        {yAxis ? yAxis.batasBawah : 0}
                    </p>
                </div>
            )}
            <div
                style={{ flex: "1" }}
                className={
                    styles.container + " h-full " + styles[warna.split("-")[1]]
                }
            >
                {datanya.map((d, ind_d) => (
                    <div
                        key={ind_d}
                        className={warna}
                        style={{
                            height: hitungHeight(d),
                            width: `${100 / limit - 1}%`,
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default GrafikBtg;
