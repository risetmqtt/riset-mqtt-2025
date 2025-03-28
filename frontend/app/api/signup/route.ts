// app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email, sandi } = await req.json();

    try {
        const fetchSignup = await fetch(
            `${process.env.BACKEND_URL}/auth/signup`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, sandi }),
            }
        );
        const responseLogin = await fetchSignup.json();
        return NextResponse.json(responseLogin, { status: fetchSignup.status });
    } catch (error) {
        return NextResponse.json({ pesan: error }, { status: 500 });
    }
}
