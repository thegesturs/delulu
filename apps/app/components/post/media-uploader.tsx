'use client';

import { useCallback } from 'react';
import { IoMdClose } from 'react-icons/io';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card } from '@delulu/design-system/components/ui/card';
import { Input } from '@delulu/design-system/components/ui/input';
import type { MediaType, SocialType } from '@delulu/validators/post';

interface MediaUploaderProps {
  media: MediaType[];
  onChange: (media: MediaType[]) => void;
  socialType?: SocialType;
}

export function MediaUploader({
  media,
  onChange,
  socialType,
}: MediaUploaderProps) {
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newMedia: MediaType[] = files.map((file) => ({
        file,
        mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
        previewUrl: URL.createObjectURL(file),
      }));

      onChange([...media, ...newMedia]);
    },
    [media, onChange]
  );

  const handleRemoveMedia = useCallback(
    (index: number) => {
      const newMedia = [...media];
      newMedia.splice(index, 1);
      onChange(newMedia);
    },
    [media, onChange]
  );

  const maxFiles =
    socialType === 'TWITTER' || socialType === 'LINKEDIN' ? 4 : 10;

  return (
    <div>
      {media.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {media.map((item, index) => (
            <Card key={index} className="relative overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => handleRemoveMedia(index)}
              >
                <IoMdClose />
              </Button>
              {item.mediaType === 'IMAGE' && (
                <img
                  src={item.previewUrl || item.url}
                  alt=""
                  className="aspect-square h-full w-full object-cover"
                />
              )}
              {item.mediaType === 'VIDEO' && (
                <video
                  src={item.previewUrl || item.url}
                  className="aspect-square h-full w-full object-cover"
                  controls
                >
                  <track kind="captions" />
                </video>
              )}
            </Card>
          ))}
        </div>
      )}

      {media.length < maxFiles && (
        <Input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          multiple={true}
          className="cursor-pointer"
        />
      )}
    </div>
  );
}
