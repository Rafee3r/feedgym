"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageCircle, UserPlus, Repeat2, AtSign, Check } from "lucide-react"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import type { NotificationData, NotificationType } from "@/types"

const notificationConfig: Record<
    NotificationType,
    { icon: React.ElementType; text: string; color: string }
> = {
    LIKE: { icon: Heart, text: "le gustó tu post", color: "text-red-500" },
    REPLY: { icon: MessageCircle, text: "respondió a tu post", color: "text-primary" },
    REPOST: { icon: Repeat2, text: "reposteó tu post", color: "text-green-500" },
    QUOTE: { icon: Repeat2, text: "citó tu post", color: "text-green-500" },
    FOLLOW: { icon: UserPlus, text: "te siguió", color: "text-primary" },
    MENTION: { icon: AtSign, text: "te mencionó", color: "text-primary" },
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch("/api/notifications")
                if (response.ok) {
                    const data = await response.json()
                    setNotifications(data.notifications)
                    setUnreadCount(data.unreadCount)
                }
            } catch (err) {
                console.error("Error fetching notifications:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchNotifications()
    }, [])

    const handleMarkAllRead = async () => {
        try {
            const response = await fetch("/api/notifications", { method: "PATCH" })
            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true }))
                )
                setUnreadCount(0)
            }
        } catch (err) {
            console.error("Error marking as read:", err)
        }
    }

    return (
        <>
            <Header title="Notificaciones" />

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
                <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {unreadCount} sin leer
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                        <Check className="w-4 h-4 mr-1" />
                        Marcar como leídas
                    </Button>
                </div>
            )}

            {/* Notifications List */}
            {isLoading ? (
                <div className="divide-y divide-border">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-4 py-3 flex gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">Sin notificaciones</h3>
                    <p className="text-muted-foreground mt-1">
                        Cuando tengas actividad, aparecerá aquí
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {notifications.map((notification) => {
                        const config = notificationConfig[notification.type]
                        const Icon = config.icon
                        const href =
                            notification.type === "FOLLOW"
                                ? `/${notification.actor.username}`
                                : notification.post
                                    ? `/post/${notification.post.id}`
                                    : "#"

                        return (
                            <Link
                                key={notification.id}
                                href={href}
                                className={`flex gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${!notification.read ? "bg-primary/5" : ""
                                    }`}
                            >
                                <div className={`mt-1 ${config.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={notification.actor.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {getInitials(notification.actor.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                <span className="font-semibold">
                                                    {notification.actor.displayName}
                                                </span>{" "}
                                                {config.text}
                                            </p>
                                        </div>
                                    </div>
                                    {notification.post && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {notification.post.content}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatRelativeTime(notification.createdAt)}
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </>
    )
}
