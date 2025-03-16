import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import GrafikBtg from "../components/GrafikBtg";
import { useEffect, useState } from "react";

interface SensorProps {
    sensor: ISensor;
    ind_sensor: number;
}
interface IDataSensor {
    waktu: number;
    nilai: number;
}
interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    data: IDataSensor[];
    current_value: number;
    batas_atas: number;
}
const SensorDashboard: React.FC<SensorProps> = ({ sensor, ind_sensor }) => {
    const router = useRouter();
    const [sensorCur, setSensorCur] = useState<ISensor>(sensor);

    const hitungCurrentValueDanBatasAtas = (data: IDataSensor[]) => {
        let current_value = 0;
        let batas_atas = 0;
        if (data.length > 0) {
            current_value = Number(data[data.length - 1].nilai);
        }
        data.forEach((e) => {
            batas_atas = e.nilai > batas_atas ? e.nilai : batas_atas;
        });
        return { current_value, batas_atas };
    };

    useEffect(() => {
        const newWs = new WebSocket(
            `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/?idsensor=${sensor.id}`
        );
        newWs.onopen = () => {
            console.log(`Websocket berhasil terkoneksi di sensor ${sensor.id}`);
        };
        newWs.onerror = (err) => {
            console.error(`WebSocket eror di sensor ${sensor.id} : ` + err);
        };
        newWs.onmessage = (event) => {
            const datanya = JSON.parse(event.data);
            if (datanya.pesan) {
                console.error(datanya.pesan);
                return;
            }
            setSensorCur((prev) => {
                const { current_value, batas_atas } =
                    hitungCurrentValueDanBatasAtas([
                        ...prev.data,
                        {
                            waktu: datanya.waktu,
                            nilai: datanya.nilai,
                        },
                    ]);
                return {
                    ...prev,
                    data: [
                        ...prev.data,
                        {
                            waktu: datanya.waktu,
                            nilai: datanya.nilai,
                        },
                    ],
                    current_value,
                    batas_atas,
                };
            });
        };
        return () => {
            newWs.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generateWarna = (index: number) => {
        switch (index % 3) {
            case 0:
                return "bg-hijau";
            case 1:
                return "bg-coklat";
            case 2:
                return "bg-ungu";
            default:
                return "";
        }
    };

    useEffect(() => {
        console.log("Sensor Sensor.tsx : ");
        console.log(sensorCur);
    }, [sensorCur]);

    return (
        <div
            onClick={() => {
                router.push(`/sensor/${sensorCur.id}`);
            }}
            className={styles.itemGrid + " p-5"}
        >
            <p>ID : {sensorCur.id}</p>
            <div style={{ flex: 1 }} className="w-full my-2">
                <GrafikBtg
                    warna={generateWarna(ind_sensor)}
                    data={sensorCur.data}
                />
            </div>
            <p className="font-bold text-hitam">{sensorCur.label}</p>
            <p className="text-sm">Currect value : {sensorCur.current_value}</p>
            <p className="text-sm">Batas atas : {sensorCur.batas_atas}</p>
        </div>
    );
};

export default SensorDashboard;
