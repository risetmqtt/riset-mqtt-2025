"use client";

import GrafikBtg from "@/app/components/GrafikBtg";
import NavAtas from "@/app/components/NavAtas";
import NavBawah from "@/app/components/NavBawah";
import Notif from "@/app/components/Notif";
import Toast from "@/app/components/Toast";
import useNotifStore from "@/store/notifStore";
import useToastStore from "@/store/toastStore";
import useUserStore from "@/store/userStore";
import useWebSocketStore from "@/store/websocketStore";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { FaChartBar, FaDatabase } from "react-icons/fa";
import { FaTableList } from "react-icons/fa6";
import { FiEdit3, FiUser } from "react-icons/fi";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { PiMicrosoftExcelLogo } from "react-icons/pi";
import * as XLSX from "xlsx";

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
    current_value: number;
    batas_bawah: number;
    batas_atas: number;
    satuan: string;
    email: string;
    id_user: number;
    string: boolean;
    panjangData: number;
}

interface IUser {
    id: string;
    email: string;
    status: string;
}

interface IMenuNavbar {
    teks: string;
    url: string;
    type: string;
    teks_toast?: string;
}

function timeDifference(current: number, previous: number) {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + " sec";
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + " min";
    } else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + " hours";
    } else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + " days";
    } else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + " months";
    } else {
        return Math.round(elapsed / msPerYear) + " years ago";
    }
}

const limitData = 50;

function formatTgl(timestamp: number) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // bulan dimulai dari 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function formatJam(timestamp: number) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

