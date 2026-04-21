"use client";

import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import PaginationControl from "./PaginationControl";
import {
    defaultPagination,
    IPagination,
    ISensorData,
    ISensorDetail,
    ISensorRow,
    IStructure,
} from "./types";

interface SensorsTabProps {
    showNotification: (text: string) => void;
}

export default function SensorsTab({ showNotification }: SensorsTabProps) {
    const [confirmState, setConfirmState] = useState<{
        title: string;
        message: string;
        onConfirm: () => Promise<void>;
    } | null>(null);
    const [sensors, setSensors] = useState<ISensorRow[]>([]);
    const [sensorPagination, setSensorPagination] = useState<IPagination>({
        ...defaultPagination,
    });
    const [sensorSearch, setSensorSearch] = useState("");
    const [sensorLoading, setSensorLoading] = useState("Loading sensors...");

    const [structures, setStructures] = useState<IStructure[]>([]);
    const [sensorDetail, setSensorDetail] = useState<ISensorDetail | null>(null);
    const [sensorData, setSensorData] = useState<ISensorData[]>([]);
    const [sensorDataPagination, setSensorDataPagination] = useState<IPagination>(
        { ...defaultPagination, limit: 20 }
    );
    const [sensorDetailLoading, setSensorDetailLoading] = useState("");

    const [formSensor, setFormSensor] = useState({
        id: "",
        label: "",
        id_struktur: "",
        id_user: "",
        id_user_lain: "",
    });
    const [formSensorData, setFormSensorData] = useState({
        id: 0,
        waktu: "",
        nilai: "",
    });

    const structureOptions = useMemo(
        () =>
            structures.map((s) => ({
                label: `${s.nama} (${s.satuan})`,
                value: s.id,
            })),
        [structures]
    );

    const fetchStructures = async () => {
        const res = await fetch("/api/admin/structures?pag=1&limit=200&search=");
        const json = await res.json();
        if (res.status === 200) {
            setStructures(json.data || []);
        }
    };

    const fetchSensors = async (pag = 1, search = sensorSearch) => {
        setSensorLoading("Loading sensors...");
        const res = await fetch(
            `/api/admin/sensors?pag=${pag}&limit=${
                sensorPagination.limit
            }&search=${encodeURIComponent(search)}`
        );
        const json = await res.json();
        if (res.status !== 200) {
            setSensorLoading(json.pesan || "Failed loading sensors");
            return;
        }
        setSensors(json.data || []);
        setSensorPagination(json.pagination || defaultPagination);
        setSensorLoading("");
    };

    const fetchSensorDetail = async (
        id: string,
        pagData = 1,
        resetFormData = true
    ) => {
        setSensorDetailLoading("Loading sensor detail...");
        const res = await fetch(
            `/api/admin/sensors/${id}?pagData=${pagData}&limitData=${sensorDataPagination.limit}`
        );
        const json = await res.json();
        if (res.status !== 200) {
            showNotification(json.pesan || "Gagal mengambil detail sensor");
            setSensorDetailLoading("");
            return;
        }
        setSensorDetail(json.sensor || null);
        setSensorData(json.data || []);
        setSensorDataPagination(json.paginationData || defaultPagination);
        if (resetFormData) {
            setFormSensorData({ id: 0, waktu: "", nilai: "" });
        }
        setSensorDetailLoading("");
    };

    useEffect(() => {
        fetchStructures();
        fetchSensors(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetFormSensor = () => {
        setFormSensor({
            id: "",
            label: "",
            id_struktur:
                structureOptions.length > 0 ? String(structureOptions[0].value) : "",
            id_user: "",
            id_user_lain: "",
        });
    };

    const handleSubmitSensor = async (e: SyntheticEvent) => {
        e.preventDefault();
        const payload = {
            label: formSensor.label,
            id_struktur: Number(formSensor.id_struktur),
            id_user: Number(formSensor.id_user),
            id_user_lain: formSensor.id_user_lain
                .split(",")
                .map((x) => x.trim())
                .filter((x) => x !== ""),
        };
        const isEdit = !!formSensor.id;
        const res = await fetch(
            isEdit ? `/api/admin/sensors/${formSensor.id}` : "/api/admin/sensors",
            {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        const json = await res.json();
        showNotification(json.pesan || "Simpan sensor selesai");
        if (res.status === 200) {
            fetchSensors(sensorPagination.pag, sensorSearch);
            if (isEdit) {
                fetchSensorDetail(formSensor.id, sensorDataPagination.pag);
            } else {
                resetFormSensor();
            }
        }
    };

    const handleDeleteSensor = async (id: string) => {
        const res = await fetch(`/api/admin/sensors/${id}`, { method: "DELETE" });
        const json = await res.json();
        showNotification(json.pesan || "Hapus sensor selesai");
        if (res.status === 200) {
            fetchSensors(sensorPagination.pag, sensorSearch);
            if (sensorDetail?.id === id) {
                setSensorDetail(null);
                setSensorData([]);
                setFormSensorData({ id: 0, waktu: "", nilai: "" });
            }
            if (formSensor.id === id) {
                resetFormSensor();
            }
        }
    };

    const handleSubmitSensorData = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!sensorDetail?.id) return;
        const isEdit = !!formSensorData.id;
        const url = isEdit
            ? `/api/admin/sensors/${sensorDetail.id}/data/${formSensorData.id}`
            : `/api/admin/sensors/${sensorDetail.id}/data`;
        const method = isEdit ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                waktu: formSensorData.waktu ? Number(formSensorData.waktu) : undefined,
                nilai: formSensorData.nilai,
            }),
        });
        const json = await res.json();
        showNotification(json.pesan || "Simpan data sensor selesai");
        if (res.status === 200) {
            fetchSensorDetail(sensorDetail.id, sensorDataPagination.pag);
        }
    };

    const handleDeleteSensorData = async (idData: number) => {
        if (!sensorDetail?.id) return;
        const res = await fetch(`/api/admin/sensors/${sensorDetail.id}/data/${idData}`, {
            method: "DELETE",
        });
        const json = await res.json();
        showNotification(json.pesan || "Hapus data sensor selesai");
        if (res.status === 200) {
            fetchSensorDetail(sensorDetail.id, sensorDataPagination.pag);
        }
    };

    return (
        <>
            <ConfirmModal
                open={!!confirmState}
                title={confirmState?.title || ""}
                message={confirmState?.message || ""}
                confirmText="Delete"
                cancelText="Batal"
                onCancel={() => setConfirmState(null)}
                onConfirm={async () => {
                    if (!confirmState) return;
                    await confirmState.onConfirm();
                    setConfirmState(null);
                }}
            />
            <div>
            <h2 className="mb-1">Sensor Management</h2>
            <label className="input-icon mb-2">
                <input
                    value={sensorSearch}
                    placeholder="Search sensor id/label/owner"
                    onChange={(e) => setSensorSearch(e.target.value)}
                />
                <button
                    type="button"
                    className="btn bg-coklat1 text-coklat"
                    onClick={() => fetchSensors(1, sensorSearch)}
                >
                    Search
                </button>
            </label>
            {sensorLoading ? (
                <p className="text-sm">
                    <i>{sensorLoading}</i>
                </p>
            ) : (
                <div className="mb-3">
                    {sensors.map((s) => (
                        <div key={s.id} className="p-2 mb-1 rounded-lg bg-gray-50">
                            <p className="font-bold">
                                {s.label} (ID {s.id})
                            </p>
                            <p className="text-sm text-gray-500">Owner: {s.owner_email}</p>
                            <p className="text-sm text-gray-500">
                                Struktur: {s.struktur_nama} ({s.struktur_satuan}) -{" "}
                                {s.struktur_string ? "string" : "number"}
                            </p>
                            <p className="text-sm text-gray-500">
                                User lain:{" "}
                                {s.id_user_lain.length > 0 ? s.id_user_lain.join(", ") : "-"}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    className="text-coklat text-sm"
                                    onClick={() => {
                                        setFormSensor({
                                            id: s.id,
                                            label: s.label,
                                            id_struktur: String(s.id_struktur),
                                            id_user: String(s.id_user),
                                            id_user_lain: s.id_user_lain.join(", "),
                                        });
                                        fetchSensorDetail(s.id, 1);
                                    }}
                                >
                                    Edit + Detail
                                </button>
                                <button
                                    className="text-red-500 text-sm"
                                    onClick={() =>
                                        setConfirmState({
                                            title: "Delete Sensor",
                                            message: `Yakin ingin menghapus sensor "${s.label}" (ID ${s.id})?`,
                                            onConfirm: async () =>
                                                handleDeleteSensor(s.id),
                                        })
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    <PaginationControl
                        pagination={sensorPagination}
                        onPrev={() => fetchSensors(sensorPagination.pag - 1)}
                        onNext={() => fetchSensors(sensorPagination.pag + 1)}
                    />
                </div>
            )}

            <form onSubmit={handleSubmitSensor} className="mb-4">
                <h3 className="font-bold mb-1">
                    {formSensor.id ? "Edit Sensor" : "Create Sensor"}
                </h3>
                <label className="input-icon mb-1">
                    <input
                        disabled={!!formSensor.id}
                        value={formSensor.id}
                        onChange={(e) =>
                            setFormSensor({ ...formSensor, id: e.target.value })
                        }
                        placeholder="ID sensor (otomatis saat create)"
                    />
                </label>
                <label className="input-icon mb-1">
                    <input
                        required
                        value={formSensor.label}
                        onChange={(e) =>
                            setFormSensor({ ...formSensor, label: e.target.value })
                        }
                        placeholder="Label sensor"
                    />
                </label>
                <label className="input-icon mb-1">
                    <select
                        required
                        value={formSensor.id_struktur}
                        onChange={(e) =>
                            setFormSensor({
                                ...formSensor,
                                id_struktur: e.target.value,
                            })
                        }
                    >
                        <option value="">Pilih struktur data</option>
                        {structureOptions.map((opt) => (
                            <option key={opt.value} value={String(opt.value)}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="input-icon mb-1">
                    <input
                        required
                        value={formSensor.id_user}
                        onChange={(e) =>
                            setFormSensor({ ...formSensor, id_user: e.target.value })
                        }
                        placeholder="ID owner user"
                    />
                </label>
                <label className="input-icon mb-2">
                    <input
                        value={formSensor.id_user_lain}
                        onChange={(e) =>
                            setFormSensor({
                                ...formSensor,
                                id_user_lain: e.target.value,
                            })
                        }
                        placeholder="Email user lain, pisahkan dengan koma"
                    />
                </label>
                <div className="flex gap-2">
                    <button type="submit" className="btn bg-coklat1 text-coklat">
                        Simpan Sensor
                    </button>
                    {formSensor.id ? (
                        <button
                            type="button"
                            className="btn bg-gray-100"
                            onClick={resetFormSensor}
                        >
                            Batal Edit
                        </button>
                    ) : null}
                </div>
            </form>

            <div>
                <h3 className="font-bold mb-1">Detail Sensor & Data</h3>
                {sensorDetailLoading ? (
                    <p className="text-sm">
                        <i>{sensorDetailLoading}</i>
                    </p>
                ) : sensorDetail ? (
                    <div className="p-3 rounded-lg bg-gray-50">
                        <p className="font-bold">
                            {sensorDetail.label} (ID {sensorDetail.id})
                        </p>
                        <p className="text-sm text-gray-600">
                            Owner: {sensorDetail.owner_email} (IDUSER{sensorDetail.id_user})
                        </p>
                        <p className="text-sm text-gray-600">
                            Struktur: {sensorDetail.struktur_nama} (
                            {sensorDetail.struktur_satuan}) -{" "}
                            {sensorDetail.struktur_string ? "string" : "number"}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            User lain:{" "}
                            {sensorDetail.users_lain.length > 0
                                ? sensorDetail.users_lain
                                      .map((u) => `${u.email} (IDUSER${u.id})`)
                                      .join(", ")
                                : "-"}
                        </p>

                        <form onSubmit={handleSubmitSensorData} className="mb-2">
                            <h4 className="font-bold">Tambah/Edit Data Sensor</h4>
                            <label className="input-icon mb-1">
                                <input
                                    value={formSensorData.id || ""}
                                    disabled
                                    placeholder="ID data (otomatis saat edit)"
                                />
                            </label>
                            <label className="input-icon mb-1">
                                <input
                                    value={formSensorData.waktu}
                                    onChange={(e) =>
                                        setFormSensorData({
                                            ...formSensorData,
                                            waktu: e.target.value,
                                        })
                                    }
                                    placeholder="Waktu epoch ms (opsional)"
                                />
                            </label>
                            <label className="input-icon mb-2">
                                <input
                                    required
                                    value={formSensorData.nilai}
                                    onChange={(e) =>
                                        setFormSensorData({
                                            ...formSensorData,
                                            nilai: e.target.value,
                                        })
                                    }
                                    placeholder="Nilai data"
                                />
                            </label>
                            <div className="flex gap-2">
                                <button type="submit" className="btn bg-coklat1 text-coklat">
                                    Simpan Data
                                </button>
                                {formSensorData.id ? (
                                    <button
                                        type="button"
                                        className="btn bg-gray-100"
                                        onClick={() =>
                                            setFormSensorData({
                                                id: 0,
                                                waktu: "",
                                                nilai: "",
                                            })
                                        }
                                    >
                                        Batal Edit Data
                                    </button>
                                ) : null}
                            </div>
                        </form>

                        <div>
                            {sensorData.map((d) => (
                                <div key={d.id} className="p-2 mb-1 rounded bg-white">
                                    <p className="font-bold">ID Data {d.id}</p>
                                    <p className="text-sm text-gray-600">Waktu: {d.waktu}</p>
                                    <p className="text-sm text-gray-600">Nilai: {d.nilai}</p>
                                    <div className="flex gap-3">
                                        <button
                                            className="text-coklat text-sm"
                                            onClick={() =>
                                                setFormSensorData({
                                                    id: d.id,
                                                    waktu: String(d.waktu),
                                                    nilai: String(d.nilai),
                                                })
                                            }
                                        >
                                            Edit data
                                        </button>
                                        <button
                                            className="text-red-500 text-sm"
                                            onClick={() =>
                                                setConfirmState({
                                                    title: "Delete Sensor Data",
                                                    message: `Yakin ingin menghapus data dengan ID ${d.id}?`,
                                                    onConfirm: async () =>
                                                        handleDeleteSensorData(
                                                            d.id
                                                        ),
                                                })
                                            }
                                        >
                                            Delete data
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <PaginationControl
                                pagination={sensorDataPagination}
                                onPrev={() =>
                                    fetchSensorDetail(
                                        sensorDetail.id,
                                        sensorDataPagination.pag - 1,
                                        false
                                    )
                                }
                                onNext={() =>
                                    fetchSensorDetail(
                                        sensorDetail.id,
                                        sensorDataPagination.pag + 1,
                                        false
                                    )
                                }
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-abu">
                        Pilih sensor dari list untuk lihat detail dan data.
                    </p>
                )}
            </div>
            </div>
        </>
    );
}
