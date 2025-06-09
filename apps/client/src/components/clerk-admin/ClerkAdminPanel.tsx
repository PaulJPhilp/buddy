"use client";

import { clerkAdminStore, useClerkAdminStore } from "@/stores/clerkAdminStore";
import { useClerk, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components/ui/avatar";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { Card, CardHeader, CardTitle } from "@ui/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui/components/ui/dropdown-menu";
import { Input } from "@ui/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/ui/tabs";
import { Calendar, Edit, Eye, Mail, MoreVertical, Search, Shield, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ClerkAdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Mock user data structure (in real app, this would come from Clerk API)
interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
    createdAt: string;
    lastSignInAt?: string;
    role: 'admin' | 'user';
    status: 'active' | 'suspended' | 'pending';
    emailVerified: boolean;
}

// Mock data for demonstration
const mockUsers: UserData[] = [
    {
        id: "user_1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        imageUrl: "",
        createdAt: "2024-01-15T10:30:00Z",
        lastSignInAt: "2024-01-20T14:22:00Z",
        role: "admin",
        status: "active",
        emailVerified: true,
    },
    {
        id: "user_2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        imageUrl: "",
        createdAt: "2024-01-10T09:15:00Z",
        lastSignInAt: "2024-01-19T16:45:00Z",
        role: "user",
        status: "active",
        emailVerified: true,
    },
    {
        id: "user_3",
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        imageUrl: "",
        createdAt: "2024-01-18T11:20:00Z",
        lastSignInAt: undefined,
        role: "user",
        status: "pending",
        emailVerified: false,
    },
];

export function ClerkAdminPanel({ isOpen, onClose }: ClerkAdminPanelProps) {
    const adminState = useClerkAdminStore();
    const { user: currentUser } = useUser();
    const { openUserProfile } = useClerk();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<UserData[]>(mockUsers);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // Filter users based on search query
    const filteredUsers = users.filter(user =>
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get selected user details
    useEffect(() => {
        if (adminState.selectedUserId) {
            const user = users.find(u => u.id === adminState.selectedUserId);
            setSelectedUser(user || null);
        } else {
            setSelectedUser(null);
        }
    }, [adminState.selectedUserId, users]);

    const handleUserSelect = (userId: string) => {
        clerkAdminStore.send({ type: 'selectUser', userId });
    };

    const handleUserAction = (action: string, userId: string) => {
        console.log(`${action} user:`, userId);
        // In real implementation, this would call Clerk API
        switch (action) {
            case 'view':
                handleUserSelect(userId);
                clerkAdminStore.send({ type: 'setViewMode', mode: 'details' });
                break;
            case 'edit':
                handleUserSelect(userId);
                clerkAdminStore.send({ type: 'setViewMode', mode: 'edit' });
                break;
            case 'suspend':
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, status: 'suspended' as const } : u
                ));
                break;
            case 'activate':
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, status: 'active' as const } : u
                ));
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this user?')) {
                    setUsers(prev => prev.filter(u => u.id !== userId));
                }
                break;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getUserInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'user': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-full h-full bg-background overflow-hidden">
                <Card className="h-full rounded-none border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Management
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <div className="flex-1 overflow-hidden">
                        <Tabs value={adminState.viewMode} className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
                                <TabsTrigger
                                    value="list"
                                    onClick={() => clerkAdminStore.send({ type: 'setViewMode', mode: 'list' })}
                                >
                                    User List
                                </TabsTrigger>
                                <TabsTrigger
                                    value="details"
                                    disabled={!selectedUser}
                                    onClick={() => clerkAdminStore.send({ type: 'setViewMode', mode: 'details' })}
                                >
                                    Details
                                </TabsTrigger>
                                <TabsTrigger
                                    value="edit"
                                    disabled={!selectedUser}
                                    onClick={() => clerkAdminStore.send({ type: 'setViewMode', mode: 'edit' })}
                                >
                                    Edit
                                </TabsTrigger>
                            </TabsList>

                            {/* User List Tab */}
                            <TabsContent value="list" className="flex-1 overflow-hidden m-0">
                                <div className="p-4 space-y-4 h-full flex flex-col">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <Card className="p-3">
                                            <div className="text-2xl font-bold">{users.length}</div>
                                            <div className="text-xs text-muted-foreground">Total Users</div>
                                        </Card>
                                        <Card className="p-3">
                                            <div className="text-2xl font-bold text-green-600">
                                                {users.filter(u => u.status === 'active').length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Active</div>
                                        </Card>
                                        <Card className="p-3">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {users.filter(u => u.role === 'admin').length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Admins</div>
                                        </Card>
                                    </div>

                                    {/* User List */}
                                    <div className="flex-1 overflow-y-auto space-y-2">
                                        {filteredUsers.map((user) => (
                                            <Card
                                                key={user.id}
                                                className={`p-4 cursor-pointer transition-colors hover:bg-accent ${selectedUser?.id === user.id ? 'ring-2 ring-primary' : ''
                                                    }`}
                                                onClick={() => handleUserSelect(user.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={user.imageUrl} />
                                                            <AvatarFallback>
                                                                {getUserInitials(user.firstName, user.lastName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getStatusColor(user.status)}>
                                                            {user.status}
                                                        </Badge>
                                                        <Badge className={getRoleColor(user.role)}>
                                                            {user.role}
                                                        </Badge>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleUserAction('view', user.id)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUserAction('edit', user.id)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit User
                                                                </DropdownMenuItem>
                                                                {user.status === 'active' ? (
                                                                    <DropdownMenuItem onClick={() => handleUserAction('suspend', user.id)}>
                                                                        <Shield className="h-4 w-4 mr-2" />
                                                                        Suspend User
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)}>
                                                                        <Shield className="h-4 w-4 mr-2" />
                                                                        Activate User
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUserAction('delete', user.id)}
                                                                    className="text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete User
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* User Details Tab */}
                            <TabsContent value="details" className="flex-1 overflow-hidden m-0">
                                {selectedUser ? (
                                    <div className="p-4 space-y-6 h-full overflow-y-auto">
                                        {/* User Header */}
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={selectedUser.imageUrl} />
                                                <AvatarFallback className="text-lg">
                                                    {getUserInitials(selectedUser.firstName, selectedUser.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-xl font-semibold">
                                                    {selectedUser.firstName} {selectedUser.lastName}
                                                </h3>
                                                <p className="text-muted-foreground">{selectedUser.email}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge className={getStatusColor(selectedUser.status)}>
                                                        {selectedUser.status}
                                                    </Badge>
                                                    <Badge className={getRoleColor(selectedUser.role)}>
                                                        {selectedUser.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* User Information */}
                                        <div className="grid grid-cols-1 gap-4">
                                            <Card className="p-4">
                                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Contact Information
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Email:</span>
                                                        <span>{selectedUser.email}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Email Verified:</span>
                                                        <span className={selectedUser.emailVerified ? 'text-green-600' : 'text-red-600'}>
                                                            {selectedUser.emailVerified ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="p-4">
                                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Account Activity
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Created:</span>
                                                        <span>{formatDate(selectedUser.createdAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Last Sign In:</span>
                                                        <span>
                                                            {selectedUser.lastSignInAt
                                                                ? formatDate(selectedUser.lastSignInAt)
                                                                : 'Never'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="p-4">
                                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    Permissions & Role
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Role:</span>
                                                        <Badge className={getRoleColor(selectedUser.role)}>
                                                            {selectedUser.role}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <Badge className={getStatusColor(selectedUser.status)}>
                                                            {selectedUser.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4 border-t">
                                            <Button
                                                onClick={() => clerkAdminStore.send({ type: 'setViewMode', mode: 'edit' })}
                                                size="sm"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit User
                                            </Button>
                                            {selectedUser.status === 'active' ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleUserAction('suspend', selectedUser.id)}
                                                    size="sm"
                                                >
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Suspend
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleUserAction('activate', selectedUser.id)}
                                                    size="sm"
                                                >
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Activate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Select a user to view details
                                    </div>
                                )}
                            </TabsContent>

                            {/* Edit User Tab */}
                            <TabsContent value="edit" className="flex-1 overflow-hidden m-0">
                                {selectedUser ? (
                                    <div className="p-4 space-y-4 h-full overflow-y-auto">
                                        <div className="text-sm text-muted-foreground mb-4">
                                            Note: This is a demo interface. In a real application, this would integrate with Clerk's user management API.
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">First Name</label>
                                                    <Input defaultValue={selectedUser.firstName} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Last Name</label>
                                                    <Input defaultValue={selectedUser.lastName} />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Email</label>
                                                <Input defaultValue={selectedUser.email} />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Role</label>
                                                <select className="w-full p-2 border rounded" defaultValue={selectedUser.role}>
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Status</label>
                                                <select className="w-full p-2 border rounded" defaultValue={selectedUser.status}>
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspended</option>
                                                    <option value="pending">Pending</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t">
                                            <Button size="sm">
                                                Save Changes
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => clerkAdminStore.send({ type: 'setViewMode', mode: 'details' })}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Select a user to edit
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </Card>
            </div>
    );
} 