export default function Sensor({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState("Loading ...");
    const [sensor, setSensor] = useState<ISensor>({
        id: "00000",
        label: "Loading",
        id_struktur: 1,
        data: [],
        current_value: 0,
        batas_atas: 0,
        batas_bawah: 0,
        satuan: "",
        email: "",
        id_user: 0,
        string: false,
        panjangData: 0,
    });
    const [user, setUser] = useState<IUser[]>([]);
    const {
        connectWebSocket,
        disconnectWebSocket,
        sensorData,
        sockets,
        pesanSocket,
        emptyPesanSocket,
        updateSensorData,
    } = useWebSocketStore();
    const { toastShow, toastText, toastURL } = useToastStore();
    const { emailUser } = useUserStore();
    const { notifShow, notifText } = useNotifStore();
    const [typeDisplay, setTypeDisplay] = useState("chart");
    const containerData = useRef<HTMLDivElement>(null);
    const tableElm = useRef<HTMLTableElement>(null);
    const [editData, setEditData] = useState(false);
    const [valueEditData, setValueEditData] = useState({
        isi: "",
        index: 0,
    });
    const { showNotification } = useNotifStore();
    const [passkey, setPasskey] = useState("");
    const [toastDelete, setToastDelete] = useState({
        show: false,
        teks: "",
    });
    const [menuNavbar, setMenuNavbar] = useState<IMenuNavbar[]>([]);

    useEffect(() => {
        if (sensor.email == emailUser) {
            setMenuNavbar([
                {
                    url: `/sensor/${sensor.id}/edit`,
                    teks: "Edit record",
                    type: "url",
                },
                {
                    url: `/api/sensor/reset/${sensor.id}`,
                    teks: "Reset data",
                    type: "toast",
                    teks_toast:
                        "Are you sure you want to delete all data in this record?",
                },
                {
                    url: `/api/sensor/delete/${sensor.id}`,
                    teks: "Delete record",
                    type: "toast",
                    teks_toast: "Are you sure you want to delete this record?",
                },
            ]);
        } else {
            setMenuNavbar([
                {
                    url: `/api/sensor/delete/${sensor.id}`,
                    teks: "Delete record",
                    type: "toast",
                    teks_toast: "Are you sure you want to delete this record?",
                },
            ]);
        }
    }, [emailUser, sensor]);

    useEffect(() => {
        async function fetchData() {
            const resPasskey = await fetch("/api/passkey");
            const resJsonPasskey = await resPasskey.json();
            setPasskey(resJsonPasskey.passkey);

            const respoonse = await fetch(`/api/sensor/${(await params).id}`);
            const resJson = await respoonse.json();
            if (respoonse.status == 401) return router.replace("/");
            if (respoonse.status != 200) return setLoading(resJson.pesan);
            if (resJson.string) setTypeDisplay("table");
            setSensor(resJson);

            const resUser = await fetch(
                `/api/sensor/userlain/${(await params).id}`
            );
            const resUserJson = await resUser.json();
            if (resUser.status == 401) return router.replace("/");
            if (resUser.status != 200) return setLoading(resUserJson.pesan);
            setUser(resUserJson);
            setLoading("");
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (sensor.id !== "00000") {
            connectWebSocket(sensor, limitData, passkey);
            return () => {
                disconnectWebSocket(sensor);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensor.id, connectWebSocket, disconnectWebSocket]);

    useEffect(() => {
        setTimeout(() => {
            if (containerData.current) {
                containerData.current.scrollTop =
                    containerData.current.scrollHeight;
            }
        }, 0);
    }, [sensorData, typeDisplay]);

    const generateBatasWaktu = (data: IDataSensor[], limit: number) => {
        const dataLimit = [...data];
        dataLimit.splice(0, dataLimit.length - limit);
        return dataLimit.length > 0
            ? {
                  batas_kiri: formatJam(dataLimit[0].waktu),
                  batas_kanan: formatJam(dataLimit[dataLimit.length - 1].waktu),
              }
            : {
                  batas_kiri: "00:00:00",
                  batas_kanan: "00:00:00",
              };
    };

    const handleExportExcel = () => {
        if (!tableElm.current) return;
        // ambil elemen tabel HTML
        const table = tableElm.current;
        // konversi tabel HTML ke worksheet
        const worksheet = XLSX.utils.table_to_sheet(table);
        // buat workbook dan tambahkan worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        // ekspor workbook ke file Excel
        XLSX.writeFile(workbook, `Tabel ${sensor.label}.xlsx`);
    };

    const handleSubmitEdit = async (e: SyntheticEvent) => {
        e.preventDefault();
        const formData = {
            nilai: valueEditData.isi.toString(),
            index: valueEditData.index,
            action: "edit",
        };
        if (
            sockets[sensor.id] &&
            sockets[sensor.id].readyState === WebSocket.OPEN
        ) {
            sockets[sensor.id].send(JSON.stringify(formData));
        }
    };
    const handleDelete = async (e: SyntheticEvent) => {
        e.preventDefault();
        const formData = {
            nilai: valueEditData.isi.toString(),
            index: valueEditData.index,
            action: "delete",
        };
        if (
            sockets[sensor.id] &&
            sockets[sensor.id].readyState === WebSocket.OPEN
        ) {
            sockets[sensor.id].send(JSON.stringify(formData));
        }
    };

    useEffect(() => {
        if (pesanSocket.pesan != "") {
            if (pesanSocket.success) {
                if (editData) {
                    updateSensorData(sensor.id, {
                        nilai: valueEditData.isi,
                        index: valueEditData.index,
                        action: "edit",
                    });
                } else {
                    updateSensorData(sensor.id, {
                        nilai: valueEditData.isi,
                        index: valueEditData.index,
                        action: "delete",
                    });
                }
            }
            setEditData(false);
            setValueEditData({ isi: "", index: 0 });
            setToastDelete({
                ...toastDelete,
                show: false,
            });
            showNotification(pesanSocket.pesan);
            setTimeout(() => {
                emptyPesanSocket();
            }, 3600);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pesanSocket]);

    return (
        <>
            {/* toast delete */}
            <div className={`toast ${toastDelete.show ? "show" : ""}`}>
                <div>
                    <p>{toastDelete.teks}</p>
                    <div
                        className="my-2"
                        style={{
                            width: "100%",
                            height: "1px",
                            backgroundColor: "var(--merah)",
                        }}
                    ></div>
                    <form onSubmit={handleDelete}>
                        <div className="flex justify-center gap-1 items-center">
                            <button type="submit">Ok</button>
                            <button
                                onClick={() => {
                                    setToastDelete({
                                        ...toastDelete,
                                        show: false,
                                    });
                                }}
                                type="button"
                            >
                                Close
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Notif show={notifShow} teks={notifText} />
            <Toast
                show={toastShow}
                teks={toastText}
                url={toastURL}
                next_url="/dashboard"
            />
            <NavAtas
                back_url="/dashboard"
                title={sensor.label}
                subtitle={`ID : ${sensor.id}`}
                menu={menuNavbar}
            />
            {editData && (
                <div
                    style={{
                        zIndex: 100,
                        position: "fixed",
                        left: "0",
                        top: "0",
                        width: "100vw",
                        height: "100svh",
                        backgroundColor: "rgba(255,255,255,0.6)",
                    }}
                    className="flex justify-center items-center p-2"
                >
                    <div
                        style={{
                            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                            backgroundColor: "white",
                        }}
                        className="py-2 px-4 rounded-lg"
                    >
                        <form onSubmit={handleSubmitEdit}>
                            <p className="text-coklat font-bold">
                                Edit value data
                            </p>
                            <label className="input-icon mb-3">
                                <div className="icon">
                                    <FaDatabase />
                                </div>
                                <input
                                    autoFocus={editData}
                                    type={
                                        sensorData[sensor.id]
                                            ? sensorData[sensor.id].string
                                                ? "text"
                                                : "number"
                                            : "text"
                                    }
                                    required
                                    placeholder="Data value"
                                    value={valueEditData.isi}
                                    onChange={(e) =>
                                        setValueEditData({
                                            ...valueEditData,
                                            isi: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <div className="flex gap-1">
                                <button
                                    type="submit"
                                    className="btn bg-coklat1 text-coklat"
                                    style={{ flex: 1 }}
                                >
                                    Simpan
                                </button>
                                <button
                                    type="button"
                                    className="btn text-coklat"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setEditData(false);
                                        setValueEditData({ isi: "", index: 0 });
                                    }}
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="konten px-6 pb-6">
                {loading ? (
                    <p className="text-sm text-center">
                        <i>{loading}</i>
                    </p>
                ) : (
                    <div>
                        <div className="flex items-center">
                            <div style={{ flex: "1" }}>
                                <p className="text-hijau">Last value</p>
                                <h1 className="mb-2">
                                    {sensorData[sensor.id]
                                        ? sensorData[sensor.id].current_value
                                        : sensor.data.length > 0
                                        ? sensor.data[sensor.data.length - 1]
                                              .nilai
                                        : 0}{" "}
                                    {sensor.satuan.split("@")[0] == "-"
                                        ? ""
                                        : sensor.satuan.split("@")[0]}
                                </h1>
                            </div>
                            <div className="flex gap-1 items-center">
                                {!sensor.string && (
                                    <button
                                        className={
                                            "py-1 px-2 rounded " +
                                            (typeDisplay == "chart"
                                                ? "bg-hijau1 text-hijau"
                                                : "text-gray-700")
                                        }
                                        onClick={() => {
                                            setTypeDisplay("chart");
                                        }}
                                    >
                                        <FaChartBar />
                                    </button>
                                )}
                                <button
                                    className={
                                        "py-1 px-2 rounded " +
                                        (typeDisplay == "table"
                                            ? "bg-hijau1 text-hijau"
                                            : "text-gray-700")
                                    }
                                    onClick={() => {
                                        setTypeDisplay("table");
                                    }}
                                >
                                    <FaTableList />
                                </button>
                            </div>
                        </div>
                        {typeDisplay == "chart" ? (
                            <div className="w-full flex gap-2 bg-hijau1 p-4 rounded-lg mb-3">
                                <div>
                                    <div
                                        style={{
                                            borderRight:
                                                "1px solid var(--hijau)",
                                            height: "100px",
                                        }}
                                        className="pe-2 flex flex-col justify-between items-end"
                                    >
                                        <p style={{ fontSize: "12px" }}>
                                            {sensorData[sensor.id]
                                                ? sensorData[sensor.id]
                                                      .batas_atas
                                                : "Nan"}
                                            {sensor.satuan.split("@")[1] == "-"
                                                ? ""
                                                : sensor.satuan.split("@")[1]}
                                        </p>
                                        <p style={{ fontSize: "12px" }}>
                                            {sensorData[sensor.id]
                                                ? sensorData[sensor.id]
                                                      .batas_bawah
                                                : "Nan"}
                                            {sensor.satuan.split("@")[1] == "-"
                                                ? ""
                                                : sensor.satuan.split("@")[1]}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div
                                        className="w-full pt-2"
                                        style={{ height: "100px" }}
                                    >
                                        <GrafikBtg
                                            warna={"bg-hijau"}
                                            data={
                                                sensorData[sensor.id]
                                                    ? sensorData[sensor.id].data
                                                    : sensor.data
                                            }
                                            limit={limitData}
                                            yAxis={{
                                                show: false,
                                                batasAtas: sensorData[sensor.id]
                                                    ? sensorData[sensor.id]
                                                          .batas_atas
                                                    : 0,
                                                batasBawah: sensorData[
                                                    sensor.id
                                                ]
                                                    ? sensorData[sensor.id]
                                                          .batas_bawah
                                                    : 0,
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <p style={{ fontSize: "12px" }}>
                                            {
                                                generateBatasWaktu(
                                                    sensorData[sensor.id]
                                                        ? sensorData[sensor.id]
                                                              .data
                                                        : [],
                                                    limitData
                                                ).batas_kiri
                                            }
                                        </p>
                                        <p style={{ fontSize: "12px" }}>
                                            {
                                                generateBatasWaktu(
                                                    sensorData[sensor.id]
                                                        ? sensorData[sensor.id]
                                                              .data
                                                        : [],
                                                    limitData
                                                ).batas_kanan
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="w-full bg-hijau1 px-4 py-3 rounded-lg mb-1"
                                    style={{
                                        fontSize: "14px",
                                        lineHeight: "15px",
                                    }}
                                >
                                    <div
                                        className="flex items-center gap-2 pb-2"
                                        style={{
                                            borderBottom:
                                                "1px solid var(--hijau)",
                                        }}
                                    >
                                        <div style={{ width: "80px" }}>
                                            Waktu
                                        </div>
                                        <div style={{ flex: 1 }}>Data</div>
                                        {sensor.email == emailUser && (
                                            <div style={{ width: "50px" }}>
                                                Action
                                            </div>
                                        )}
                                    </div>
                                    {sensorData[sensor.id] && (
                                        <div
                                            className="flex flex-col gap-1 py-2"
                                            style={{
                                                maxHeight: "100px",
                                                overflow: "auto",
                                            }}
                                            ref={containerData}
                                        >
                                            {sensorData[sensor.id].data.length >
                                            0 ? (
                                                <>
                                                    {sensorData[
                                                        sensor.id
                                                    ].data.map((d, ind_d) => (
                                                        <div
                                                            key={ind_d}
                                                            className="flex gap-2"
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "80px",
                                                                }}
                                                            >
                                                                <p className="text-hijau">
                                                                    {formatTgl(
                                                                        d.waktu
                                                                    )}
                                                                </p>
                                                                <p
                                                                    style={{
                                                                        fontSize:
                                                                            "12px",
                                                                    }}
                                                                    className="text-gray-500"
                                                                >
                                                                    {formatJam(
                                                                        d.waktu
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                {d.nilai}
                                                            </div>
                                                            {sensor.email ==
                                                                emailUser && (
                                                                <div
                                                                    style={{
                                                                        width: "50px",
                                                                    }}
                                                                    className="flex gap-2 items-center justify-center"
                                                                >
                                                                    <div
                                                                        className="text-hijau"
                                                                        onClick={() => {
                                                                            setValueEditData(
                                                                                {
                                                                                    isi: d.nilai,
                                                                                    index: d.id,
                                                                                }
                                                                            );
                                                                            setEditData(
                                                                                true
                                                                            );
                                                                        }}
                                                                    >
                                                                        <FiEdit3 />
                                                                    </div>
                                                                    <div
                                                                        className="text-merah"
                                                                        onClick={() => {
                                                                            setValueEditData(
                                                                                {
                                                                                    isi: d.nilai,
                                                                                    index: ind_d,
                                                                                }
                                                                            );
                                                                            setToastDelete(
                                                                                {
                                                                                    teks: `Data ${formatTgl(
                                                                                        d.waktu
                                                                                    )} ${formatJam(
                                                                                        d.waktu
                                                                                    )} akan dihapus?`,
                                                                                    show: true,
                                                                                }
                                                                            );
                                                                        }}
                                                                    >
                                                                        <MdOutlineDeleteOutline />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <p className="text-gray-500">
                                                    <i>Belum ada data</i>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {sensorData[sensor.id] &&
                                    sensorData[sensor.id].data.length > 0 && (
                                        <>
                                            <table
                                                ref={tableElm}
                                                style={{ display: "none" }}
                                            >
                                                <thead>
                                                    <tr>
                                                        <th colSpan={2}>
                                                            {`${
                                                                sensorData[
                                                                    sensor.id
                                                                ].label
                                                            } (${
                                                                sensorData[
                                                                    sensor.id
                                                                ].id
                                                            })`}
                                                        </th>
                                                    </tr>
                                                    <tr>
                                                        <th colSpan={2}>
                                                            {`Range waktu : ${formatTgl(
                                                                sensorData[
                                                                    sensor.id
                                                                ].data[0].waktu
                                                            )} ${formatJam(
                                                                sensorData[
                                                                    sensor.id
                                                                ].data[0].waktu
                                                            )} s.d ${formatTgl(
                                                                sensorData[
                                                                    sensor.id
                                                                ].data[
                                                                    sensorData[
                                                                        sensor
                                                                            .id
                                                                    ].data
                                                                        .length -
                                                                        1
                                                                ].waktu
                                                            )} ${formatJam(
                                                                sensorData[
                                                                    sensor.id
                                                                ].data[
                                                                    sensorData[
                                                                        sensor
                                                                            .id
                                                                    ].data
                                                                        .length -
                                                                        1
                                                                ].waktu
                                                            )}`}
                                                        </th>
                                                    </tr>
                                                    <tr>
                                                        <th colSpan={2}>
                                                            {`Jumlah data : ${
                                                                sensorData[
                                                                    sensor.id
                                                                ].data.length
                                                            }`}
                                                        </th>
                                                    </tr>
                                                    <tr>
                                                        <th>Waktu</th>
                                                        <th>Data</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sensorData[
                                                        sensor.id
                                                    ].data.map((d, ind_d) => (
                                                        <tr key={ind_d}>
                                                            <td>{`${formatTgl(
                                                                d.waktu
                                                            )} ${formatJam(
                                                                d.waktu
                                                            )}`}</td>
                                                            <td>{d.nilai}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div
                                                onClick={() => {
                                                    handleExportExcel();
                                                }}
                                                className="flex gap-2 items-center btn bg-hijau1 text-hijau mb-3 justify-center"
                                            >
                                                <PiMicrosoftExcelLogo />
                                                <p>Export to Excel</p>
                                            </div>
                                        </>
                                    )}
                            </>
                        )}
                        <h3 className="font-bold mb-1">Information</h3>
                        <p className="text-abu">
                            Data amount : {sensor.panjangData}
                        </p>
                        <p className="text-abu">
                            Life time :{" "}
                            {sensor.data.length > 0
                                ? timeDifference(
                                      Date.now(),
                                      sensor.data[0].waktu
                                  )
                                : "Menunggu data pertama"}
                        </p>
                        <p className="text-abu">
                            Websocket status :{" "}
                            <b
                                className={
                                    sensorData[sensor.id]
                                        ? "text-hijau"
                                        : "text-merah"
                                }
                            >
                                {sensorData[sensor.id]
                                    ? "Connected"
                                    : "Disconnect"}
                            </b>
                        </p>
                        <h3 className="font-bold m-0 mt-3">Record Owner</h3>
                        <div className="flex w-full items-center gap-2 text-abu">
                            <FiUser size={14} />
                            <p style={{ flex: 1 }}>
                                {sensor.email == emailUser
                                    ? "You"
                                    : sensor.email}
                            </p>
                            <p>IDUSER{sensor.id_user}</p>
                        </div>
                        <h3 className="font-bold m-0 mt-3">Other Users</h3>
                        <p
                            className="text-abu mb-1"
                            style={{ fontSize: "12px", marginTop: "-5px" }}
                        >
                            Other users can only view
                        </p>
                        {user.length > 0 ? (
                            <div>
                                {user.map((u, ind_u) => (
                                    <div
                                        key={ind_u}
                                        className="flex w-full items-center gap-2 text-abu"
                                    >
                                        <FiUser size={14} />
                                        <p style={{ flex: 1 }}>{u.email}</p>
                                        <p>IDUSER{u.id}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <p className="text-abu">
                                    <i>No other users</i>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <NavBawah />
        </>
    );
}
