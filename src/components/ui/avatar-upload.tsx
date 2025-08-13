"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userId: string;
  onAvatarUpdate: (avatarUrl: string | null) => void;
}

export function AvatarUpload({ currentAvatar, userId, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onAvatarUpdate(data.user.avatarUrl);
        setPreview(null);
      } else {
        alert(data.error || 'Failed to upload avatar');
        setPreview(null);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        onAvatarUpdate(null);
      } else {
        alert(data.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      alert('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const avatarSrc = preview || currentAvatar;

  return (
    <Card className="w-fit">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Avatar Display */}
          <div className="flex justify-center">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-border"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                <span className="text-4xl text-muted-foreground">?</span>
              </div>
            )}
          </div>

          {/* Upload Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Recommended: Square image, at least 200x200px</p>
            <p>Formats: JPEG, PNG, WebP (max 5MB)</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : currentAvatar ? 'Change Avatar' : 'Upload Avatar'}
            </Button>
            
            {currentAvatar && (
              <Button
                variant="outline"
                onClick={removeAvatar}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
