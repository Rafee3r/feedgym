import { CoachChat } from "@/components/coach/CoachChat"

export default function CoachPage() {
    return (
        <div className="h-[calc(100vh-1px)] flex flex-col">
            <CoachChat className="flex-1" />
        </div>
    )
}
