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
}

const GrafikBtg: React.FC<GrafikBtgProps> = ({ data, warna, limit = 20 }) => {
    const [datanya, setDatanya] = useState<IData[]>([]);
    const [batasAtas, setBatasAtas] = useState(0);
    useEffect(() => {
        const dataFilter = data.filter((e, ind_e) => {
            return ind_e >= data.length - limit;
        });
        setDatanya(dataFilter);
        let batasnya = 0;
        dataFilter.forEach((e) => {
            batasnya = Number(e.nilai) > batasnya ? Number(e.nilai) : batasnya;
        });
        setBatasAtas(batasnya);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const hitungHeight = (datanya: IData) => {
        return `${(Number(datanya.nilai) / batasAtas) * 100}%`;
    };
    return (
        <div
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
    );
};

export default GrafikBtg;
