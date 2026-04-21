"use client";

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
            <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="btn bg-gray-100 text-gray-700"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="btn bg-merah1 text-merah"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
