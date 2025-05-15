import { create } from "zustand";

interface SensorData {
    [id: string]: ISensor; // Menyimpan data sensor berdasarkan ID
}

interface WebSocketStore {
    sockets: Record<string, WebSocket>;
    sensorData: SensorData;
    pesanSocket: {
        pesan: string;
        success: boolean;
    };
    limitDataSocket: number;
    updateSensorData: (
        idSensor: string,
        datanya: IDataUpdateSensorData
    ) => void;
    emptyPesanSocket: () => void;
    connectWebSocket: (
        sensor: ISensor,
        limit: number,
        passkey?: string
    ) => void;
    disconnectWebSocket: (sensor: ISensor) => void;
}
interface IDataUpdateSensorData {
    index: number;
    nilai: string;
    action: string;
}
interface IDataSensor {
    id: number;
    waktu: number;
    nilai: string;
}
interface ISensor {
    id: string;
    label: string;
    id_struktur: number;
    data: IDataSensor[];
    current_value: number | string;
    batas_atas: number;
    batas_bawah: number;
    satuan: string;
    string: boolean;
}

const hitungCurrentValueDanBatasAtas = (
    data: IDataSensor[],
    limit: number,
    string: boolean
) => {
    const dataLimit = [...data];
    dataLimit.splice(0, dataLimit.length - limit);
    let current_value = null;
    let batas_atas = 0;
    let batas_bawah = dataLimit.length > 0 ? Number(dataLimit[0].nilai) : 0;
    if (dataLimit.length > 0) {
        current_value = string
            ? dataLimit[dataLimit.length - 1].nilai
            : Number(dataLimit[dataLimit.length - 1].nilai);
    } else {
        current_value = string ? "" : 0;
    }
    dataLimit.forEach((e) => {
        batas_atas =
            Number(e.nilai) > batas_atas ? Number(e.nilai) : batas_atas;
        batas_bawah =
            Number(e.nilai) < batas_bawah ? Number(e.nilai) : batas_bawah;
    });
    return { current_value, batas_atas, batas_bawah };
};

const useWebSocketStore = create<WebSocketStore>((set, get) => ({
    sockets: {},
    sensorData: {},
    pesanSocket: {
        pesan: "",
        success: false,
    },
    limitDataSocket: 0,

    updateSensorData: (idSensor, datanya) => {
        set((state) => {
            const existingSensor = state.sensorData[idSensor];
            let updatedData: IDataSensor[] = [];
            if (datanya.action) {
                if (datanya.action == "delete") {
                    updatedData = existingSensor.data.filter(
                        (d, ind_d) => ind_d != datanya.index
                    );
                } else if (datanya.action == "edit") {
                    updatedData = existingSensor.data.map((d, ind_d) => {
                        if (ind_d == datanya.index) {
                            return {
                                ...d,
                                nilai: datanya.nilai,
                            };
                        } else return d;
                    });
                }
            }
            const { current_value, batas_atas, batas_bawah } =
                hitungCurrentValueDanBatasAtas(
                    updatedData,
                    state.limitDataSocket,
                    state.sensorData[idSensor].string
                );
            return {
                sensorData: {
                    ...state.sensorData,
                    [idSensor]: {
                        ...state.sensorData[idSensor],
                        data: updatedData,
                        current_value,
                        batas_atas,
                        batas_bawah,
                    },
                },
            };
        });
    },

    emptyPesanSocket: () => {
        set((state) => ({
            pesanSocket: {
                pesan: "",
                success: false,
            },
        }));
    },

    connectWebSocket: (sensor: ISensor, limit: number, passkey = "") => {
        if (get().sockets[sensor.id]) return; // Jika sudah ada, tidak perlu membuat baru

        const ws = new WebSocket(
            `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/?idsensor=${sensor.id}&passkey=${passkey}`
        );

        ws.onopen = () => {
            console.log(`WebSocket ${sensor.id} connected`);
            const { current_value, batas_atas, batas_bawah } =
                hitungCurrentValueDanBatasAtas(
                    [...sensor.data],
                    limit,
                    sensor.string
                );
            set((state) => ({
                sensorData: {
                    ...state.sensorData,
                    [sensor.id]: {
                        ...sensor,
                        current_value,
                        batas_atas,
                        batas_bawah,
                    },
                },
            }));
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (!data.pesan) {
                set((state) => {
                    const existingSensor = state.sensorData[sensor.id];
                    if (!existingSensor) return state; // Jika sensor tidak ditemukan, tidak perlu update
                    let updatedData: IDataSensor[] = [];
                    if (data.action) {
                        if (data.action == "delete") {
                            updatedData = existingSensor.data.filter(
                                (d, ind_d) => ind_d != data.index
                            );
                        } else if (data.action == "edit") {
                            updatedData = existingSensor.data.map(
                                (d, ind_d) => {
                                    if (ind_d == data.index) {
                                        return {
                                            ...d,
                                            nilai: !sensor.string
                                                ? Number(data.nilai)
                                                : data.nilai,
                                        };
                                    } else return d;
                                }
                            );
                        }
                    } else {
                        updatedData = [...existingSensor.data, data]; // Data baru ditambahkan ke array yang ada
                    }
                    const { current_value, batas_atas, batas_bawah } =
                        hitungCurrentValueDanBatasAtas(
                            updatedData,
                            limit,
                            sensor.string
                        );
                    return {
                        sensorData: {
                            ...state.sensorData,
                            [sensor.id]: {
                                ...existingSensor,
                                data: updatedData, // Memastikan data bertambah terus
                                current_value,
                                batas_atas,
                                batas_bawah,
                            },
                        },
                    };
                });
            } else {
                set((state) => ({
                    pesanSocket: data,
                }));
            }
        };

        ws.onclose = () => {
            console.log(`WebSocket ${sensor.id} closed`);
            set((state) => {
                const updatedSockets = { ...state.sockets };
                delete updatedSockets[sensor.id];
                return { sockets: updatedSockets };
            });
        };

        set((state) => ({
            limitDataSocket: limit,
            sockets: { ...state.sockets, [sensor.id]: ws },
        }));
    },

    disconnectWebSocket: (sensor: ISensor) => {
        const socket = get().sockets[sensor.id];
        if (socket) {
            socket.close();
            set((state) => {
                const updatedSockets = { ...state.sockets };
                delete updatedSockets[sensor.id];
                return { sockets: updatedSockets };
            });
        }
    },
}));

export default useWebSocketStore;
