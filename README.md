# 🧠 Vanwinkle

> **A collaborative platform for sharing, building upon, and evolving AI conversations**

Vanwinkle transforms private AI chats into a living, collaborative knowledge base where users can share their conversations with AI assistants, contribute new insights, and collectively build upon each other's discoveries.

## 🎯 Vision

Instead of AI conversations disappearing into private chat histories, Vanwinkle creates a **social layer for AI interaction** where:

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

## 🔖 **ChatGPT Bookmarklet Magic**

Our intelligent bookmarklet makes sharing ChatGPT conversations effortless:

### 🎯 **Perfect for Mac ChatGPT App Users:**
1. **Create conversation** in ChatGPT Mac app
2. **Click "Share"** → Copy the share URL  
3. **Open URL in browser** → Click our bookmarklet
4. **BOOM!** → Vanwinkle opens with your full conversation ready to submit

### 🌐 **Works with Any ChatGPT Page:**
- ✅ **Regular chat.openai.com conversations**
- ✅ **ChatGPT share URLs** (chatgpt.com/share/...)
- ✅ **Mac app share links** (via browser)
- ✅ **Automatic content extraction** using proven selectors
- ✅ **Beautiful formatting** with `🧑 You:` and `🤖 ChatGPT:` labels

### 🔧 **How It Works:**
- **Smart extraction** finds conversation messages regardless of ChatGPT's UI changes
- **Clipboard integration** copies formatted content automatically  
- **Auto-opens Vanwinkle** submit page for seamless workflow
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

### User Experience
- ✅ **Invite-Only System** - Controlled growth with invite codes
- ✅ **Email & GitHub Auth** - Multiple authentication options via Supabase
- ✅ **Waitlist Management** - Queue system for new users
- ✅ **Anonymous Reading** - Browse without an account
- ✅ **Responsive Design** - Works on all devices
- ✅ **Chat-like Formatting** - Familiar conversation display with Human/AI blocks
- ✅ **Smart Navigation** - Auto-scroll to new contributions
- ✅ **User Settings** - Manage API keys and invite codes

### Technical Features
- ✅ **Next.js 15** with App Router and React 18
- ✅ **PostgreSQL** database via Supabase with RLS
- ✅ **Prisma ORM** for type-safe database operations
- ✅ **Tailwind CSS** + shadcn/ui components
- ✅ **Multi-AI Provider Support** - OpenAI, Anthropic, Google AI
- ✅ **Secure API Key Storage** - Encrypted user keys with AES-256-CBC
- ✅ **Admin Panel** - Platform management and AI provider configuration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- At least one AI API key (OpenAI, Anthropic, or Google AI)
- GitHub OAuth app (for authentication)
- Email service setup in Supabase (for email auth)

### ⚠️ Regional Considerations

**Database Location & Performance:**
- The current setup uses Supabase hosted in **Singapore (AWS ap-southeast-1)**
- **Local users (Asia-Pacific)**: Optimal performance with low latency
- **International users (USA, Europe)**: May experience slower load times (~200-300ms latency)
- **During travel**: Temporary connectivity issues may occur due to changing networks

**Known Issues & Solutions:**
- **Intermittent connectivity**: Restart your Supabase instance if you experience 500 errors while traveling
- **Regional latency**: For production deployment with global users, consider multi-region database setup
- **Network sensitivity**: Hotel/airport WiFi may cause temporary connection issues

**For Production Scaling:**
- Consider Supabase read replicas in user regions (USA, Europe)
- Implement connection retry logic for mobile/unstable connections
- Monitor user feedback for regional performance issues

### Environment Setup

Create a `.env` file with:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

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
- **Users** - Authentication, profile data, encrypted API keys, invite system
- **Threads** - Original AI conversations and contributions with titles
- **Comments** - Community discussion (coming soon)
- **Upvotes** - Community curation (coming soon)
- **InviteCode** - Invite code management and tracking
- **WaitlistEntry** - User waitlist for controlled growth

### API Routes
- `/api/threads` - CRUD operations for conversations
- `/api/contribute` - Add AI or manual contributions using user's stored API keys
- `/api/generate-summary` - AI-powered conversation summaries and titles
- `/api/user/api-key` - Secure API key management (encrypted storage)
- `/api/invite/*` - Invite code validation and generation
- `/api/waitlist` - Waitlist management
- `/api/admin/*` - Admin panel endpoints for platform management

### Key Components
- **Thread Feed** - Main discovery interface with tag filtering
- **Contribution System** - Collaborative conversation building with AI/manual options
- **Quote/Reference** - Targeted response to specific text with modal interface
- **Export System** - Download enhanced conversations in multiple formats
- **User Settings** - API key management and invite code generation
- **Admin Panel** - Platform AI provider configuration and management
- **Invite System** - Controlled user onboarding with waitlist

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

### Phase 2: Community Features 🚧
- [ ] Comments and upvoting system
- [ ] User profiles and reputation scoring
- [ ] Advanced moderation tools
- [ ] Community guidelines and reporting

### Phase 3: Advanced Features 🔮
- [ ] Real-time collaboration on threads
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

- **Live Platform**: [Coming Soon]
- **Documentation**: [Wiki](https://github.com/hellolucient/cognition/wiki)
- **Issues**: [GitHub Issues](https://github.com/hellolucient/cognition/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hellolucient/cognition/discussions)

---

**Built with ❤️ for the AI community**

*Transforming private AI conversations into collective intelligence*