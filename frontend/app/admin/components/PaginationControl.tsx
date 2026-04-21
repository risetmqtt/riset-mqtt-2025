import { IPagination } from "./types";

interface PaginationControlProps {
    pagination: IPagination;
    onPrev: () => void;
    onNext: () => void;
}

export default function PaginationControl({
    pagination,
    onPrev,
    onNext,
}: PaginationControlProps) {
    return (
        <div className="flex gap-2 mt-2">
            <button
                type="button"
                className="btn bg-gray-100"
                disabled={pagination.pag <= 1}
                onClick={onPrev}
            >
                Prev
            </button>
            <button
                type="button"
                className="btn bg-gray-100"
                disabled={
                    pagination.totalPage === 0 ||
                    pagination.pag >= pagination.totalPage
                }
                onClick={onNext}
            >
                Next
            </button>
            <p className="text-sm text-abu">
                Page {pagination.pag}/{pagination.totalPage || 1}
            </p>
        </div>
    );
}
