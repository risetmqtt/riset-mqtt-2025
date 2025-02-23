"use client";

import { useEffect, useState } from "react";
import styles from "./grafikbtg.module.css";

interface IData {
    waktu: number;
    nilai?: number;
    celcius?: number;
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
        console.log("cek ini dari grafik btg");
        const dataFilter = data.filter((e, ind_e) => {
            return ind_e >= data.length - limit;
        });
        setDatanya(dataFilter);
        let batasnya = 0;
        dataFilter.forEach((e) => {
            if (e.nilai) {
                batasnya = e.nilai > batasnya ? e.nilai : batasnya;
            } else if (e.celcius) {
                batasnya = e.celcius > batasnya ? e.celcius : batasnya;
            }
        });
        setBatasAtas(batasnya);
    }, [data]);

    const hitungHeight = (datanya: IData) => {
        if (datanya.nilai) {
            return `${(datanya.nilai / batasAtas) * 100}%`;
        }
        if (datanya.celcius) {
            return `${(datanya.celcius / batasAtas) * 100}%`;
        }
        return "";
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
