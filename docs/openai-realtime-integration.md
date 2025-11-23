# OpenAI Realtime API Integration

## Overview

PathFinder integrates OpenAI's Realtime API to provide real-time voice conversations with LISA, an AI career advisor. This integration uses WebRTC for low-latency bidirectional voice streaming and automatically saves conversation transcripts to Convex.

**Route:** `/voice-realtime` (authentication required)

## Architecture

### Tech Stack

- **Voice Engine:** OpenAI Realtime API (`gpt-4o-realtime-preview-2025-06-03`)
- **Transport:** WebRTC with OpenAIRealtimeWebRTC
- **Agent SDK:** `@openai/agents@^0.0.5`
- **Persistence:** Convex database
- **Authentication:** Clerk

### Data Flow

```
User → Browser (WebRTC) → OpenAI Realtime API → Agent (LISA) → Response
                                                                    ↓
                                              TranscriptContext (client state)
                                                                    ↓
                                              Convex (persistent storage)
```

## LISA Career Advisor Agent

### Agent Configuration

**Location:** `lib/agentConfigs/lisaCareerAdvisor/`

**Voice:** "sage"
**Model:** gpt-4o-realtime-preview-2025-06-03

### Discovery Framework

LISA guides users through structured career discovery across 6 topics:

1. **Goals & Aspirations** - What they want to achieve/become
2. **Interests & Passions** - Activities/topics that energize them
3. **Core Values** - What matters most (impact, autonomy, security, challenge)
4. **Hard Skills** - Technical abilities, certifications, experience
5. **Soft Skills** - Communication, leadership, problem-solving
6. **Work Style** - Preferences for collaboration, structure, pace

### Conversation Style

- **Tone:** Direct, warm, confident (coaching style)
- **Constraint:** ONE sentence per response max
- **Pattern:** [Acknowledge] + [Redirect/Challenge/Probe] + [Command/Question]

**Example responses:**
- "Got it—now what energizes you more: building or improving?"
- "Interesting, but let's focus on X first—tell me about Y."
- "So it's really about X, not Y—right?"

### Tools

#### generateCareerRecommendations

**Location:** `lib/agentConfigs/lisaCareerAdvisor/tools.ts`

**Purpose:** Generate career recommendations after complete discovery

**Current Status:** Placeholder - returns mock recommendations

**Future Integration:**
1. Extract discovery information from conversation history
2. Call 4 subagents (Goals/Values, Skills, Personality, Interests)
3. Run orchestrator to calculate dimension weights
4. Generate career matches with scores
5. Create personalized roadmap

## Components

### Main Application

**`app/voice-realtime/App.tsx`**
- Session management (connect/disconnect)
- Audio controls (mute, playback, recording)
- Push-to-talk mode
- Codec selection (Opus/PCMU/PCMA)
- Conversation auto-save on disconnect

### UI Components

**`components/realtime/Transcript.tsx`**
- Real-time conversation display
- User/assistant message bubbles
- Markdown rendering
- Copy transcript button
- Download audio button
- Text input for manual messages

**`components/realtime/Events.tsx`**
- Debug event log
- Client/server event differentiation
- Expandable event payloads
- Auto-scroll on new events

**`components/realtime/BottomToolbar.tsx`**
- Connection button (Connect/Disconnect)
- Push-to-talk checkbox + button
- Audio playback toggle
- Logs visibility toggle
- Codec selector dropdown

**`components/realtime/GuardrailChip.tsx`**
- Moderation status display (Pending/Pass/Fail)
- Expandable moderation details
- Category and rationale display

## State Management

### TranscriptContext

**Location:** `contexts/realtime/TranscriptContext.tsx`

**State:**
- `transcriptItems`: Array of messages and breadcrumbs
- `conversationId`: Unique UUID for session
- `sessionStartTime`: Timestamp for duration tracking

**Actions:**
- `addTranscriptMessage()`: Add user/assistant message
- `updateTranscriptMessage()`: Update message text (for streaming)
- `addTranscriptBreadcrumb()`: Add system event breadcrumb
- `toggleTranscriptItemExpand()`: Expand/collapse breadcrumb details
- `updateTranscriptItem()`: Update any transcript item property
- `startSession()`: Begin session timer
- `saveConversationToConvex()`: Persist conversation to database

**Conversation Format:**
```
User: [message text]
Assistant: [message text]
User: [message text]
...
```

### EventContext

**Location:** `contexts/realtime/EventContext.tsx`

**State:**
- `loggedEvents`: Array of client/server events for debugging

**Actions:**
- `logClientEvent()`: Log outgoing event
- `logServerEvent()`: Log incoming event
- `logHistoryItem()`: Log conversation history item
- `toggleExpand()`: Expand/collapse event details

## Hooks

### useRealtimeSession

**Location:** `hooks/realtime/useRealtimeSession.ts`

**Purpose:** Manage WebRTC session lifecycle and OpenAI SDK integration

