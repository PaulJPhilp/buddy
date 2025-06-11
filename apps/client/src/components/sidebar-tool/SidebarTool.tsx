"use client";

import { appLayoutStore, useAppLayoutStore } from "@/stores/appLayoutStore";
import { sidebarToolStore, useSidebarToolStore } from "@/stores/sidebarToolStore";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { Card, CardHeader, CardTitle } from "@ui/components/ui/card";
import { Label } from "@ui/components/ui/label";
import { Separator } from "@ui/components/ui/separator";
import { Slider } from "@ui/components/ui/slider";
import { Switch } from "@ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/ui/tabs";
import { ChevronLeft, ChevronRight, Monitor, RotateCcw, Sidebar, Smartphone, Tablet, X } from "lucide-react";

interface SidebarToolProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SidebarTool({ isOpen, onClose }: SidebarToolProps) {
    const layoutState = useAppLayoutStore();
    const toolState = useSidebarToolStore();

    const handleSidebarToggle = () => {
        appLayoutStore.send({ type: 'toggleSidebar' });
    };

    const handleWidthChange = (value: number[]) => {
        appLayoutStore.send({ type: 'setSidebarWidth', width: value[0] });
    };

    const handleModeChange = (mode: 'overlay' | 'push' | 'fixed') => {
        appLayoutStore.send({ type: 'setLayoutMode', mode });
    };

    const handleAnimationToggle = (enabled: boolean) => {
        appLayoutStore.send({ type: 'setAnimationEnabled', enabled });
    };

    const handleAutoCollapseToggle = (enabled: boolean) => {
        appLayoutStore.send({ type: 'setAutoCollapse', enabled });
    };

