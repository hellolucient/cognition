# Inline Comments Feature

## Overview

The inline comments feature allows users to highlight specific text in threads and add contextual comments that appear inline with the content. Comments are collapsible/expandable and include inline voting functionality.

## Key Features

### 1. Text Selection & Comment Creation
- Users can highlight any text in a thread (minimum 10 characters)
- A modal appears allowing them to add a comment about the selected text
- Comments are stored with the exact text position (start/end index)

### 2. Collapsible Comments
- **Default State**: Comments are collapsed by default
- **Author Exception**: New comments are expanded for the author who posted them
- **Toggle Control**: Users can click chevron icons to expand/collapse comments
- **Visual Indicators**: Clear icons show collapse/expand state

### 3. Inline Voting
- **Thumb Up/Down**: Appears at the end of each comment
- **Real-time Updates**: Vote counts update immediately
- **User State**: Shows current user's vote (like/dislike/none)
- **Toggle Behavior**: Clicking same vote removes it, clicking different vote changes it

### 4. Comment Display
- **Author Information**: Shows user avatar, name, and timestamp
- **Content**: Comment text with proper formatting
- **Vote Counts**: Total likes and dislikes for each comment
- **Responsive Design**: Works on all screen sizes

### 5. Statistics Dashboard
- **Total Comments**: Count of all inline comments
- **Total Votes**: Aggregate like/dislike counts
- **Expanded State**: Number of currently expanded comments

## Technical Implementation

### Database Schema

#### InlineComment Table
```sql
CREATE TABLE "InlineComment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "referencedText" TEXT NOT NULL,
    "textStartIndex" INTEGER NOT NULL,
    "textEndIndex" INTEGER NOT NULL,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT true
);
```

#### TextSegmentVote Table
```sql
CREATE TABLE "TextSegmentVote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "inlineCommentId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL
);
```

### API Endpoints

#### Create Inline Comment
```
POST /api/inline-comments
Body: {
  threadId: string,
  content: string,
  referencedText: string,
  textStartIndex: number,
  textEndIndex: number
}
```

#### Get Inline Comments
```
GET /api/inline-comments?threadId={threadId}
```

#### Vote on Comment
```
POST /api/inline-comments/{id}/vote
Body: { voteType: 'like' | 'dislike' }
```

#### Toggle Comment Collapse
```
POST /api/inline-comments/{id}/toggle
```

### Components

#### InlineComment
- Displays individual comment with collapse/expand functionality
- Shows author info, content, and voting controls
- Handles vote interactions and state updates

#### InlineCommentModal
- Modal for creating new inline comments
- Shows selected text and comment input
- Handles form submission and validation

### Integration Points

#### Thread Display
- Comments are inserted after the content they reference
- Uses `insertInlineComments()` function to merge content and comments
- Maintains proper spacing and visual hierarchy

#### Text Selection
- Replaces the old reference modal with inline comment modal
- Maintains existing text selection logic
- Adds comment creation workflow

## User Experience Flow

1. **Text Selection**: User highlights text in a thread
2. **Modal Display**: Inline comment modal appears with selected text
3. **Comment Creation**: User writes and submits their comment
4. **Inline Display**: Comment appears below the referenced content
5. **Interaction**: Users can vote, expand/collapse, and engage with comments
6. **Statistics**: Overall comment and vote counts displayed at bottom

## Benefits

### For Users
- **Contextual Discussion**: Comments appear where they're most relevant
- **Reduced Clutter**: Collapsible design keeps threads readable
- **Engagement**: Inline voting encourages participation
- **Discovery**: Easy to find discussions about specific content

### For Platform
- **Increased Engagement**: More granular interaction points
- **Better Content Quality**: Contextual feedback improves discussions
- **User Retention**: Interactive features keep users engaged
- **Data Insights**: Rich interaction data for analytics

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic inline commenting
- ✅ Collapse/expand functionality
- ✅ Inline voting system
- ✅ Statistics dashboard

### Phase 2 (Planned)
- **Real-time Updates**: Live comment updates across users
- **Rich Text**: Markdown support in comments
- **Threading**: Reply-to-comment functionality
- **Moderation**: Comment moderation tools

### Phase 3 (Future)
- **AI Integration**: Smart comment suggestions
- **Analytics**: Comment engagement metrics
- **Export**: Include comments in thread exports
- **Mobile Optimization**: Enhanced mobile experience

## Testing

### Test Page
Visit `/test-inline-comments` to see a demonstration of all features:
- Sample comments with different states
- Interactive collapse/expand functionality
- Voting system demonstration
- Modal interaction testing

### Manual Testing
1. Navigate to any thread
2. Select text (10+ characters)
3. Add inline comment
4. Test collapse/expand
5. Test voting functionality
6. Verify statistics display

## Configuration

### Environment Variables
No additional environment variables required beyond existing Supabase setup.

### Database Requirements
- PostgreSQL with Prisma ORM
- Proper indexes on `textStartIndex` and `textEndIndex`
- Foreign key constraints for data integrity

### Performance Considerations
- Comments are loaded with thread content
- Vote counts are calculated on-demand
- Collapse state is managed client-side
- Minimal database queries per page load

## Troubleshooting

### Common Issues

#### Comments Not Appearing
- Check database connection
- Verify API endpoints are accessible
- Check browser console for errors

#### Voting Not Working
- Ensure user is authenticated
- Check API authorization headers
- Verify vote type is 'like' or 'dislike'

#### Collapse State Not Persisting
- Check database update queries
- Verify client-side state management
- Check for JavaScript errors

### Debug Information
- Browser console shows detailed logs
- API responses include error details
- Database queries are logged server-side

## Conclusion

The inline comments feature significantly enhances the platform's collaborative capabilities by allowing users to engage with specific content segments. The collapsible design and inline voting create an intuitive and engaging user experience while maintaining thread readability.

This feature represents a major step forward in making AI conversations more interactive and collaborative, enabling users to build upon each other's insights in a contextual and organized manner.
