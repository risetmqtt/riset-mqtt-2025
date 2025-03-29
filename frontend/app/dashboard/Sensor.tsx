import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import GrafikBtg from "../components/GrafikBtg";
import { useEffect } from "react";
import useWebSocketStore from "@/store/websocketStore";

interface SensorProps {
    sensor: ISensor;
    ind_sensor: number;
    limit: number;
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
    batas_bawah: number;
    satuan: string;
}
const SensorDashboard: React.FC<SensorProps> = ({
    sensor,
    ind_sensor,
    limit,
}) => {
    const router = useRouter();
    const { connectWebSocket, disconnectWebSocket, sensorData } =
        useWebSocketStore();

    useEffect(() => {
        connectWebSocket(sensor, limit);
        return () => {
            disconnectWebSocket(sensor);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensor.id, connectWebSocket, disconnectWebSocket]);

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

    return (
        <>
            {sensorData[sensor.id] ? (
                <div
                    onClick={() => {
                        router.push(`/sensor/${sensor.id}`);
                    }}
                    className={styles.itemGrid + " p-5"}
                >
                    <p>ID : {sensor.id}</p>
                    <div style={{ flex: 1 }} className="w-full my-2">
                        <GrafikBtg
                            warna={generateWarna(ind_sensor)}
                            data={sensorData[sensor.id].data}
                        />
                    </div>
                    <p className="font-bold text-hitam">{sensor.label}</p>
                    <p className="text-sm">
                        Currect value : {sensorData[sensor.id].current_value}
                        {sensorData[sensor.id].satuan.split("@")[1]}
                    </p>
                    <p className="text-sm">
                        Upper limit : {sensorData[sensor.id].batas_atas}
                        {sensorData[sensor.id].satuan.split("@")[1]}
                    </p>
                </div>
            ) : (
                <p className="text-sm text-center">
                    <i>Membuat socket client ...</i>
                </p>
            )}
        </>
    );
};

export default SensorDashboard;
