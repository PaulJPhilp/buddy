"use client";

import { type ErrorCategory, type ErrorSeverity, errorManagerSelectors, errorManagerStore, useErrorManagerStore } from "@/stores/errorManagerStore";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/ui/card";
import { Input } from "@ui/components/ui/input";
import { ScrollArea } from "@ui/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { Separator } from "@ui/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/ui/tabs";
import { Textarea } from "@ui/components/ui/textarea";
import { useStore } from "@xstate/store/react";
import {
    AlertCircle,
    AlertTriangle,
    Bug,
    CheckCircle,
    Clock,
    Filter,
    Info,
    Search,
    Settings,
    Trash2,
    X,
    XCircle,
    Zap
} from "lucide-react";
import { useMemo } from "react";

interface ErrorManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ErrorManager({ isOpen, onClose }: ErrorManagerProps) {
    const errorState = useErrorManagerStore();

    // Apply selectors manually to the state
    const filteredErrors = errorManagerSelectors.getFilteredErrors(errorState);
    const safeFilteredErrors = Array.isArray(filteredErrors) ? filteredErrors : [];
    const unresolvedErrors = errorManagerSelectors.getUnresolvedErrors(errorState);
    const safeUnresolvedErrors = Array.isArray(unresolvedErrors) ? unresolvedErrors : [];
    const criticalErrors = errorManagerSelectors.getCriticalErrors(errorState);
    const safeCriticalErrors = Array.isArray(criticalErrors) ? criticalErrors : [];
    const recentErrors = errorManagerSelectors.getRecentErrors(errorState);
    const safeRecentErrors = Array.isArray(recentErrors) ? recentErrors : [];
    const selectedError = errorManagerSelectors.getSelectedError(errorState);

    const errorCounts = useMemo(() => ({
        all: errorState.errors?.length || 0,
        unresolved: safeUnresolvedErrors.length,
        critical: safeCriticalErrors.length,
        recent: safeRecentErrors.length,
    }), [errorState.errors?.length, safeUnresolvedErrors.length, safeCriticalErrors.length, safeRecentErrors.length]);

