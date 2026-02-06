
import { Button } from '@/modules/DesignSystem/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/modules/DesignSystem/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/DesignSystem/ui/tabs';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import { DataSourceConfig } from '@/modules/DataLayer/components/DataSourceConfig';
import { Switch } from '@/modules/DesignSystem/ui/switch';
import { Settings } from 'lucide-react';
import { useState } from 'react';

export function WorkspaceSettingsDialog() {
    const { dataSourceConfig, setDataSourceConfig, autosaveEnabled, setAutosaveEnabled } = useArtboardContext();
    const [open, setOpen] = useState(false);

    // Default to 'static' if not set
    const currentConfig = dataSourceConfig || { type: 'static' };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Workspace Settings">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Workspace Settings</DialogTitle>
                    <DialogDescription>
                        Configure global settings for this workspace.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="data-source" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="data-source">Data Source</TabsTrigger>
                        <TabsTrigger value="general">General</TabsTrigger>
                    </TabsList>

                    <TabsContent value="data-source" className="flex-1 overflow-y-auto mt-4 pr-1">
                        <div className="space-y-4">
                            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                <p>
                                    <strong>Global Data Source:</strong> This setting applies to all widgets in this workspace.
                                    Connecting a Google Sheet here allows you to use its data across your entire dashboard.
                                </p>
                            </div>

                            <DataSourceConfig
                                value={currentConfig}
                                onChange={setDataSourceConfig}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="general">
                        <div className="space-y-4">
                            <div className="rounded-md border bg-muted/20 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">AutoSave</p>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically save workspace changes in the background.
                                        </p>
                                    </div>
                                    <Switch checked={autosaveEnabled} onCheckedChange={setAutosaveEnabled} />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
