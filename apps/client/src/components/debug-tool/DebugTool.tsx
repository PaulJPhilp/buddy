"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
    type LogLevel,
    type LogSource,
    debugToolSelectors,
    debugToolStore,
    useDebugToolStore
} from "@/stores/debugToolStore";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle
} from "@ui/components/ui/card";
import { Label } from "@ui/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@ui/components/ui/select";
import { Separator } from "@ui/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@ui/components/ui/tabs";
import { Textarea } from "@ui/components/ui/textarea";
import { useStore } from "@xstate/store/react";
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Bug,
    Database,
    Download,
    Filter,
    Info,
    Monitor,
    Network,
    Pause,
    Play,
    Search,
    Settings,
    Trash2,
    X,
    XCircle,
    Zap
} from "lucide-react";
import { useMemo } from "react";

interface DebugToolProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DebugTool({ isOpen, onClose }: DebugToolProps) {
    const debugState = useDebugToolStore();

    // Apply selectors manually to the state
    const filteredLogs = debugToolSelectors.getFilteredLogs(debugState);
    const safeFilteredLogs = Array.isArray(filteredLogs) ? filteredLogs : [];
    const selectedLog = debugToolSelectors.getSelectedLog(debugState);
    const logsByLevel = debugToolSelectors.getLogsByLevel(debugState);
    const logsBySource = debugToolSelectors.getLogsBySource(debugState);
    const recentLogs = debugToolSelectors.getRecentLogs(debugState);
    const safeRecentLogs = Array.isArray(recentLogs) ? recentLogs : [];
    const errorLogs = debugToolSelectors.getErrorLogs(debugState);
    const safeErrorLogs = Array.isArray(errorLogs) ? errorLogs : [];

    const tabCounts = useMemo(
        () => ({
            logs: debugState.logs?.length || 0,
            performance: debugState.performanceMetrics?.length || 0,
            state: 0, // Placeholder for state inspection
            network: 0, // Placeholder for network monitoring
        }),
        [debugState.logs?.length, debugState.performanceMetrics?.length],
    );

