import { PushNotificationManager } from "@/components/pwa/PushNotificationManager"

export default function NotificationsSettingsPage() {
    return (
        <>
            <Header title="Notificaciones" showBack />

            <div className="p-4 space-y-6">
                {/* Push Subscription Manager */}
                <PushNotificationManager />

                <Separator />

                {/* Push Notification Preferences */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Preferencias de Push</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Likes</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando alguien le da like a tu post
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Respuestas</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando alguien responde a tu post
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Nuevos seguidores</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando alguien te sigue
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Menciones</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando alguien te menciona
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>

                <Separator />

                {/* Email Notifications */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Email</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Resumen semanal</Label>
                            <p className="text-sm text-muted-foreground">
                                Recibe un resumen de tu actividad
                            </p>
                        </div>
                        <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Noticias y actualizaciones</Label>
                            <p className="text-sm text-muted-foreground">
                                Novedades sobre FeedGym
                            </p>
                        </div>
                        <Switch />
                    </div>
                </div>
            </div>
        </>
    )
}
