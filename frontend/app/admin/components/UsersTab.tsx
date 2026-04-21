"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import PaginationControl from "./PaginationControl";
import { defaultPagination, IPagination, IUser } from "./types";

interface UsersTabProps {
    showNotification: (text: string) => void;
}

export default function UsersTab({ showNotification }: UsersTabProps) {
    const [users, setUsers] = useState<IUser[]>([]);
    const [pagination, setPagination] = useState<IPagination>({
        ...defaultPagination,
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState("Loading users...");
    const [formUser, setFormUser] = useState({
        id: 0,
        email: "",
        passkey: "",
        sandi: "",
    });

    const fetchUsers = async (pag = 1, keyword = search) => {
        setLoading("Loading users...");
        const res = await fetch(
            `/api/admin/users?pag=${pag}&limit=${pagination.limit}&search=${encodeURIComponent(
                keyword,
            )}`,
        );
        const json = await res.json();
        if (res.status !== 200) {
            setLoading(json.pesan || "Failed loading users");
            return;
        }
        setUsers(json.data || []);
        setPagination(json.pagination || defaultPagination);
        setLoading("");
    };

    useEffect(() => {
        fetchUsers(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!formUser.id) return;
        const res = await fetch(`/api/admin/users/${formUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: formUser.email,
                passkey: formUser.passkey,
                sandi: formUser.sandi,
            }),
        });
        const json = await res.json();
        showNotification(json.pesan || "Update user selesai");
        if (res.status === 200) {
            setFormUser({ ...formUser, sandi: "" });
            fetchUsers(pagination.pag, search);
        }
    };

    return (
        <div>
            <h2 className="mb-1">User Management</h2>
            <label className="input-icon mb-2">
                <input
                    value={search}
                    placeholder="Search email"
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    type="button"
                    className="btn bg-ungu1 text-ungu"
                    onClick={() => fetchUsers(1, search)}
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
                    {users.map((u) => (
                        <div
                            key={u.id}
                            className="p-2 mb-1 rounded-lg bg-gray-50"
                        >
                            <p className="font-bold">{u.email}</p>
                            <p className="text-sm text-gray-500">
                                IDUSER{u.id}
                            </p>
                            <button
                                className="text-ungu text-sm"
                                onClick={() =>
                                    setFormUser({
                                        id: u.id,
                                        email: u.email,
                                        passkey: u.passkey || "",
                                        sandi: "",
                                    })
                                }
                            >
                                Edit user
                            </button>
                        </div>
                    ))}
                    <PaginationControl
                        pagination={pagination}
                        onPrev={() => fetchUsers(pagination.pag - 1)}
                        onNext={() => fetchUsers(pagination.pag + 1)}
                    />
                </div>
            )}
            {formUser.email && (
                <form onSubmit={handleSubmit}>
                    <h3 className="font-bold mb-1">Edit User</h3>
                    <label className="input-icon mb-1">
                        <input
                            disabled
                            value={formUser.id ? String(formUser.id) : ""}
                            placeholder="ID User"
                        />
                    </label>
                    <label className="input-icon mb-1">
                        <input
                            required
                            value={formUser.email}
                            onChange={(e) =>
                                setFormUser({
                                    ...formUser,
                                    email: e.target.value,
                                })
                            }
                            placeholder="Email"
                        />
                    </label>
                    <label className="input-icon mb-1">
                        <input
                            value={formUser.passkey}
                            onChange={(e) =>
                                setFormUser({
                                    ...formUser,
                                    passkey: e.target.value,
                                })
                            }
                            placeholder="Passkey"
                        />
                    </label>
                    <label className="input-icon mb-2">
                        <input
                            type="password"
                            value={formUser.sandi}
                            onChange={(e) =>
                                setFormUser({
                                    ...formUser,
                                    sandi: e.target.value,
                                })
                            }
                            placeholder="Password baru (opsional)"
                        />
                    </label>
                    <button
                        type="submit"
                        className="btn bg-ungu1 text-ungu"
                        disabled={!formUser.id}
                    >
                        Simpan User
                    </button>
                </form>
            )}
        </div>
    );
}
