import axios from "axios";
import api from "@/network/core/axiosInstance";

/** Server `message` codes → readable copy */
const PEER_MESSAGE: Record<string, string> = {
  target_off:
    "This person is not accepting peer requests (their visibility is Off).",
  pending_exists:
    "A request is already pending between you and this peer — check the Requests tab.",
  pending_incoming:
    "This peer already sent you a request. Open the Requests tab and accept it there.",
  already_connected:
    "You are already connected. Open Messages to chat.",
  self: "You cannot send a request to yourself.",
  blocked: "This action is blocked between you and this peer.",
  forbidden: "You are not allowed to do this.",
  not_student: "Peer support is only for student accounts.",
  not_connected: "Accept a connection request before sending messages.",
  not_pending: "This request is no longer pending.",
  empty: "Message cannot be empty.",
  too_long: "Message is too long.",
  "No token Provided": "Please sign in again.",
};

export type PeerVisibility = "off" | "private" | "open";

export type PeerSettings = {
  visibility: PeerVisibility;
  peerDisplayName?: string;
  peerTopics: string[];
  peerBio?: string;
  updatedAt: number;
};

export type DirectoryPeer = {
  userId: string;
  peerDisplayName?: string;
  peerTopics: string[];
  ageGroup?: string;
  university?: string;
};

export type IncomingRequest = {
  requestId: string;
  fromUserId: string;
  fromLabel: string;
  createdAt: number;
};

export type OutgoingRequest = {
  requestId: string;
  toUserId: string;
  toLabel: string;
  createdAt: number;
};

export type ConversationSummary = {
  conversationId: string;
  otherUserId: string;
  otherLabel: string;
  lastMessageAt: number;
  preview: string;
};

export type PeerMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: number;
  mine: boolean;
};

function formatPeerErrorMessage(raw: string): string {
  if (PEER_MESSAGE[raw]) return PEER_MESSAGE[raw];
  const spaced = raw.replace(/_/g, " ");
  if (raw !== spaced && raw === raw.toLowerCase()) {
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
  return raw;
}

async function unwrap<T>(p: Promise<{ data: unknown }>, label: string): Promise<T> {
  try {
    const res = await p;
    const data = res.data as Record<string, unknown>;
    if (!data?.success) {
      const msg =
        typeof data?.message === "string" ? data.message : `${label} failed`;
      throw new Error(formatPeerErrorMessage(msg));
    }
    return data as T;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const d = e.response?.data;
      const code =
        d &&
        typeof d === "object" &&
        d !== null &&
        typeof (d as { message?: string }).message === "string"
          ? (d as { message: string }).message.trim()
          : "";
      if (code) throw new Error(formatPeerErrorMessage(code));
      const st = e.response?.status;
      if (st === 404) {
        throw new Error(
          "Peer API not found. Set CONVEX_SITE_URL in .env.local so /api/user/peer/* is proxied to Convex."
        );
      }
      if (st && st >= 500) {
        throw new Error(
          "Server error. Run `npx convex dev` (or deploy) so peer support routes and database tables are available."
        );
      }
    }
    if (e instanceof Error) throw e;
    throw new Error(`${label} failed`);
  }
}

export async function getPeerSettings(): Promise<PeerSettings> {
  const data = await unwrap<{ success: boolean; settings: PeerSettings }>(
    api.get("/api/user/peer/settings"),
    "Load settings"
  );
  return data.settings;
}

export async function savePeerSettings(patch: {
  visibility: PeerVisibility;
  peerDisplayName?: string;
  peerTopics?: string[];
  peerBio?: string;
}): Promise<PeerSettings> {
  const data = await unwrap<{ success: boolean; settings: PeerSettings }>(
    api.post("/api/user/peer/settings", patch),
    "Save settings"
  );
  return data.settings;
}

export async function getPeerDirectory(): Promise<DirectoryPeer[]> {
  const data = await unwrap<{ success: boolean; peers: DirectoryPeer[] }>(
    api.get("/api/user/peer/directory"),
    "Directory"
  );
  return data.peers;
}

export async function sendPeerRequest(toUserId: string): Promise<string> {
  const data = await unwrap<{ success: boolean; requestId: string }>(
    api.post("/api/user/peer/requests", { toUserId }),
    "Send request"
  );
  return data.requestId;
}

export async function getIncomingPeerRequests(): Promise<IncomingRequest[]> {
  const data = await unwrap<{ success: boolean; requests: IncomingRequest[] }>(
    api.get("/api/user/peer/requests/incoming"),
    "Incoming requests"
  );
  return data.requests;
}

export async function getOutgoingPeerRequests(): Promise<OutgoingRequest[]> {
  const data = await unwrap<{ success: boolean; requests: OutgoingRequest[] }>(
    api.get("/api/user/peer/requests/outgoing"),
    "Outgoing requests"
  );
  return data.requests;
}

export async function acceptPeerRequest(
  requestId: string
): Promise<{ conversationId: string }> {
  const data = await unwrap<{
    success: boolean;
    conversationId: string;
  }>(api.post("/api/user/peer/requests/accept", { requestId }), "Accept");
  return { conversationId: data.conversationId };
}

export async function rejectPeerRequest(requestId: string): Promise<void> {
  await unwrap<{ success: boolean }>(
    api.post("/api/user/peer/requests/reject", { requestId }),
    "Reject"
  );
}

export async function cancelPeerRequest(requestId: string): Promise<void> {
  await unwrap<{ success: boolean }>(
    api.post("/api/user/peer/requests/cancel", { requestId }),
    "Cancel"
  );
}

export async function listPeerConversations(): Promise<ConversationSummary[]> {
  const data = await unwrap<{
    success: boolean;
    conversations: ConversationSummary[];
  }>(api.get("/api/user/peer/conversations"), "Conversations");
  return data.conversations;
}

export async function ensurePeerConversation(
  otherUserId: string
): Promise<string> {
  const data = await unwrap<{ success: boolean; conversationId: string }>(
    api.post("/api/user/peer/conversations", { otherUserId }),
    "Open chat"
  );
  return data.conversationId;
}

export async function getPeerMessages(
  conversationId: string,
  opts?: { limit?: number; beforeCreatedAt?: number }
): Promise<PeerMessage[]> {
  const params = new URLSearchParams({ conversationId });
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.beforeCreatedAt != null) {
    params.set("beforeCreatedAt", String(opts.beforeCreatedAt));
  }
  const data = await unwrap<{ success: boolean; messages: PeerMessage[] }>(
    api.get(`/api/user/peer/messages?${params.toString()}`),
    "Messages"
  );
  return data.messages;
}

export async function sendPeerMessage(
  conversationId: string,
  body: string
): Promise<void> {
  await unwrap<{ success: boolean }>(
    api.post("/api/user/peer/messages", { conversationId, body }),
    "Send message"
  );
}

export async function blockPeerUser(blockedUserId: string): Promise<void> {
  await unwrap<{ success: boolean }>(
    api.post("/api/user/peer/block", { blockedUserId }),
    "Block"
  );
}
