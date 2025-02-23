"use client";

import React, { useEffect, useState } from "react";

interface iNotif {
    /* eslint-disable @typescript-eslint/no-explicit-any */
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
