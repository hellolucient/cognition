"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X } from "lucide-react";

interface InlineCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  selectedSource: string;
  onSubmit: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function InlineCommentModal({
  isOpen,
  onClose,
  selectedText,
  selectedSource,
  onSubmit,
  isSubmitting = false
}: InlineCommentModalProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      await onSubmit(content.trim());
      setContent("");
      onClose();
    } catch (error) {
      console.error('Error submitting inline comment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Add Inline Comment
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected text display */}
        <div className="bg-gray-100 p-3 rounded border border-gray-200 mb-4">
          <div className="text-xs text-gray-600 mb-1 font-medium">
            {selectedSource}:
          </div>
          <div className="text-sm text-gray-900 bg-white p-2 rounded border break-words leading-relaxed">
            "{selectedText}"
          </div>
        </div>

        {/* Comment input */}
        <div className="flex-1 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Comment
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your thoughts about this text..."
            className="min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
