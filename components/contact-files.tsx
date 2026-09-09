'use client';

import { FileTextIcon, TrashIcon, UploadCloudIcon } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { deleteContactFileAction, uploadContactFileAction } from '@/lib/actions/contacts';
import type { ContactFile } from '@/lib/types';

export function ContactFiles({ contactId, files }: { contactId: string; files: ContactFile[] }) {
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function uploadFile(file: File) {
    const formData = new FormData();
    formData.set('file', file, file.name || 'pasted-image.png');
    startUpload(async () => {
      const result = await uploadContactFileAction(contactId, {}, formData);
      if (result.success) {
        toast.success('File uploaded');
      } else {
        toast.error(result.error ?? 'Failed to upload file');
      }
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  const uploadFileRef = useRef(uploadFile);

  useEffect(() => {
    uploadFileRef.current = uploadFile;
  });

  useEffect(() => {
    function handleDocumentPaste(e: ClipboardEvent) {
      const item = e.clipboardData ? [...e.clipboardData.items].find((i) => i.kind === 'file') : undefined;
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        uploadFileRef.current(file);
      }
    }

    document.addEventListener('paste', handleDocumentPaste);
    return () => document.removeEventListener('paste', handleDocumentPaste);
  }, []);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    e.target.value = '';
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    try {
      await deleteContactFileAction(contactId, fileId);
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  }

  const images = files.filter((f) => f.contentType?.startsWith('image/'));
  const otherFiles = files.filter((f) => !f.contentType?.startsWith('image/'));

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-none border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring/50',
          dragActive ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        <UploadCloudIcon className="size-6" />
        <span>{uploading ? 'Uploading…' : 'Drag & drop, paste, or click to upload an image or PDF'}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {images.length > 0 ? (
        <Carousel className="w-full max-w-sm">
          <CarouselContent>
            {images.map((file) => (
              <CarouselItem key={file._id}>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt={file.filename} className="aspect-square w-full rounded-none object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    disabled={deletingId === file._id}
                    onClick={() => handleDelete(file._id)}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 ? (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          ) : null}
        </Carousel>
      ) : null}

      {otherFiles.length > 0 ? (
        <div className="flex flex-col gap-2">
          {otherFiles.map((file) => (
            <div
              key={file._id}
              className="flex items-center justify-between gap-2 rounded-none bg-muted/30 p-2 text-sm ring-1 ring-foreground/10"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <FileTextIcon className="size-4" />
                {file.filename}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={deletingId === file._id}
                onClick={() => handleDelete(file._id)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {files.length === 0 ? <p className="text-sm text-muted-foreground">No files uploaded yet.</p> : null}
    </div>
  );
}
