# 🧠 vanwinkle

> **A collaborative platform for sharing, building upon, and evolving AI conversations**

vanwinkle transforms private AI chats into a living, collaborative knowledge base where users can share their conversations with AI assistants, contribute new insights, and collectively build upon each other's discoveries.

## 🎯 Vision

Instead of AI conversations disappearing into private chat histories, vanwinkle creates a **social layer for AI interaction** where:

- **Knowledge compounds** through community contributions
- **Conversations evolve** beyond their original scope  
- **Insights are preserved** and made discoverable
- **Collective intelligence** emerges from individual AI interactions

## ✨ How It Works

### 🚀 **One-Click ChatGPT Integration**
1. **Drag our bookmarklet** to your browser's bookmark bar
2. **Go to any ChatGPT conversation** (web or Mac app share links)
3. **Click the bookmarklet** → Automatically extracts & copies your conversation
4. **Cognition opens** with your chat ready to submit - just click "Paste from Clipboard"!

### 📝 **Traditional Sharing (Any AI)**
1. **Manually paste any AI chat** (ChatGPT, Claude, etc.) into our submission form
2. **AI automatically generates** an engaging summary using our platform's API
3. **Add tags and source labels** for discoverability
4. **Publish to the community** for others to discover

### 🔍 **Discover & Explore**
- **Browse the feed** of community-shared conversations
- **Filter by tags, AI models,** or topics that interest you
- **Read full conversations** with chat-like formatting
- **Find insights** from diverse AI interactions across the community

### 🤝 **Contribute & Collaborate**
- **Select any text** from a conversation to reply to specific points
- **Continue with AI** using your own API key for targeted responses
- **Add manual insights** with your own analysis or follow-up questions
- **Build conversation chains** that evolve ideas beyond the original scope

### 📤 **Export & Reuse**
- **Export complete conversations** including all contributions
- **Take enhanced discussions** to your private AI sessions
- **Build upon community insights** in your own projects

## 🧠 **AI History Loading Experience**

Transform boring loading screens into educational moments with our AI history modal system:

### 📚 **30+ Educational Snippets**
- **Historical Milestones**: From Turing machines (1936) to ChatGPT phenomenon (2022)
- **Key Innovations**: Neural networks, expert systems, backpropagation, transformers
- **Fascinating Facts**: AI Winter, Deep Blue vs Kasparov, AlphaGo, protein folding breakthroughs
- **Modern Developments**: GANs, reinforcement learning, multimodal AI, ethics emergence

