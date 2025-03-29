import useToastStore from "@/store/toastStore";
import { useRouter } from "next/navigation";
import { SyntheticEvent } from "react";

interface ToastProps {
    show: boolean;
    teks: string;
    url: string;
    next_url: string;
}
const Toast: React.FC<ToastProps> = ({ teks, url, next_url, show }) => {
    const router = useRouter();
    const { closeToast } = useToastStore();
    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        async function funFetchLogin() {
            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            router.push(next_url);
        }
        funFetchLogin();
    };
    return (
        <div className={`toast ${show ? "show" : ""}`}>
            <div>
                <p>{teks}</p>
                <div
                    className="my-2"
                    style={{
                        width: "100%",
                        height: "1px",
                        backgroundColor: "var(--merah)",
                    }}
                ></div>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-1 items-center">
                        <button type="submit">Ok</button>
                        <button
                            onClick={() => {
                                closeToast();
                            }}
                            type="button"
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default Toast;
