"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import PaginationControl from "./PaginationControl";
import { defaultPagination, IPagination, IStructure } from "./types";

interface StructuresTabProps {
    onStructuresLoaded?: (rows: IStructure[]) => void;
    showNotification: (text: string) => void;
}

export default function StructuresTab({
    onStructuresLoaded,
    showNotification,
}: StructuresTabProps) {
    const [rows, setRows] = useState<IStructure[]>([]);
    const [pagination, setPagination] = useState<IPagination>({
        ...defaultPagination,
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState("Loading structures...");
    const [form, setForm] = useState({
        id: 0,
        nama: "",
        satuan: "",
        string: false,
    });
    const [deleteTarget, setDeleteTarget] = useState<IStructure | null>(null);

    const fetchRows = async (pag = 1, keyword = search) => {
        setLoading("Loading structures...");
        const res = await fetch(
            `/api/admin/structures?pag=${pag}&limit=${pagination.limit}&search=${encodeURIComponent(
                keyword
            )}`
        );
        const json = await res.json();
        if (res.status !== 200) {
            setLoading(json.pesan || "Failed loading structures");
            return;
        }
        const nextRows = json.data || [];
        setRows(nextRows);
        setPagination(json.pagination || defaultPagination);
        onStructuresLoaded?.(nextRows);
        setLoading("");
    };

    useEffect(() => {
        fetchRows(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        const payload = {
            nama: form.nama,
            satuan: form.satuan,
            string: form.string,
        };
        const isEdit = !!form.id;
        const res = await fetch(
            isEdit ? `/api/admin/structures/${form.id}` : "/api/admin/structures",
            {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        const json = await res.json();
        showNotification(json.pesan || "Simpan struktur selesai");
        if (res.status === 200) {
            setForm({ id: 0, nama: "", satuan: "", string: false });
            fetchRows(pagination.pag, search);
        }
    };

    const handleDelete = async (id: number) => {
        const res = await fetch(`/api/admin/structures/${id}`, {
            method: "DELETE",
        });
        const json = await res.json();
        showNotification(json.pesan || "Hapus struktur selesai");
        if (res.status === 200) {
            if (form.id === id) {
                setForm({ id: 0, nama: "", satuan: "", string: false });
            }
            fetchRows(pagination.pag, search);
        }
    };

    return (
        <>
            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Structure"
                message={
                    deleteTarget
                        ? `Yakin ingin menghapus struktur "${deleteTarget.nama}" (ID ${deleteTarget.id})?`
                        : ""
                }
                confirmText="Delete"
                cancelText="Batal"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await handleDelete(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />

            <div>
                <h2 className="mb-1">Structure Management</h2>
                <label className="input-icon mb-2">
                    <input
                        value={search}
                        placeholder="Search structure"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn bg-hijau1 text-hijau"
                        onClick={() => fetchRows(1, search)}
                    >
                        Search
                    </button>
                </label>
                {loading ? (
                    <p className="text-sm">
                        <i>{loading}</i>
                    </p>
                ) : (
                    <div className="mb-3">
                        {rows.map((s) => (
                            <div key={s.id} className="p-2 mb-1 rounded-lg bg-gray-50">
                                <p className="font-bold">
                                    {s.nama} ({s.satuan})
                                </p>
                                <p className="text-sm text-gray-500">
                                    ID {s.id} | Type: {s.string ? "string" : "number"}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        className="text-hijau text-sm"
                                        onClick={() =>
                                            setForm({
                                                id: s.id,
                                                nama: s.nama,
                                                satuan: s.satuan,
                                                string: !!s.string,
                                            })
                                        }
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-red-500 text-sm"
                                        onClick={() => setDeleteTarget(s)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        <PaginationControl
                            pagination={pagination}
                            onPrev={() => fetchRows(pagination.pag - 1)}
                            onNext={() => fetchRows(pagination.pag + 1)}
                        />
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <h3 className="font-bold mb-1">
                        {form.id ? "Edit Structure" : "Create Structure"}
                    </h3>
                    <label className="input-icon mb-1">
                        <input
                            required
                            value={form.nama}
                            onChange={(e) => setForm({ ...form, nama: e.target.value })}
                            placeholder="Nama struktur"
                        />
                    </label>
                    <label className="input-icon mb-1">
                        <input
                            required
                            value={form.satuan}
                            onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                            placeholder='Satuan (contoh: "C@C" atau "-@-")'
                        />
                    </label>
                    <label className="input-icon mb-2">
                        <select
                            value={form.string ? "string" : "number"}
                            onChange={(e) =>
                                setForm({ ...form, string: e.target.value === "string" })
                            }
                        >
                            <option value="number">Number</option>
                            <option value="string">String</option>
                        </select>
                    </label>
                    <div className="flex gap-2">
                        <button type="submit" className="btn bg-hijau1 text-hijau">
                            Simpan Structure
                        </button>
                        {form.id ? (
                            <button
                                type="button"
                                className="btn bg-gray-100"
                                onClick={() =>
                                    setForm({ id: 0, nama: "", satuan: "", string: false })
                                }
                            >
                                Batal Edit
                            </button>
                        ) : null}
                    </div>
                </form>
            </div>
        </>
    );
}