**API:**
- `connect(options)`: Establish WebRTC connection
- `disconnect()`: Close connection
- `sendUserText(text)`: Send text message
- `sendEvent(event)`: Send raw event
- `mute(muted)`: Toggle audio mute
- `pushToTalkStart()`: Clear audio buffer (PTT)
- `pushToTalkStop()`: Commit audio buffer + trigger response
- `interrupt()`: Interrupt agent speech
- `status`: Connection status (DISCONNECTED/CONNECTING/CONNECTED)

### useHandleSessionHistory

**Location:** `hooks/realtime/useHandleSessionHistory.ts`

**Purpose:** Process conversation events and update transcript

**Handlers:**
- `handleAgentToolStart`: Log tool call started
- `handleAgentToolEnd`: Log tool call result
- `handleHistoryAdded`: Add message to transcript
- `handleHistoryUpdated`: Update existing message
- `handleTranscriptionDelta`: Append transcription chunk
- `handleTranscriptionCompleted`: Finalize transcription
- `handleGuardrailTripped`: Update message with moderation result

### useAudioDownload

**Location:** `hooks/realtime/useAudioDownload.ts`

**Purpose:** Record and download conversation audio

**API:**
- `startRecording(remoteStream)`: Begin recording
- `stopRecording()`: Stop recording
- `downloadRecording()`: Convert WebM → WAV and download

**Implementation:**
- Merges remote audio (assistant) + microphone (user)
- Records as WebM
- Converts to WAV on download
- Filename: `realtime_agents_audio_[ISO-timestamp].wav`

## API Routes

### POST /api/realtime/session

**Purpose:** Create OpenAI ephemeral session token

**Request:** None (GET)

**Response:**
```json
{
  "client_secret": {
    "value": "ek_..."
  }
}
```

**Implementation:**
```typescript
const response = await fetch(
  "https://api.openai.com/v1/realtime/sessions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2025-06-03",
    }),
  }
);
```

### POST /api/realtime/responses

**Purpose:** Proxy for OpenAI Responses API (used by guardrails)

**Request:**
```json
{
  "model": "gpt-4o-mini",
  "input": [...messages],
  "text": {
    "format": { ...zod schema }
  }
}
```

**Response:** OpenAI Responses API output

**Implementation:** Proxies to `openai.responses.parse()` or `openai.responses.create()`

## Guardrails

### Content Moderation

**Location:** `lib/agentConfigs/guardrails.ts`

**Categories:**
- `OFFENSIVE`: Hate speech, discriminatory language, insults, slurs, harassment
- `OFF_BRAND`: Disparaging competitor discussion
- `VIOLENCE`: Threats, incitement of harm, graphic violence
- `NONE`: Content is safe

**Implementation:**
- Calls `/api/realtime/responses` with moderation prompt
- Uses GPT-4o-mini for classification
- Returns category + rationale
- Displayed in GuardrailChip component

**Workflow:**
1. Agent generates response
2. Guardrail classifies content
3. If triggered (not NONE), corrective message sent to agent
4. Transcript updated with moderation status

## Convex Integration

### Schema

**Table:** `realtimeConversations`

```typescript
{
  userId: v.string(),                    // Clerk user ID
  conversationId: v.string(),            // Unique session ID (UUID)
  agentName: v.string(),                 // "lisa"
  fullTranscript: v.string(),            // Full conversation as text
  sessionDuration: v.optional(v.number()), // Duration in seconds
  messagesCount: v.number(),             // Number of messages
  createdAt: v.number(),                 // Timestamp
}
```

**Indexes:**
- `by_user`: userId
- `by_user_created`: userId + createdAt
- `by_conversation_id`: conversationId

### Mutations

**Location:** `convex/realtimeConversations.ts`

**saveConversation:**
```typescript
await saveConversationMutation({
  conversationId: "uuid",
  agentName: "lisa",
  fullTranscript: "User: ...\nAssistant: ...",
  sessionDuration: 300,
  messagesCount: 12,
});
```

**getConversationHistory:** Retrieve all user conversations
**getConversationById:** Retrieve specific conversation
**getRecentConversations:** Get last 10 conversations

### Auto-Save Behavior

Conversations saved when:
1. User clicks "Disconnect"
2. Component unmounts
3. Browser closes (cleanup effect)

## Features

### Push-to-Talk Mode

**Toggle:** Checkbox in BottomToolbar

**Behavior:**
- **OFF (default):** Server-side Voice Activity Detection (VAD)
  - Agent responds automatically when user stops speaking
  - Threshold: 0.9
  - Silence duration: 500ms
  - Prefix padding: 300ms

- **ON:** Manual control
  - User holds "Talk" button to speak
  - Audio buffer cleared on press
  - Audio buffer committed + response triggered on release

### Codec Selection

**Options:**
- **Opus (48 kHz):** Wide-band, high quality (default)
- **PCMU (8 kHz):** Narrow-band, phone quality
- **PCMA (8 kHz):** Narrow-band, phone quality (alternative)