    const resetToDefaults = () => {
        appLayoutStore.send({ type: 'resetToDefaults' });
    };

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'desktop': return Monitor;
            case 'tablet': return Tablet;
            case 'mobile': return Smartphone;
            default: return Monitor;
        }
    };

    const getLayoutModeDescription = (mode: string) => {
        switch (mode) {
            case 'overlay': return 'Sidebar overlays content';
            case 'push': return 'Sidebar pushes content aside';
            case 'fixed': return 'Sidebar is always visible';
            default: return '';
        }
    };

    return (
        <div className="w-full h-full bg-background overflow-hidden">
            <Card className="h-full rounded-none border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Sidebar className="h-5 w-5" />
                        Sidebar Tool
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
                    <Tabs value={toolState.activeTab} className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
                            <TabsTrigger
                                value="controls"
                                onClick={() => sidebarToolStore.send({ type: 'setActiveTab', tab: 'controls' })}
                            >
                                Controls
                            </TabsTrigger>
                            <TabsTrigger
                                value="layout"
                                onClick={() => sidebarToolStore.send({ type: 'setActiveTab', tab: 'layout' })}
                            >
                                Layout
                            </TabsTrigger>
                            <TabsTrigger
                                value="preview"
                                onClick={() => sidebarToolStore.send({ type: 'setActiveTab', tab: 'preview' })}
                            >
                                Preview
                            </TabsTrigger>
                        </TabsList>

                        {/* Controls Tab */}
                        <TabsContent value="controls" className="flex-1 overflow-hidden m-0">
                            <div className="p-4 space-y-6 h-full overflow-y-auto">
                                {/* Current Status */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Current Status</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card className="p-3">
                                            <div className="text-sm text-muted-foreground">State</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={layoutState.isSidebarOpen ? "default" : "secondary"}>
                                                    {layoutState.isSidebarOpen ? "Open" : "Closed"}
                                                </Badge>
                                            </div>
                                        </Card>
                                        <Card className="p-3">
                                            <div className="text-sm text-muted-foreground">Width</div>
                                            <div className="text-lg font-semibold mt-1">
                                                {layoutState.sidebarWidth}px
                                            </div>
                                        </Card>
                                    </div>
                                </div>

                                <Separator />

                                {/* Quick Actions */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSidebarToggle}
                                            className="flex items-center gap-2"
                                        >
                                            {layoutState.isSidebarOpen ? (
                                                <>
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Close
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronRight className="h-4 w-4" />
                                                    Open
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetToDefaults}
                                            className="flex items-center gap-2"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                {/* Width Control */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Sidebar Width</Label>
                                        <span className="text-sm text-muted-foreground">
                                            {layoutState.sidebarWidth}px
                                        </span>
                                    </div>
                                    <Slider
                                        value={[layoutState.sidebarWidth]}
                                        onValueChange={handleWidthChange}
                                        min={200}
                                        max={500}
                                        step={10}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>200px</span>
                                        <span>500px</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Behavior Settings */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Behavior</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Animations</Label>
                                            <div className="text-xs text-muted-foreground">
                                                Enable smooth transitions
                                            </div>
                                        </div>
                                        <Switch
                                            checked={layoutState.animationEnabled}
                                            onCheckedChange={handleAnimationToggle}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Auto Collapse</Label>
                                            <div className="text-xs text-muted-foreground">
                                                Auto-collapse on mobile
                                            </div>
                                        </div>
                                        <Switch
                                            checked={layoutState.autoCollapse}
                                            onCheckedChange={handleAutoCollapseToggle}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Device Info */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Device Detection</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Card className="p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="h-4 w-4" />
                                                    <span className="text-sm">Mobile Device</span>
                                                </div>
                                                <Badge variant={layoutState.isMobile ? "default" : "secondary"}>
                                                    {layoutState.isMobile ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Layout Tab */}
                        <TabsContent value="layout" className="flex-1 overflow-hidden m-0">
                            <div className="p-4 space-y-6 h-full overflow-y-auto">
                                {/* Layout Mode */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Layout Mode</h3>
                                    <div className="space-y-2">
                                        {(['overlay', 'push', 'fixed'] as const).map((mode) => (
                                            <Card
                                                key={mode}
                                                className={`p-3 cursor-pointer transition-colors ${layoutState.layoutMode === mode
                                                    ? 'ring-2 ring-primary bg-accent'
                                                    : 'hover:bg-accent'
                                                    }`}
                                                onClick={() => handleModeChange(mode)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium capitalize">{mode}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {getLayoutModeDescription(mode)}
                                                        </div>
                                                    </div>
                                                    {layoutState.layoutMode === mode && (
                                                        <Badge variant="default">Active</Badge>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Responsive Breakpoints */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Responsive Breakpoints</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Mobile</span>
                                            <span className="text-muted-foreground">&lt; 768px</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Tablet</span>
                                            <span className="text-muted-foreground">768px - 1024px</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Desktop</span>
                                            <span className="text-muted-foreground">&gt; 1024px</span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Layout Statistics */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Layout Statistics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card className="p-3">
                                            <div className="text-xs text-muted-foreground">Content Width</div>
                                            <div className="text-sm font-medium">
                                                {layoutState.isSidebarOpen
                                                    ? `calc(100% - ${layoutState.sidebarWidth}px)`
                                                    : '100%'
                                                }
                                            </div>
                                        </Card>
                                        <Card className="p-3">
                                            <div className="text-xs text-muted-foreground">Layout Mode</div>
                                            <div className="text-sm font-medium capitalize">
                                                {layoutState.layoutMode}
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Preview Tab */}
                        <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
                            <div className="p-4 space-y-6 h-full overflow-y-auto">
                                {/* Device Preview Selector */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Preview Mode</h3>
                                    <div className="flex gap-2">
                                        {(['desktop', 'tablet', 'mobile'] as const).map((device) => {
                                            const Icon = getDeviceIcon(device);
                                            return (
                                                <Button
                                                    key={device}
                                                    variant={toolState.previewMode === device ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => sidebarToolStore.send({ type: 'setPreviewMode', mode: device })}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span className="capitalize">{device}</span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Separator />

                                {/* Layout Preview */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Layout Preview</h3>
                                    <Card className="p-4">
                                        <div className={`
                        border rounded-lg overflow-hidden
                        ${toolState.previewMode === 'mobile' ? 'w-full max-w-[320px] mx-auto' : ''}
                        ${toolState.previewMode === 'tablet' ? 'w-full max-w-[768px] mx-auto' : ''}
                        ${toolState.previewMode === 'desktop' ? 'w-full' : ''}
                      `}>
                                            {/* Mini Layout Representation */}
                                            <div className="bg-muted p-2 text-xs text-center border-b">
                                                Toolbar
                                            </div>
                                            <div className="flex" style={{ height: '120px' }}>
                                                {/* Sidebar */}
                                                {layoutState.isSidebarOpen && (
                                                    <div
                                                        className="bg-accent border-r flex items-center justify-center text-xs"
                                                        style={{
                                                            width: toolState.previewMode === 'mobile' ? '60px' : '80px',
                                                            minWidth: toolState.previewMode === 'mobile' ? '60px' : '80px'
                                                        }}
                                                    >
                                                        Sidebar
                                                    </div>
                                                )}
                                                {/* Main Content */}
                                                <div className="flex-1 bg-background border flex items-center justify-center text-xs">
                                                    Main Content
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <Separator />

                                {/* Current Configuration */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">Current Configuration</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">State:</span>
                                            <span>{layoutState.isSidebarOpen ? 'Open' : 'Closed'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Width:</span>
                                            <span>{layoutState.sidebarWidth}px</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Mode:</span>
                                            <span className="capitalize">{layoutState.layoutMode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Animations:</span>
                                            <span>{layoutState.animationEnabled ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Auto Collapse:</span>
                                            <span>{layoutState.autoCollapse ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </Card>
        </div>
    );
} 