    const getSeverityIcon = (severity: ErrorSeverity) => {
        switch (severity) {
            case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'low': return <Info className="h-4 w-4 text-blue-500" />;
            default: return <Bug className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: ErrorSeverity) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'high': return 'destructive';
            case 'medium': return 'secondary';
            case 'low': return 'outline';
            default: return 'outline';
        }
    };

    const getCategoryIcon = (category: ErrorCategory) => {
        switch (category) {
            case 'network': return <Zap className="h-3 w-3" />;
            case 'validation': return <AlertTriangle className="h-3 w-3" />;
            case 'runtime': return <Bug className="h-3 w-3" />;
            case 'auth': return <XCircle className="h-3 w-3" />;
            case 'system': return <Settings className="h-3 w-3" />;
            case 'user': return <Info className="h-3 w-3" />;
            default: return <Bug className="h-3 w-3" />;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatRelativeTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const handleResolveError = (errorId: string) => {
        errorManagerStore.send({
            type: 'resolveError',
            errorId,
            resolvedBy: 'user'
        });
    };

    const handleDeleteError = (errorId: string) => {
        errorManagerStore.send({ type: 'deleteError', errorId });
    };

    const handleResolveAll = () => {
        errorManagerStore.send({
            type: 'resolveAllErrors',
            resolvedBy: 'user'
        });
    };

    const handleClearAll = () => {
        errorManagerStore.send({ type: 'clearAllErrors' });
    };

    return (
        <div className="w-full h-full bg-background overflow-hidden">
                <Card className="h-full rounded-none border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5" />
                            Error Manager
                            {safeUnresolvedErrors.length > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {safeUnresolvedErrors.length}
                                </Badge>
                            )}
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
                        <Tabs
                            value={errorState.activeTab}
                            className="h-full flex flex-col"
                        >
                            <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
                                <TabsTrigger
                                    value="all"
                                    onClick={() => errorManagerStore.send({ type: 'setActiveTab', tab: 'all' })}
                                    className="relative"
                                >
                                    All
                                    {errorCounts.all > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 text-xs">
                                            {errorCounts.all}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="unresolved"
                                    onClick={() => errorManagerStore.send({ type: 'setActiveTab', tab: 'unresolved' })}
                                    className="relative"
                                >
                                    Unresolved
                                    {errorCounts.unresolved > 0 && (
                                        <Badge variant="destructive" className="ml-1 h-4 text-xs">
                                            {errorCounts.unresolved}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="critical"
                                    onClick={() => errorManagerStore.send({ type: 'setActiveTab', tab: 'critical' })}
                                    className="relative"
                                >
                                    Critical
                                    {errorCounts.critical > 0 && (
                                        <Badge variant="destructive" className="ml-1 h-4 text-xs">
                                            {errorCounts.critical}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="recent"
                                    onClick={() => errorManagerStore.send({ type: 'setActiveTab', tab: 'recent' })}
                                    className="relative"
                                >
                                    Recent
                                    {errorCounts.recent > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 text-xs">
                                            {errorCounts.recent}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* Filters and Search */}
                            <div className="p-4 space-y-4 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search errors..."
                                            value={errorState.searchQuery}
                                            onChange={(e) => errorManagerStore.send({
                                                type: 'setSearchQuery',
                                                query: e.target.value
                                            })}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResolveAll}
                                        disabled={safeUnresolvedErrors.length === 0}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Resolve All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearAll}
                                        disabled={(errorState.errors?.length || 0) === 0}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Clear All
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <Select
                                            value={errorState.filterSeverity}
                                            onValueChange={(value) => errorManagerStore.send({
                                                type: 'setFilterSeverity',
                                                severity: value as ErrorSeverity | 'all'
                                            })}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Levels</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Select
                                        value={errorState.filterCategory}
                                        onValueChange={(value) => errorManagerStore.send({
                                            type: 'setFilterCategory',
                                            category: value as ErrorCategory | 'all'
                                        })}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="network">Network</SelectItem>
                                            <SelectItem value="validation">Validation</SelectItem>
                                            <SelectItem value="runtime">Runtime</SelectItem>
                                            <SelectItem value="auth">Auth</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Error List */}
                            <TabsContent value={errorState.activeTab} className="flex-1 overflow-hidden m-0">
                                <div className="h-full flex">
                                    {/* Error List */}
                                    <div className="flex-1 border-r">
                                        <ScrollArea className="h-full">
                                            <div className="p-4 space-y-2">
                                                {safeFilteredErrors.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                        <p>No errors found</p>
                                                        <p className="text-sm">
                                                            {errorState.activeTab === 'unresolved'
                                                                ? "All errors have been resolved!"
                                                                : "Try adjusting your filters"
                                                            }
                                                        </p>
                                                    </div>
                                                ) : (
                                                    safeFilteredErrors.map((error) => (
                                                        <Card
                                                            key={error.id}
                                                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedError?.id === error.id ? 'ring-2 ring-primary' : ''
                                                                }`}
                                                            onClick={() => errorManagerStore.send({
                                                                type: 'selectError',
                                                                errorId: error.id
                                                            })}
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                                        {getSeverityIcon(error.severity)}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Badge
                                                                                    variant={getSeverityColor(error.severity)}
                                                                                    className="text-xs"
                                                                                >
                                                                                    {error.severity}
                                                                                </Badge>
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    <span className="mr-1">{getCategoryIcon(error.category)}</span>
                                                                                    {error.category}
                                                                                </Badge>
                                                                                {error.resolved && (
                                                                                    <Badge variant="secondary" className="text-xs">
                                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                                        Resolved
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm font-medium truncate">
                                                                                {error.message}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                                <Clock className="h-3 w-3" />
                                                                                <span>{formatRelativeTime(error.timestamp)}</span>
                                                                                {error.source && (
                                                                                    <>
                                                                                        <span>•</span>
                                                                                        <span>{error.source}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        {!error.resolved && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleResolveError(error.id);
                                                                                }}
                                                                                className="h-6 w-6 p-0"
                                                                            >
                                                                                <CheckCircle className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteError(error.id);
                                                                            }}
                                                                            className="h-6 w-6 p-0"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Error Details */}
                                    {selectedError && (
                                        <div className="w-80">
                                            <ScrollArea className="h-full">
                                                <div className="p-4 space-y-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-2">Error Details</h3>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                {getSeverityIcon(selectedError.severity)}
                                                                <Badge variant={getSeverityColor(selectedError.severity)}>
                                                                    {selectedError.severity}
                                                                </Badge>
                                                                <Badge variant="outline">
                                                                    <span className="mr-1">{getCategoryIcon(selectedError.category)}</span>
                                                                    {selectedError.category}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm">{selectedError.message}</p>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div>
                                                        <h4 className="font-medium mb-2">Timestamp</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatTimestamp(selectedError.timestamp)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatRelativeTime(selectedError.timestamp)}
                                                        </p>
                                                    </div>

                                                    {selectedError.source && (
                                                        <>
                                                            <Separator />
                                                            <div>
                                                                <h4 className="font-medium mb-2">Source</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {selectedError.source}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}

                                                    {selectedError.stack && (
                                                        <>
                                                            <Separator />
                                                            <div>
                                                                <h4 className="font-medium mb-2">Stack Trace</h4>
                                                                <Textarea
                                                                    value={selectedError.stack}
                                                                    readOnly
                                                                    className="text-xs font-mono h-32"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                                                        <>
                                                            <Separator />
                                                            <div>
                                                                <h4 className="font-medium mb-2">Metadata</h4>
                                                                <Textarea
                                                                    value={JSON.stringify(selectedError.metadata, null, 2)}
                                                                    readOnly
                                                                    className="text-xs font-mono h-24"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    {selectedError.resolved && (
                                                        <>
                                                            <Separator />
                                                            <div>
                                                                <h4 className="font-medium mb-2">Resolution</h4>
                                                                <div className="space-y-1">
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Resolved {formatRelativeTime(selectedError.resolvedAt ?? Date.now())}
                                                                    </p>
                                                                    {selectedError.resolvedBy && (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            By: {selectedError.resolvedBy}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <Separator />

                                                    <div className="space-y-2">
                                                        {!selectedError.resolved ? (
                                                            <Button
                                                                onClick={() => handleResolveError(selectedError.id)}
                                                                className="w-full"
                                                                size="sm"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Mark as Resolved
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                disabled
                                                                className="w-full"
                                                                size="sm"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Resolved
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => handleDeleteError(selectedError.id)}
                                                            className="w-full"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Error
                                                        </Button>
                                                    </div>
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </Card>
            </div>
    );
} 