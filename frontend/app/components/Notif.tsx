"use client";

interface iNotif {
    show: boolean;
    teks: string;
}
const Notif: React.FC<iNotif> = ({ show, teks }) => {
    return (
        <div className={"notif" + (show ? " show" : "")}>
            <div>
                <p>{teks}</p>
            </div>
        </div>
    );
};

export default Notif;
