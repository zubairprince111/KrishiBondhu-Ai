'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FilePen, Upload, Users, BarChart, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { type ImagePlaceholder } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useSlideshow } from '@/context/slideshow-context';

export default function AdminPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { slideshowImages, addImage, removeImage } = useSlideshow();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Simulate upload
      const newImage: ImagePlaceholder = {
        id: `slideshow-${Date.now()}`,
        description: selectedFile.name,
        imageUrl: URL.createObjectURL(selectedFile),
        imageHint: 'new custom',
      };
      addImage(newImage);
      toast({
        title: 'Upload Successful',
        description: `File "${selectedFile.name}" has been added to the slideshow preview.`,
      });
      setSelectedFile(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a file to upload.',
      });
    }
  };
  
  const handleRemoveImage = (id: string) => {
    removeImage(id);
    toast({
        title: 'Image Removed',
        description: 'The image has been removed from the slideshow.',
    });
  };

  return (
    <SidebarInset>
      <AppHeader title="Admin Panel" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Administrator Controls</CardTitle>
                    <CardDescription>Manage application settings, users, and content from here.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">User Management</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,204</div>
                            <p className="text-xs text-muted-foreground">Total registered users</p>
                        </CardContent>
                        <CardFooter>
                             <Button size="sm">View Users</Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">System Analytics</CardTitle>
                            <BarChart className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">+23%</div>
                            <p className="text-xs text-muted-foreground">Monthly user growth</p>
                        </CardContent>
                        <CardFooter>
                            <Button size="sm" variant="outline">View Analytics</Button>
                        </CardFooter>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Content Management</CardTitle>
                    <CardDescription>Manage the dynamic content displayed throughout the application.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 md:grid-cols-2">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">Slideshow Images</CardTitle>
                            <CardDescription>Add or remove images from the dashboard slideshow.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="picture">Add New Image</Label>
                                <div className="flex w-full max-w-sm items-center space-x-2">
                                    <Input id="picture" type="file" onChange={handleFileChange} accept="image/*"/>
                                    <Button size="sm" onClick={handleUpload}><Upload className="mr-2"/>Upload</Button>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">Current Images: {slideshowImages.length}</p>
                        </CardContent>
                        <CardFooter>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary">Manage Slideshow</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[625px]">
                                    <DialogHeader>
                                        <DialogTitle>Manage Slideshow Images</DialogTitle>
                                        <DialogDescription>
                                            Review and remove images from the main dashboard slideshow.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                                        {slideshowImages.map(image => (
                                            <div key={image.id} className="relative group">
                                                <Image
                                                    src={image.imageUrl}
                                                    alt={image.description}
                                                    width={300}
                                                    height={200}
                                                    className="rounded-md object-cover aspect-[3/2]"
                                                />
                                                 <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(image.id)}>
                                                    <X className="size-4"/>
                                                    <span className="sr-only">Remove Image</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">Close</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                     <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">Editable Text</CardTitle>
                            <CardDescription>Update text content like feature descriptions or names.</CardDescription>
                        </CardHeader>
                         <CardContent className="flex-1 space-y-4">
                             <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="text-key">Content Key</Label>
                                <Input id="text-key" placeholder="e.g., feature.crop_doctor.description" />
                             </div>
                              <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="text-value">New Text</Label>
                                <Input id="text-value" placeholder="Enter new text here" />
                             </div>
                        </CardContent>
                        <CardFooter className="space-x-2">
                            <Button variant="secondary"><FilePen className="mr-2"/>Update Text</Button>
                            <Button variant="ghost">Load Content</Button>
                        </CardFooter>
                    </Card>
                </CardContent>
            </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