**Purpose:** Test how agent sounds over traditional phone lines

**Implementation:** Sets WebRTC codec preferences before peer connection

### Audio Recording

**Format:** WAV (16-bit PCM, mono)

**Content:** Both user and assistant audio combined

**Process:**
1. Capture remote stream (assistant) + microphone (user)
2. Merge using AudioContext
3. Record as WebM
4. Convert to WAV on download

### Event Logging

**Toggle:** "Logs" checkbox in BottomToolbar

**Events Logged:**
- Client events (outgoing): conversation.item.create, input_audio_buffer.*, response.create, session.update
- Server events (incoming): conversation.item.*, response.*, session.*, error

**Display:**
- ▲ Client (purple)
- ▼ Server (green)
- Click to expand payload
- Errors highlighted in red

## Environment Variables

**.env.local:**
```bash
OPENAI_API_KEY=sk-proj-...
```

**Required for:**
- Creating ephemeral session tokens
- Guardrail moderation via Responses API

## Usage

### Basic Workflow

1. User navigates to `/voice-realtime`
2. Clerk authentication required
3. Click "Connect" button
4. WebRTC session established
5. LISA greets user automatically
6. User speaks or types messages
7. LISA conducts structured career discovery
8. After completion, LISA calls `generateCareerRecommendations` tool
9. Click "Disconnect" to end session
10. Conversation auto-saved to Convex

### Developer Workflow

**Access event logs:**
- Enable "Logs" checkbox
- Click events to see full payload
- Monitor client/server communication

**Test phone quality:**
- Select PCMU or PCMA codec
- Page reloads with new codec
- Test VAD behavior at 8kHz

**Download conversation:**
- Click "Download Audio" button
- WAV file includes both speakers
- Use for quality testing or transcription

## Future Enhancements

### Multi-Agent Integration

**Placeholder:** `lib/agentConfigs/lisaCareerAdvisor/tools.ts:25-35`

Connect `generateCareerRecommendations` to PathFinder's multi-agent system:
- Extract discovery data from conversation history
- Call Goals/Values Agent
- Call Skills Agent
- Call Personality Agent
- Call Interests Agent
- Run Orchestrator for dimension weighting
- Generate scored career matches
- Create personalized roadmap

### Conversation History UI

**Potential features:**
- View past LISA conversations
- Resume conversations
- Export conversation transcripts
- Analyze conversation patterns
- Track career discovery progress

### Advanced Voice Features

**Potential additions:**
- Voice interruption detection
- Emotional tone analysis
- Speaking pace adjustment
- Multi-language support
- Custom voice options

## Troubleshooting

### "No ephemeral key provided by the server"

**Cause:** OPENAI_API_KEY not set or invalid

**Solution:**
1. Add OPENAI_API_KEY to `.env.local`
2. Restart dev server
3. Verify key is valid on OpenAI dashboard

### Audio not playing

**Cause:** Browser autoplay policy

**Solution:**
1. Ensure "Audio playback" is enabled
2. Interact with page before connecting
3. Check browser autoplay settings

### Connection fails immediately

**Cause:** WebRTC negotiation failure or API error

**Solution:**
1. Check browser console for errors
2. Verify OPENAI_API_KEY is valid
3. Check network connectivity
4. Try different browser
5. Check "Logs" panel for server errors

### Conversation not saving

**Cause:** Convex mutation failure or auth issue

**Solution:**
1. Verify user is authenticated (Clerk)
2. Check Convex dashboard for errors
3. Ensure `@convex-dev/auth` is configured
4. Check browser console for mutation errors

### Guardrails not working

**Cause:** Responses API proxy failure

**Solution:**
1. Check `/api/realtime/responses` route exists
2. Verify OPENAI_API_KEY has Responses API access
3. Check browser network tab for 500 errors
4. Review server logs for detailed error

## Security Considerations

### API Key Protection

- OPENAI_API_KEY stored server-side only
- Ephemeral tokens created per session (short-lived)
- Never expose API key to client

### Authentication

- Clerk authentication required for `/voice-realtime`
- Convex mutations check user auth
- Row-level security via userId filtering

### Content Moderation

- All agent responses pass through guardrails
- Offensive/harmful content blocked
- Moderation rationale logged for review

### Data Privacy

- Conversations stored with userId
- Users can only access their own conversations
- Audio recordings never uploaded (client-side only)

## Performance

### Latency

- **WebRTC:** ~100-300ms audio latency
- **Agent response:** Varies by complexity, typically 1-3s
- **Streaming:** Assistant responses stream in real-time

### Bandwidth

- **Audio:** ~48 kbps (Opus) or ~64 kbps (PCMU/PCMA)
- **Events:** Minimal overhead (<1 kbps)

### Client Resources

- **Memory:** ~50-100 MB for active session
- **CPU:** Low (WebRTC handled by browser)
- **Storage:** 0 (conversations saved to Convex, not localStorage)

## References

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-sdk)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Convex Documentation](https://docs.convex.dev/)
