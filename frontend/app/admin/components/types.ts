export interface IPagination {
    pag: number;
    limit: number;
    total: number;
    totalPage: number;
}

export const defaultPagination: IPagination = {
    pag: 1,
    limit: 10,
    total: 0,
    totalPage: 0,
};

export interface IUser {
    id: number;
    email: string;
    passkey: string;
}

export interface IStructure {
    id: number;
    nama: string;
    satuan: string;
    string: boolean;
}

export interface ISensorRow {
    id: string;
    label: string;
    id_struktur: number;
    id_user: number;
    id_user_lain: string[];
    owner_email: string;
    struktur_nama: string;
    struktur_satuan: string;
    struktur_string: boolean;
}

export interface ISensorDetail {
    id: string;
    label: string;
    id_struktur: number;
    id_user: number;
    id_user_lain: string[];
    owner_email: string;
    struktur_nama: string;
    struktur_satuan: string;
    struktur_string: boolean;
    users_lain: Array<{ id: number; email: string }>;
}

export interface ISensorData {
    id: number;
    id_sensor: string;
    waktu: string;
    nilai: string;
}
