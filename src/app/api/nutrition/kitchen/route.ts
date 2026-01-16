import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const items = await prisma.kitchenItem.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error fetching kitchen items:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { action, name, id } = body;
        // action: 'create' | 'delete'

        if (action === 'create') {
            if (!name) return new NextResponse("Name required", { status: 400 });

            const newItem = await prisma.kitchenItem.create({
                data: {
                    userId: session.user.id,
                    name: name
                }
            });
            return NextResponse.json(newItem);
        }

        if (action === 'delete') {
            if (!id) return new NextResponse("ID required", { status: 400 });

            await prisma.kitchenItem.delete({
                where: {
                    id,
                    userId: session.user.id // Security check
                }
            });
            return NextResponse.json({ success: true });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error("Error updating kitchen item:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
