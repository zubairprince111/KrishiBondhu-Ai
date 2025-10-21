import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FilePlus, FilePen, FileX } from 'lucide-react';

export default function AdminPage() {
  return (
    <SidebarInset>
      <AppHeader title="Admin Panel" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Administrator Controls</CardTitle>
                <CardDescription>Manage application settings and user data from here.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">View and manage all registered users.</p>
                        <Button>View Users</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Content Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Add, edit, or remove app content.</p>
                        <div className="flex flex-col gap-2">
                            <Button variant="secondary">
                                <FilePlus className="mr-2"/>
                                Add Content
                            </Button>
                             <Button variant="secondary">
                                <FilePen className="mr-2"/>
                                Edit/Update Content
                            </Button>
                             <Button variant="destructive-outline">
                                <FileX className="mr-2"/>
                                Delete Content
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">System Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Check application usage and performance.</p>
                        <Button variant="outline">View Analytics</Button>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
