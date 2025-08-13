# 🖼️ Adding Images to AI Loading Modals

## Current Status
✅ **Working now**: Emojis (🤖, 💬, 🧠, etc.) - no setup needed!
🔄 **Optional upgrade**: Add actual images for more professional look

## Option 1: Add Images to Public Folder (Recommended)

### 1. Create the folder structure:
```
/public/ai-history/
├── shakey-robot.png
├── eliza-chatbot.png  
├── turing-test.png
├── perceptron.png
├── deep-blue.png
├── dartmouth-conference.png
├── backpropagation.png
├── gpt-1.png
├── alphago.png
└── transformer.png
```

### 2. Update the snippets in `/src/components/ui/ai-loading-modal.tsx`:
```tsx
{
  id: "shakey",
  title: "SHAKEY THE ROBOT", 
  description: "...",
  year: "1960s",
  image: "/ai-history/shakey-robot.png",  // ← Change this
  imageType: 'file',                       // ← Change this
  color: "bg-blue-600"
}
```

## Option 2: Use External URLs
```tsx
{
  id: "shakey",
  image: "https://your-cdn.com/shakey-robot.png",
  imageType: 'file',
  // ...
}
```

## Image Recommendations

### Size & Format:
- **Size**: 200x200px to 400x400px (square works best)
- **Format**: PNG with transparent background preferred
- **Style**: Simple illustrations or historical photos
- **File size**: Keep under 100KB each for fast loading

### Where to Find Images:
- **Wikipedia Commons** (free historical photos)
- **AI company websites** (press kits)
- **Create custom illustrations** (Figma, Canva)
- **AI-generated images** (Midjourney, DALL-E)

## Example Update
```tsx
// Before (emoji)
{
  id: "shakey",
  image: "🤖",
  imageType: 'emoji',
}

// After (image file)  
{
  id: "shakey",
  image: "/ai-history/shakey-robot.png",
  imageType: 'file',
}
```

## Testing
1. Add one image to `/public/ai-history/`
2. Update one snippet to use `imageType: 'file'`
3. Test loading modal appears correctly
4. Gradually replace other emojis

The system is designed to work with both - you can mix emojis and images!
