import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import GrafikBtg from "../components/GrafikBtg";
import { useEffect } from "react";
import useWebSocketStore from "@/store/websocketStore";
import MiniTable from "../components/MiniTable";

interface SensorProps {
    sensor: ISensor;
    ind_sensor: number;
    limit: number;
}
interface IDataSensor {
    waktu: number;
    nilai: string;
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
    string: boolean;
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
                        {sensorData[sensor.id].string ? (
                            <MiniTable
                                warna={generateWarna(ind_sensor)}
                                data={sensorData[sensor.id].data}
                            />
                        ) : (
                            <GrafikBtg
                                warna={generateWarna(ind_sensor)}
                                data={sensorData[sensor.id].data}
                                yAxis={{
                                    show: true,
                                    batasAtas: sensorData[sensor.id].batas_atas,
                                    batasBawah:
                                        sensorData[sensor.id].batas_bawah,
                                }}
                                limit={limit}
                            />
                        )}
                    </div>
                    <p className="font-bold text-hitam">{sensor.label}</p>
                    {!sensorData[sensor.id].string ? (
                        <>
                            <p className="text-sm">
                                Last value :{" "}
                                {sensorData[sensor.id].current_value}
                                {sensorData[sensor.id].satuan.split("@")[1] ==
                                "-"
                                    ? ""
                                    : sensorData[sensor.id].satuan.split(
                                          "@"
                                      )[1]}
                            </p>
                            {/* <p className="text-sm">
                                Upper limit : {sensorData[sensor.id].batas_atas}
                                {sensorData[sensor.id].satuan.split("@")[1] ==
                                "-"
                                    ? ""
                                    : sensorData[sensor.id].satuan.split(
                                          "@"
                                      )[1]}
                            </p> */}
                        </>
                    ) : (
                        <>
                            <p className="text-sm">*Last 10 data only</p>
                        </>
                    )}
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
