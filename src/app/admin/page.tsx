import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

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
                        <CardTitle className="text-lg">Content Moderation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Review and moderate community posts.</p>
                        <Button variant="secondary">Moderate Content</Button>
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