    const getLevelIcon = (level: LogLevel) => {
        switch (level) {
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "warn":
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case "info":
                return <Info className="h-4 w-4 text-blue-500" />;
            case "debug":
                return <Bug className="h-4 w-4 text-gray-500" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getLevelColor = (level: LogLevel) => {
        switch (level) {
            case "error":
                return "destructive";
            case "warn":
                return "secondary";
            case "info":
                return "outline";
            case "debug":
                return "outline";
            default:
                return "outline";
        }
    };

    const getSourceIcon = (source: LogSource) => {
        switch (source) {
            case "client":
                return <Monitor className="h-3 w-3" />;
            case "server":
                return <Database className="h-3 w-3" />;
            case "websocket":
                return <Network className="h-3 w-3" />;
            case "agent":
                return <Zap className="h-3 w-3" />;
            case "effect":
                return <Activity className="h-3 w-3" />;
            case "store":
                return <Database className="h-3 w-3" />;
            case "component":
                return <Monitor className="h-3 w-3" />;
            case "service":
                return <Settings className="h-3 w-3" />;
            default:
                return <Bug className="h-3 w-3" />;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatRelativeTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        if (seconds > 0) return `${seconds}s ago`;
        return "Just now";
    };

    const formatDuration = (duration: number) => {
        if (duration < 1000) return `${duration.toFixed(2)}ms`;
        return `${(duration / 1000).toFixed(2)}s`;
    };

    const handleClearLogs = () => {
        debugToolStore.send({ type: "clearLogs" });
    };

    const handleClearMetrics = () => {
        debugToolStore.send({ type: "clearMetrics" });
    };

    const handleClearAll = () => {
        debugToolStore.send({ type: "clearAll" });
    };

    const handleToggleRecording = () => {
        debugToolStore.send({ type: "toggleRecording" });
    };

    const handleExportLogs = () => {
        const data = {
            timestamp: Date.now(),
            logs: debugState.logs,
            performanceMetrics: debugState.performanceMetrics,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full bg-background overflow-hidden">
                <Card className="h-full rounded-none border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5" />
                            Debug Tool
                            <div className="flex items-center gap-1 ml-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${debugState.isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"}`}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {debugState.isRecording ? "Recording" : "Paused"}
                                </span>
                            </div>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleRecording}
                            >
                                {debugState.isRecording ? (
                                    <Pause className="h-4 w-4 mr-1" />
                                ) : (
                                    <Play className="h-4 w-4 mr-1" />
                                )}
                                {debugState.isRecording ? "Pause" : "Record"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportLogs}
                                disabled={debugState.logs?.length === 0}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Export
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <div className="flex-1 overflow-hidden">
                        <Tabs value={debugState.activeTab} className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-5 mx-4 mt-4">
                                <TabsTrigger
                                    value="logs"
                                    onClick={() =>
                                        debugToolStore.send({ type: "setActiveTab", tab: "logs" })
                                    }
                                >
                                    Logs
                                    {tabCounts.logs > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 text-xs">
                                            {tabCounts.logs}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="performance"
                                    onClick={() =>
                                        debugToolStore.send({
                                            type: "setActiveTab",
                                            tab: "performance",
                                        })
                                    }
                                >
                                    Performance
                                    {tabCounts.performance > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 text-xs">
                                            {tabCounts.performance}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="state"
                                    onClick={() =>
                                        debugToolStore.send({ type: "setActiveTab", tab: "state" })
                                    }
                                >
                                    State
                                </TabsTrigger>
                                <TabsTrigger
                                    value="network"
                                    onClick={() =>
                                        debugToolStore.send({
                                            type: "setActiveTab",
                                            tab: "network",
                                        })
                                    }
                                >
                                    Network
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    onClick={() =>
                                        debugToolStore.send({
                                            type: "setActiveTab",
                                            tab: "settings",
                                        })
                                    }
                                >
                                    Settings
                                </TabsTrigger>
                            </TabsList>

                            {/* Logs Tab */}
                            <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
                                {/* Filters and Controls */}
                                <div className="p-4 space-y-4 border-b">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search logs..."
                                                value={debugState.searchQuery}
                                                onChange={(e) =>
                                                    debugToolStore.send({
                                                        type: "setSearchQuery",
                                                        query: e.target.value,
                                                    })
                                                }
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClearLogs}
                                            disabled={debugState.logs?.length === 0}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Clear Logs
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-muted-foreground" />
                                            <Select
                                                value={debugState.filterLevel}
                                                onValueChange={(value) =>
                                                    debugToolStore.send({
                                                        type: "setFilterLevel",
                                                        level: value as LogLevel | "all",
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Levels</SelectItem>
                                                    <SelectItem value="error">Error</SelectItem>
                                                    <SelectItem value="warn">Warning</SelectItem>
                                                    <SelectItem value="info">Info</SelectItem>
                                                    <SelectItem value="debug">Debug</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Select
                                            value={debugState.filterSource}
                                            onValueChange={(value) =>
                                                debugToolStore.send({
                                                    type: "setFilterSource",
                                                    source: value as LogSource | "all",
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sources</SelectItem>
                                                <SelectItem value="client">Client</SelectItem>
                                                <SelectItem value="server">Server</SelectItem>
                                                <SelectItem value="websocket">WebSocket</SelectItem>
                                                <SelectItem value="agent">Agent</SelectItem>
                                                <SelectItem value="effect">Effect</SelectItem>
                                                <SelectItem value="store">Store</SelectItem>
                                                <SelectItem value="component">Component</SelectItem>
                                                <SelectItem value="service">Service</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={debugState.autoScroll}
                                                onCheckedChange={() =>
                                                    debugToolStore.send({ type: "toggleAutoScroll" })
                                                }
                                            />
                                            <Label className="text-sm">Auto-scroll</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={debugState.showTimestamps}
                                                onCheckedChange={() =>
                                                    debugToolStore.send({ type: "toggleTimestamps" })
                                                }
                                            />
                                            <Label className="text-sm">Timestamps</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={debugState.showMetadata}
                                                onCheckedChange={() =>
                                                    debugToolStore.send({ type: "toggleMetadata" })
                                                }
                                            />
                                            <Label className="text-sm">Metadata</Label>
                                        </div>
                                    </div>

                                    {/* Log Level Summary */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            <span>Errors: {logsByLevel?.error || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            <span>Warnings: {logsByLevel?.warn || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Info className="h-4 w-4 text-blue-500" />
                                            <span>Info: {logsByLevel?.info || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bug className="h-4 w-4 text-gray-500" />
                                            <span>Debug: {logsByLevel?.debug || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Log List */}
                                <div className="h-full flex">
                                    <div className="flex-1 border-r">
                                        <ScrollArea className="h-full">
                                            <div className="p-4 space-y-1">
                                                {safeFilteredLogs.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                        <p>No logs found</p>
                                                        <p className="text-sm">
                                                            {debugState.isRecording
                                                                ? "Logs will appear here as they are generated"
                                                                : "Recording is paused"}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    safeFilteredLogs.map((log) => (
                                                        <button
                                                            key={log.id}
                                                            type="button"
                                                            className={`w-full text-left cursor-pointer p-2 rounded text-sm hover:bg-muted/50 transition-colors ${selectedLog?.id === log.id
                                                                ? "bg-muted ring-1 ring-primary"
                                                                : ""
                                                                }`}
                                                            onClick={() =>
                                                                debugToolStore.send({
                                                                    type: "selectLog",
                                                                    logId: log.id,
                                                                })
                                                            }
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                {getLevelIcon(log.level)}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge
                                                                            variant={getLevelColor(log.level)}
                                                                            className="text-xs"
                                                                        >
                                                                            {log.level}
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            <span className="mr-1">
                                                                                {getSourceIcon(log.source)}
                                                                            </span>
                                                                            {log.source}
                                                                        </Badge>
                                                                        {debugState.showTimestamps && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {formatRelativeTime(log.timestamp)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="font-mono text-xs break-all">
                                                                        {log.message}
                                                                    </p>
                                                                    {log.module && log.method && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {log.module}.{log.method}
                                                                        </p>
                                                                    )}
                                                                    {debugState.showMetadata && log.metadata && (
                                                                        <pre className="text-xs text-muted-foreground mt-1 bg-muted/50 p-1 rounded">
                                                                            {JSON.stringify(log.metadata, null, 2)}
                                                                        </pre>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Log Details */}
                                    {selectedLog && (
                                        <div className="w-80">
                                            <ScrollArea className="h-full">
                                                <div className="p-4 space-y-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-2">Log Details</h3>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                {getLevelIcon(selectedLog.level)}
                                                                <Badge
                                                                    variant={getLevelColor(selectedLog.level)}
                                                                >
                                                                    {selectedLog.level}
                                                                </Badge>
                                                                <Badge variant="outline">
                                                                    <span className="mr-1">
                                                                        {getSourceIcon(selectedLog.source)}
                                                                    </span>
                                                                    {selectedLog.source}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm font-mono">
                                                                {selectedLog.message}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div>
                                                        <h4 className="font-medium mb-2">Timestamp</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatTimestamp(selectedLog.timestamp)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatRelativeTime(selectedLog.timestamp)}
                                                        </p>
                                                    </div>

                                                    {(selectedLog.module || selectedLog.method) && (
                                                        <>
                                                            <Separator />
                                                            <div>
                                                                <h4 className="font-medium mb-2">Location</h4>
                                                                {selectedLog.module && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Module: {selectedLog.module}
                                                                    </p>
                                                                )}
                                                                {selectedLog.method && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Method: {selectedLog.method}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    {selectedLog.stack && (
                                                        <>
                                                            <Separator />
                                                            <div>
                                                                <h4 className="font-medium mb-2">
                                                                    Stack Trace
                                                                </h4>
                                                                <Textarea
                                                                    value={selectedLog.stack}
                                                                    readOnly
                                                                    className="text-xs font-mono h-32"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    {selectedLog.metadata &&
                                                        Object.keys(selectedLog.metadata).length > 0 && (
                                                            <>
                                                                <Separator />
                                                                <div>
                                                                    <h4 className="font-medium mb-2">Metadata</h4>
                                                                    <Textarea
                                                                        value={JSON.stringify(
                                                                            selectedLog.metadata,
                                                                            null,
                                                                            2,
                                                                        )}
                                                                        readOnly
                                                                        className="text-xs font-mono h-24"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Performance Tab */}
                            <TabsContent
                                value="performance"
                                className="flex-1 overflow-hidden m-0"
                            >
                                <div className="p-4 space-y-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Performance Metrics</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClearMetrics}
                                            disabled={debugState.performanceMetrics?.length === 0}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Clear Metrics
                                        </Button>
                                    </div>
                                </div>

                                <ScrollArea className="h-full">
                                    <div className="p-4 space-y-2">
                                        {debugState.performanceMetrics?.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>No performance metrics</p>
                                                <p className="text-sm">
                                                    Metrics will appear here as operations are measured
                                                </p>
                                            </div>
                                        ) : (
                                            (debugState.performanceMetrics || []).map((metric) => (
                                                <Card key={metric.id} className="p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{metric.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatTimestamp(metric.timestamp)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-mono text-lg">
                                                                {formatDuration(metric.duration)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(metric.timestamp)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {metric.metadata &&
                                                        Object.keys(metric.metadata).length > 0 && (
                                                            <div className="mt-2 pt-2 border-t">
                                                                <pre className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                                                    {JSON.stringify(metric.metadata, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* State Tab */}
                            <TabsContent value="state" className="flex-1 overflow-hidden m-0">
                                <div className="p-4">
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>State Inspector</p>
                                        <p className="text-sm">
                                            Coming soon - inspect application state
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Network Tab */}
                            <TabsContent
                                value="network"
                                className="flex-1 overflow-hidden m-0"
                            >
                                <div className="p-4">
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Network Monitor</p>
                                        <p className="text-sm">
                                            Coming soon - monitor network requests
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent
                                value="settings"
                                className="flex-1 overflow-hidden m-0"
                            >
                                <ScrollArea className="h-full">
                                    <div className="p-4 space-y-6">
                                        <div>
                                            <h3 className="font-semibold mb-4">
                                                Debug Tool Settings
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="font-medium">Recording</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Enable/disable log recording
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={debugState.isRecording}
                                                        onCheckedChange={() =>
                                                            debugToolStore.send({ type: "toggleRecording" })
                                                        }
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="font-medium">Auto-scroll</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Automatically scroll to new logs
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={debugState.autoScroll}
                                                        onCheckedChange={() =>
                                                            debugToolStore.send({ type: "toggleAutoScroll" })
                                                        }
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="font-medium">
                                                            Show Timestamps
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Display timestamps in log entries
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={debugState.showTimestamps}
                                                        onCheckedChange={() =>
                                                            debugToolStore.send({ type: "toggleTimestamps" })
                                                        }
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="font-medium">Show Metadata</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Display metadata in log entries
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={debugState.showMetadata}
                                                        onCheckedChange={() =>
                                                            debugToolStore.send({ type: "toggleMetadata" })
                                                        }
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <Label className="font-medium">Max Log Entries</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Maximum number of log entries to keep
                                                    </p>
                                                    <Input
                                                        type="number"
                                                        value={debugState.maxLogs}
                                                        onChange={(e) =>
                                                            debugToolStore.send({
                                                                type: "setMaxLogs",
                                                                maxLogs:
                                                                    Number.parseInt(e.target.value) || 5000,
                                                            })
                                                        }
                                                        min={100}
                                                        max={50000}
                                                        step={100}
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <Label className="font-medium">
                                                        Max Performance Metrics
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Maximum number of performance metrics to keep
                                                    </p>
                                                    <Input
                                                        type="number"
                                                        value={debugState.maxMetrics}
                                                        onChange={(e) =>
                                                            debugToolStore.send({
                                                                type: "setMaxMetrics",
                                                                maxMetrics:
                                                                    Number.parseInt(e.target.value) || 1000,
                                                            })
                                                        }
                                                        min={50}
                                                        max={10000}
                                                        step={50}
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleClearAll}
                                                        disabled={
                                                            debugState.logs?.length === 0 &&
                                                            debugState.performanceMetrics?.length === 0
                                                        }
                                                        className="w-full"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Clear All Data
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </Card>
            </div>
    );
}