### ⚡ **Smart Display Logic**
- **1.5s delay**: Prevents flashing on quick loads
- **Persistent display**: Stays visible until user closes (doesn't auto-hide)
- **User control**: "Don't show again" option with settings page toggle
- **Random selection**: Different snippet each time for continuous learning

### 🎯 **Triggers During**:
- Page loading (homepage, threads, profiles)
- Contribution submission and AI processing
- Bookmarklet authentication checks
- Summary generation and posting

## 🔖 **ChatGPT Bookmarklet Magic**

Our intelligent bookmarklet makes sharing ChatGPT conversations effortless:

### 🎯 **Perfect for Mac ChatGPT App Users:**
1. **Create conversation** in ChatGPT Mac app
2. **Click "Share"** → Copy the share URL  
3. **Open URL in browser** → Click our bookmarklet
4. **BOOM!** → vanwinkle opens with your full conversation ready to submit

### 🌐 **Works with Any ChatGPT Page:**
- ✅ **Regular chat.openai.com conversations**
- ✅ **ChatGPT share URLs** (chatgpt.com/share/...)
- ✅ **Mac app share links** (via browser)
- ✅ **Automatic content extraction** using proven selectors
- ✅ **Beautiful formatting** with `🧑 You:` and `🤖 ChatGPT:` labels

### 🔧 **How It Works:**
- **Smart extraction** finds conversation messages regardless of ChatGPT's UI changes
- **Clipboard integration** copies formatted content automatically  
- **Auto-opens vanwinkle** submit page for seamless workflow
- **Graceful fallbacks** download file if clipboard fails
- **Cross-browser compatible** works in Chrome, Safari, Firefox, etc.

## 🛠 Features

### Core Functionality
- ✅ **Smart ChatGPT Bookmarklet** - One-click extraction from any ChatGPT conversation (including Mac app share links)
- ✅ **Thread Feed** - Browse and discover AI conversations with filtering
- ✅ **Smart Summaries & Titles** - AI-generated previews with configurable providers
- ✅ **Contribution System** - Extend conversations with AI or manual input
- ✅ **Quote & Reference** - Reply to specific parts of conversations with modal UI
- ✅ **Tag-based Discovery** - Filter and organize by topics
- ✅ **Source Attribution** - Track which AI model was used
- ✅ **Export System** - Download conversations in multiple formats (TXT, MD, JSON)
- ✅ **Upvoting & Downvoting** - Community curation with vote counts and user preferences
- ✅ **Social Sharing** - Share threads to X/Twitter and copy links

### Social Features
- ✅ **User Profiles** - Customizable profiles with avatar, bio, website, and location
- ✅ **Follow System** - Follow users to see their latest contributions
- ✅ **In-App Notifications** - Get notified when followed users post or follow you
- ✅ **Following Feed** - Filter main feed to show only posts from followed users
- ✅ **Profile Pages** - View user profiles with follower/following counts and recent threads
- ✅ **Avatar Upload** - Upload and manage profile pictures
- ✅ **Social Discovery** - Find interesting users through their contributions

### User Experience
- ✅ **Invite-Only System** - Controlled growth with invite codes
- ✅ **Email & GitHub Auth** - Multiple authentication options via Supabase
- ✅ **Waitlist Management** - Queue system for new users
- ✅ **Anonymous Reading** - Browse without an account
- ✅ **Responsive Design** - Works on all devices
- ✅ **Chat-like Formatting** - Familiar conversation display with Human/AI blocks
- ✅ **Smart Navigation** - Auto-scroll to new contributions showing full posts
- ✅ **User Settings** - Manage API keys, invite codes, and preferences
- ✅ **AI History Modals** - Educational AI facts during loading screens (30+ snippets)
- ✅ **Loading Experience** - Turn delays into learning moments with AI history

### Technical Features
- ✅ **Next.js 15** with App Router and React 18
- ✅ **PostgreSQL** database via Supabase with RLS and connection pooling
- ✅ **Prisma ORM** with singleton client pattern for serverless compatibility
- ✅ **Production-Ready Deployment** on Vercel with optimized database connections
- ✅ **Tailwind CSS** + shadcn/ui components
- ✅ **Multi-AI Provider Support** - OpenAI, Anthropic, Google AI
- ✅ **Secure API Key Storage** - Encrypted user keys with AES-256-CBC
- ✅ **Admin Panel** - Platform management and AI provider configuration
- ✅ **Regional Resilience** - Handles connectivity variations across global users

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- At least one AI API key (OpenAI, Anthropic, or Google AI)
- GitHub OAuth app (for authentication)
- Email service setup in Supabase (for email auth)

### ⚠️ Production Deployment & Database Configuration

**Database Connection Setup:**
- Uses **Supabase PostgreSQL** with connection pooling for optimal performance
- **Prisma ORM** configured with singleton client pattern to prevent connection conflicts
- **Transaction mode** enabled for serverless compatibility

**Critical Production Settings:**
- **DATABASE_URL** must include `?pgbouncer=true&connection_limit=1` for Vercel deployment
- **Shared Prisma Client** prevents "prepared statement already exists" errors in serverless
- **Connection resilience** configured for regional connectivity variations

**Regional Considerations:**
- Current setup uses Supabase hosted in **Singapore (AWS ap-southeast-1)**
- **Asia-Pacific users**: Optimal performance with low latency
- **International users**: May experience ~200-300ms latency but stable connectivity
- **Production-tested** across multiple regions with robust error handling

**Troubleshooting Production Issues:**
- **500 errors on API endpoints**: Usually resolved by database restart + proper connection string format
- **Prepared statement conflicts**: Fixed by singleton Prisma client and transaction mode
- **Authentication failures**: Ensure Supabase RLS policies are properly configured
- **Regional connectivity**: Connection pooling and retry logic handle temporary network issues

**For Production Scaling:**
- Consider Supabase read replicas for global distribution
- Monitor connection pool usage in Vercel analytics
- Implement health checks for database connectivity

### Environment Setup

Create a `.env` file with:

```bash
# Database (Critical: Include pgbouncer parameters for production)
DATABASE_URL="postgresql://user:password@host:port/db?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:port/db?sslmode=require"

# Database connection settings for better regional connectivity
DATABASE_CONNECTION_LIMIT=5
DATABASE_POOL_TIMEOUT=10
DATABASE_CONNECT_TIMEOUT=60

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# AI APIs (Platform-level for summaries/titles)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AI..."
PLATFORM_AI_PROVIDER="openai"  # or "anthropic" or "google"
SUMMARY_MODEL="gpt-4o-mini"

# Security
API_KEY_ENCRYPTION_KEY="your-32-character-encryption-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## 🔒 User API Keys: Security Overview

- **Encryption at rest**: User-supplied provider keys are encrypted using `AES-256-CBC` with a fresh per-record IV. The 32-byte cipher key is derived from `API_KEY_ENCRYPTION_KEY` via `scrypt`.
- **Server-only decryption**: Keys are decrypted in memory on the server only when needed to call provider APIs; plaintext is never persisted or logged.
- **AuthN/Z**: Management routes require an authenticated Supabase session; users can only manage their own keys.
- **Validation & hygiene**: Keys are cleaned (whitespace/invisible chars removed) and validated per provider format before storage.
- **Fields**: Encrypted keys are stored on `User` as `encryptedOpenAIKey`, `encryptedAnthropicKey`, `encryptedGoogleKey`.

See `docs/api-keys-security.md` for hardening recommendations (rotation, audit logs, rate limiting, log redaction) and implementation checklist.

### Installation

```bash
# Clone the repository
git clone https://github.com/hellolucient/cognition.git
cd cognition

# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the platform.

### First-Time Setup

1. **Admin Setup**: Update the admin email in the admin routes (`src/app/api/admin/*/route.ts`) to your email
2. **Generate Invite Codes**: Use the admin panel at `/admin` to manage platform AI settings
3. **Create Initial Users**: Generate invite codes for initial community members
4. **Configure AI Provider**: Choose your preferred AI provider (OpenAI, Anthropic, or Google) in the admin panel

## 🏗 Architecture

### Database Schema
- **Users** - Authentication, profile data, encrypted API keys, invite system, bio, website, location
- **Threads** - Original AI conversations and contributions with titles
- **Follow** - User following relationships for social features
- **Notification** - In-app notifications for follows and new posts
- **Upvotes & Downvotes** - Community curation and engagement tracking
- **InviteCode** - Invite code management and tracking
- **WaitlistEntry** - User waitlist for controlled growth
- **PendingShare** - Save-for-later functionality for mobile users

### API Routes
- `/api/threads` - CRUD operations for conversations with following filter
- `/api/contribute` - Add AI or manual contributions using user's stored API keys
- `/api/generate-summary` - AI-powered conversation summaries and titles
- `/api/user/api-key` - Secure API key management (encrypted storage)
- `/api/users/[id]/*` - User profiles, follow/unfollow, avatar upload, following/followers lists
- `/api/notifications` - In-app notification management (fetch, mark as read)
- `/api/invite/*` - Invite code validation and generation
- `/api/waitlist` - Waitlist management
- `/api/admin/*` - Admin panel endpoints for platform management

### Key Components
- **Thread Feed** - Main discovery interface with tag filtering and following feed
- **Contribution System** - Collaborative conversation building with AI/manual options (not traditional comments)
- **Quote/Reference** - Targeted response to specific text with modal interface (5+ character minimum)
- **Voting System** - Upvote/downvote functionality with community curation
- **Export System** - Download enhanced conversations in multiple formats
- **User Profiles** - Customizable profiles with avatar, bio, social links, and activity
- **Follow System** - Social connections with notifications and activity feeds
- **Notification Bell** - In-app notifications for social interactions
- **AI Loading Modals** - Educational AI history during loading states (30+ facts)
- **Social Sharing** - Share threads to X/Twitter with proper domain URLs
- **User Settings** - API key management, invite codes, and AI modal preferences
- **Admin Panel** - Platform AI provider configuration and management
- **Invite System** - Controlled user onboarding with waitlist
- **Save for Later** - Mobile-friendly link saving for ChatGPT share URLs

## 🎨 Design Philosophy

### Community-First
Every feature is designed to foster **meaningful collaboration** and **knowledge sharing** rather than just consumption.

### AI-Enhanced
The platform uses AI not just as content, but as a **collaborative tool** to help users contribute more effectively.

### Privacy-Conscious  
Users control what they share, and **anonymous browsing** is always available for discovery.

### Quality-Focused
Features like **invite-only signup** and **waitlist management** ensure the community maintains high engagement and quality.

## 🛣 Roadmap

### Phase 1: Core Platform ✅
- [x] Thread submission and display with AI-generated titles
- [x] AI summary generation with multi-provider support
- [x] Advanced contribution system (AI + manual)
- [x] Quote/reference functionality with modal interface
- [x] Export system (TXT, MD, JSON formats)
- [x] Invite-only signup system with waitlist
- [x] Email & GitHub authentication
- [x] User settings and API key management
- [x] Admin panel for platform management

### Phase 2: Social Features ✅
- [x] User profiles with avatars, bios, and social links
- [x] Follow/unfollow system with notifications
- [x] In-app notification system
- [x] Following feed filtering
- [x] Social sharing (X/Twitter, copy link)
- [x] Profile pages with follower/following lists
- [x] AI loading modals with educational content (30+ snippets)
- [x] Upvoting and downvoting system for community curation
- [x] Advanced contribution system (AI + manual insights)
- [ ] Advanced moderation tools
- [ ] Community guidelines and reporting

### Phase 3: Advanced Features 🔮
- [ ] Real-time collaborative editing on threads (live multi-user contributions)
- [ ] Advanced search and discovery
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] AI-powered content recommendations
- [ ] Thread branching and merging

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Submit PRs with clear descriptions

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Live Platform**: [https://www.vanwinkleapp.com](https://www.vanwinkleapp.com) ✅ **Production Ready**
- **Documentation**: [Wiki](https://github.com/hellolucient/cognition/wiki)
- **Issues**: [GitHub Issues](https://github.com/hellolucient/cognition/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hellolucient/cognition/discussions)

---

**Built with ❤️ for the AI community**

*Transforming private AI conversations into collective intelligence*