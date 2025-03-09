// app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email, sandi } = await req.json();

    const fetchLogin = await fetch(`${process.env.BACKEND_URL}/auth`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, sandi }),
    });
    const responseLogin = await fetchLogin.json();

    if (fetchLogin.status !== 200) {
        return NextResponse.json(responseLogin, { status: fetchLogin.status });
    }
    if (!responseLogin.token) {
        return NextResponse.json(
            { error: responseLogin.pesan },
            { status: fetchLogin.status }
        );
    }

    // Set token in cookies (this works in server context)
    return NextResponse.json(
        { token: responseLogin.token },
        {
            status: 200,
            headers: {
                "Set-Cookie": `token=${responseLogin.token}; HttpOnly; Path=/; Max-Age=86400`,
            },
        }
    );
}
