'use server';

import { revalidateTag } from "next/cache";

export default async function deleteRoomAction(id: string) {
    console.log("in delete room action")
    const url = `${process.env.API_URL}/api/rooms/${id}`
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    })
    const data = await response.json()
    revalidateTag("rooms")
    return data.acknowledged
}