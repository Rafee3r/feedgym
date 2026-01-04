"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search as SearchIcon, Users, FileText } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { getInitials } from "@/lib/utils"

interface SearchUser {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    bio: string | null
}

interface SearchPost {
    id: string
    content: string
    author: {
        username: string
        displayName: string
        avatarUrl: string | null
    }
}

export default function SearchPage() {
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || ""

    const [query, setQuery] = useState(initialQuery)
    const [isSearching, setIsSearching] = useState(false)
    const [users, setUsers] = useState<SearchUser[]>([])
    const [posts, setPosts] = useState<SearchPost[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsSearching(true)
        setHasSearched(true)

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users)
                setPosts(data.posts)
            }
        } catch (err) {
            console.error("Search error:", err)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <>
            <Header title="Buscar" />

            {/* Search Input */}
            <form onSubmit={handleSearch} className="p-4 border-b border-border">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar usuarios o posts..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 rounded-full"
                    />
                </div>
            </form>

            {/* Results */}
            {!hasSearched ? (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <SearchIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">Explora FeedGym</h3>
                    <p className="text-muted-foreground mt-1">
                        Busca usuarios, entrenamientos y más
                    </p>
                </div>
            ) : isSearching ? (
                <div className="divide-y divide-border">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-4 py-3 flex gap-3">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Tabs defaultValue="users">
                    <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
                        <TabsTrigger
                            value="users"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Usuarios ({users.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="posts"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Posts ({posts.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="mt-0">
                        {users.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No se encontraron usuarios
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {users.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/${user.username}`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                                    >
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={user.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {getInitials(user.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{user.displayName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                @{user.username}
                                            </p>
                                            {user.bio && (
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {user.bio}
                                                </p>
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full">
                                            Ver perfil
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="posts" className="mt-0">
                        {posts.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No se encontraron posts
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {posts.map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/post/${post.id}`}
                                        className="block px-4 py-3 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={post.author.avatarUrl || undefined} />
                                                <AvatarFallback>
                                                    {post.author.displayName.slice(0, 1)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold text-sm">
                                                {post.author.displayName}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                @{post.author.username}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2">{post.content}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </>
    )
}
