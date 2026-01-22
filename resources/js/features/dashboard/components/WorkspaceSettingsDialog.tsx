
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useArtboardContext } from '@/core/context/ArtboardContext';
import { DataSourceConfig } from '@/features/data-sources/components/DataSourceConfig';
import { Settings } from 'lucide-react';
import { useState } from 'react';

export function WorkspaceSettingsDialog() {
    const { dataSourceConfig, setDataSourceConfig } = useArtboardContext();
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
                        <TabsTrigger value="general" disabled>General (Coming Soon)</TabsTrigger>
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
                        <div className="flex bg-muted/20 h-full items-center justify-center rounded-lg border border-dashed">
                            <p className="text-muted-foreground">General settings coming soon.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
