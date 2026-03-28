"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { Inbox, Settings, Users, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  acceptPeerRequest,
  blockPeerUser,
  cancelPeerRequest,
  getIncomingPeerRequests,
  getOutgoingPeerRequests,
  getPeerDirectory,
  getPeerMessages,
  getPeerSettings,
  listPeerConversations,
  rejectPeerRequest,
  savePeerSettings,
  sendPeerMessage,
  sendPeerRequest,
  type ConversationSummary,
  type DirectoryPeer,
  type IncomingRequest,
  type OutgoingRequest,
  type PeerMessage,
  type PeerVisibility,
} from "@/lib/peerSupportApi";
import styles from "@/styles/pages/PeerSupport.module.css";

type Overlay = null | "settings" | "requests" | "find";

const VISIBILITY_OPTIONS: {
  value: PeerVisibility;
  title: string;
  description: string;
}[] = [
  {
    value: "off",
    title: "Off",
    description:
      "Turn peer support off. You will not appear in the peer directory, and others should not send you new connection requests.",
  },
  {
    value: "private",
    title: "Private",
    description:
      "You are not listed in the directory. Share your user ID (shown below) so someone you trust can send you a request from Find peers.",
  },
  {
    value: "open",
    title: "Open",
    description:
      "You appear in the peer directory with the display name, topics, and bio you set below. Others can send a request; you must accept before you can chat.",
  },
];

function visibilitySummary(v: PeerVisibility): string {
  if (v === "off") return "Off — peer support disabled";
  if (v === "private") return "Private — not in directory (share your user ID)";
  return "Open — listed in directory";
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function PeerSupportPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const connectParam = searchParams.get("connect")?.trim() ?? "";

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [vis, setVis] = useState<PeerVisibility>("off");
  const [displayName, setDisplayName] = useState("");
  const [topicsStr, setTopicsStr] = useState("");
  const [bio, setBio] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsEditMode, setSettingsEditMode] = useState(true);
  const [settingsOkMessage, setSettingsOkMessage] = useState<string | null>(
    null
  );
  const [hasSavedSettingsOnServer, setHasSavedSettingsOnServer] =
    useState(false);
  const lastSettingsUpdatedAtRef = useRef(0);
  const settingsAutoOpenRef = useRef(false);
  const [err, setErr] = useState<string | null>(null);

  const [peers, setPeers] = useState<DirectoryPeer[]>([]);
  const [dirLoading, setDirLoading] = useState(false);

  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>(
    []
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);

  const [privateTargetId, setPrivateTargetId] = useState("");
  const privatePrefill = useRef(false);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setErr(null);
    try {
      const s = await getPeerSettings();
      lastSettingsUpdatedAtRef.current = s.updatedAt;
      setHasSavedSettingsOnServer(s.updatedAt > 0);
      setVis(s.visibility);
      setDisplayName(s.peerDisplayName ?? "");
      setTopicsStr(s.peerTopics.join(", "));
      setBio(s.peerBio ?? "");
      if (s.updatedAt > 0) {
        setSettingsEditMode(false);
      } else {
        setSettingsEditMode(true);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load settings");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settingsLoading || hasSavedSettingsOnServer || settingsAutoOpenRef.current) {
      return;
    }
    settingsAutoOpenRef.current = true;
    setOverlay("settings");
  }, [settingsLoading, hasSavedSettingsOnServer]);

  useEffect(() => {
    if (connectParam && user?._id && connectParam !== user._id) {
      setPrivateTargetId(connectParam);
      if (!privatePrefill.current) {
        privatePrefill.current = true;
        setOverlay("find");
      }
    }
  }, [connectParam, user?._id]);

  const loadDirectory = useCallback(async () => {
    setDirLoading(true);
    setErr(null);
    try {
      setPeers(await getPeerDirectory());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load directory");
    } finally {
      setDirLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    setErr(null);
    try {
      const [inc, out] = await Promise.all([
        getIncomingPeerRequests(),
        getOutgoingPeerRequests(),
      ]);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load requests");
    } finally {
      setReqLoading(false);
    }
  }, []);

  const refreshRequestsQuiet = useCallback(async () => {
    try {
      const [inc, out] = await Promise.all([
        getIncomingPeerRequests(),
        getOutgoingPeerRequests(),
      ]);
      setIncoming(inc);
      setOutgoing(out);
    } catch {
      /* badge polling — ignore */
    }
  }, []);

  useEffect(() => {
    void refreshRequestsQuiet();
    const t = setInterval(refreshRequestsQuiet, 20000);
    return () => clearInterval(t);
  }, [refreshRequestsQuiet]);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await listPeerConversations());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load chats");
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const t = setInterval(loadConversations, 4000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (overlay === "find") loadDirectory();
  }, [overlay, loadDirectory]);

  useEffect(() => {
    if (overlay === "requests") loadRequests();
  }, [overlay, loadRequests]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setMsgLoading(true);
    try {
      setMessages(await getPeerMessages(conversationId, { limit: 80 }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load messages");
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    void loadMessages(activeConvId);
    const t = setInterval(() => loadMessages(activeConvId), 3000);
    return () => clearInterval(t);
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  async function onSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setErr(null);
    setSettingsOkMessage(null);
    try {
      const topics = topicsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await savePeerSettings({
        visibility: vis,
        peerDisplayName: displayName.trim() || undefined,
        peerTopics: topics,
        peerBio: bio.trim() || undefined,
      });
      setHasSavedSettingsOnServer(true);
      lastSettingsUpdatedAtRef.current = Date.now();
      setSettingsEditMode(false);
      setSettingsOkMessage("Settings saved. Use Edit to change them anytime.");
      window.setTimeout(() => setSettingsOkMessage(null), 6000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function onCancelSettingsEdit() {
    setErr(null);
    setSettingsOkMessage(null);
    await loadSettings();
    if (lastSettingsUpdatedAtRef.current > 0) {
      setSettingsEditMode(false);
    }
  }

  async function onRequestPeer(toUserId: string) {
    setErr(null);
    try {
      await sendPeerRequest(toUserId);
      await loadDirectory();
      await loadRequests();
      await refreshRequestsQuiet();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    }
  }

  async function onPrivateRequest(e: React.FormEvent) {
    e.preventDefault();
    const id = privateTargetId.trim();
    if (!id) return;
    await onRequestPeer(id);
    setPrivateTargetId("");
  }

  async function onAccept(requestId: string) {
    setErr(null);
    try {
      const { conversationId } = await acceptPeerRequest(requestId);
      await loadRequests();
      await refreshRequestsQuiet();
      await loadConversations();
      setActiveConvId(conversationId);
      setOverlay(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Accept failed");
    }
  }

  async function onSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConvId || !draft.trim()) return;
    setErr(null);
    try {
      await sendPeerMessage(activeConvId, draft.trim());
      setDraft("");
      await loadMessages(activeConvId);
      await loadConversations();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    }
  }

  const activeConv = conversations.find((c) => c.conversationId === activeConvId);

  async function onBlockPeer() {
    if (!activeConv) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Block this peer? You will not see each other in peer support."
      )
    ) {
      return;
    }
    setErr(null);
    try {
      await blockPeerUser(activeConv.otherUserId);
      setActiveConvId(null);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Block failed");
    }
  }

  const incomingPending = incoming.length;

  const settingsPanel = (
    <div className={styles.panelDrawer}>
      {settingsLoading ? (
        <p>Loading…</p>
      ) : settingsEditMode ? (
        <form onSubmit={onSaveSettings}>
          <p className={styles.fieldLabel} style={{ marginTop: 0 }}>
            Choose who can discover you and send a connection request
          </p>
          <div
            className={styles.radioGroup}
            role="radiogroup"
            aria-label="Peer support visibility"
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <label key={opt.value} className={styles.radioCard}>
                <input
                  className={styles.radioInput}
                  type="radio"
                  name="peer-visibility"
                  checked={vis === opt.value}
                  onChange={() => setVis(opt.value)}
                />
                <span className={styles.radioCardBody}>
                  <span className={styles.radioCardTitle}>{opt.title}</span>
                  <span className={styles.radioCardDesc}>{opt.description}</span>
                </span>
              </label>
            ))}
          </div>

          <div className={styles.field}>
            <label htmlFor="peerDisplayName">
              Display name (optional, shown in directory if Open)
            </label>
            <input
              id="peerDisplayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Alex (they/them)"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="peerTopics">
              Topics for directory (comma-separated)
            </label>
            <input
              id="peerTopics"
              value={topicsStr}
              onChange={(e) => setTopicsStr(e.target.value)}
              placeholder="anxiety, exam stress, loneliness"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="peerBio">Short bio (optional)</label>
            <textarea
              id="peerBio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
            />
          </div>
          {user?._id && (
            <div className={styles.field}>
              <label htmlFor="shareUserId">
                Your user ID (share so others can request you in Private mode)
              </label>
              <input
                id="shareUserId"
                className={styles.userIdInput}
                readOnly
                value={user._id}
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={settingsSaving}
            >
              {settingsSaving ? "Saving…" : "Save changes"}
            </button>
            {hasSavedSettingsOnServer ? (
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={settingsSaving}
                onClick={() => void onCancelSettingsEdit()}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <>
          {settingsOkMessage ? (
            <div className={styles.successBanner} role="status">
              {settingsOkMessage}
            </div>
          ) : null}
          <div className={styles.settingsSummary}>
            <div className={styles.settingsSummaryRow}>
              <span className={styles.settingsSummaryLabel}>Visibility</span>
              {visibilitySummary(vis)}
            </div>
            <div className={styles.settingsSummaryRow}>
              <span className={styles.settingsSummaryLabel}>Display name</span>
              {displayName.trim() || "—"}
            </div>
            <div className={styles.settingsSummaryRow}>
              <span className={styles.settingsSummaryLabel}>Topics</span>
              {topicsStr.trim() || "—"}
            </div>
            <div className={styles.settingsSummaryRow}>
              <span className={styles.settingsSummaryLabel}>Bio</span>
              {bio.trim() || "—"}
            </div>
            {user?._id ? (
              <div className={styles.settingsSummaryRow}>
                <span className={styles.settingsSummaryLabel}>Your user ID</span>
                <span className={styles.userIdInput}>{user._id}</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setSettingsOkMessage(null);
              setErr(null);
              setSettingsEditMode(true);
            }}
          >
            Edit settings
          </button>
        </>
      )}
    </div>
  );

  const findPeersPanel = (
    <div className={styles.panelDrawer}>
      <p className={styles.inviteHint}>
        <strong>Open</strong> peers are listed below. For{" "}
        <strong>private</strong> peers, paste their user ID (they share it from
        Privacy &amp; profile).
      </p>
      <form onSubmit={onPrivateRequest} className={styles.field}>
        <label htmlFor="privateId">Request chat by user ID</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            id="privateId"
            className={styles.userIdInput}
            style={{ flex: 1, minWidth: 200 }}
            value={privateTargetId}
            onChange={(e) => setPrivateTargetId(e.target.value)}
            placeholder="Convex user id"
          />
          <button type="submit" className={styles.btnSecondary}>
            Send request
          </button>
        </div>
      </form>
      {dirLoading ? (
        <p>Loading directory…</p>
      ) : (
        <div className={styles.cardList}>
          {peers.length === 0 ? (
            <p>No open peers right now. Try again later.</p>
          ) : (
            peers.map((p) => (
              <div key={p.userId} className={styles.card}>
                <div>
                  <strong>{p.peerDisplayName?.trim() || "Peer"}</strong>
                  <div className={styles.cardMeta}>
                    {p.peerTopics.length > 0
                      ? p.peerTopics.join(" · ")
                      : "No topics listed"}
                    {p.university ? ` · ${p.university}` : ""}
                    {p.ageGroup ? ` · ${p.ageGroup}` : ""}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => onRequestPeer(p.userId)}
                  >
                    Request chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const requestsPanel = (
    <div className={styles.panelDrawer}>
      {reqLoading ? (
        <p>Loading…</p>
      ) : (
        <>
          <h3 style={{ marginBottom: 12, marginTop: 0 }}>Incoming</h3>
          <div className={styles.cardList}>
            {incoming.length === 0 ? (
              <p className={styles.cardMeta}>No pending requests.</p>
            ) : (
              incoming.map((r) => (
                <div key={r.requestId} className={styles.card}>
                  <div>
                    <strong>{r.fromLabel}</strong>
                    <div className={styles.cardMeta}>
                      {formatTime(r.createdAt)}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => onAccept(r.requestId)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={async () => {
                        try {
                          await rejectPeerRequest(r.requestId);
                          await loadRequests();
                          await refreshRequestsQuiet();
                        } catch (e) {
                          setErr(
                            e instanceof Error ? e.message : "Reject failed"
                          );
                        }
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <h3 style={{ margin: "24px 0 12px" }}>Outgoing</h3>
          <div className={styles.cardList}>
            {outgoing.length === 0 ? (
              <p className={styles.cardMeta}>No pending outgoing.</p>
            ) : (
              outgoing.map((r) => (
                <div key={r.requestId} className={styles.card}>
                  <div>
                    <strong>{r.toLabel}</strong>
                    <div className={styles.cardMeta}>
                      {formatTime(r.createdAt)}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={async () => {
                        try {
                          await cancelPeerRequest(r.requestId);
                          await loadRequests();
                          await refreshRequestsQuiet();
                        } catch (e) {
                          setErr(
                            e instanceof Error ? e.message : "Cancel failed"
                          );
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <Layout
        title="Peer support - Sehat Saathi"
        description="Chat privately with peers who opted in. Peers are not professionals."
      >
        <div className={styles.page}>
          <div className={styles.chatShell}>
            <header className={styles.chatTopBar}>
              <div className={styles.chatTitleBlock}>
                <h1 className={styles.chatTitle}>Peer support</h1>
                <p className={styles.chatSubtitle}>
                  Chats with fellow students — not counselling. Use helplines in
                  crisis.
                </p>
              </div>
              <div
                className={styles.chatToolbar}
                role="toolbar"
                aria-label="Peer support actions"
              >
                <button
                  type="button"
                  className={
                    overlay === "find" ? styles.iconBtnActive : styles.iconBtn
                  }
                  aria-label="Find peers"
                  aria-pressed={overlay === "find"}
                  title="Find peers"
                  onClick={() =>
                    setOverlay((o) => (o === "find" ? null : "find"))
                  }
                >
                  <Users size={20} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  className={
                    overlay === "requests"
                      ? styles.iconBtnActive
                      : styles.iconBtn
                  }
                  aria-label={`Connection requests${
                    incomingPending ? `, ${incomingPending} pending` : ""
                  }`}
                  aria-pressed={overlay === "requests"}
                  title="Requests"
                  onClick={() =>
                    setOverlay((o) => (o === "requests" ? null : "requests"))
                  }
                >
                  <Inbox size={20} strokeWidth={2} aria-hidden />
                  {incomingPending > 0 ? (
                    <span className={styles.toolbarBadge}>
                      {incomingPending > 9 ? "9+" : incomingPending}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  className={
                    overlay === "settings"
                      ? styles.iconBtnActive
                      : styles.iconBtn
                  }
                  aria-label="Privacy and profile settings"
                  aria-pressed={overlay === "settings"}
                  title="Settings"
                  onClick={() =>
                    setOverlay((o) => (o === "settings" ? null : "settings"))
                  }
                >
                  <Settings size={20} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </header>

            <p className={styles.bannerCompact}>
              <strong>Important:</strong> Peer supporters are fellow students,
              not counsellors or clinicians. Do not share passwords or sensitive
              financial data in chat.
            </p>

            {err ? (
              <p className={styles.errorBar} role="alert">
                {err}
              </p>
            ) : null}

            <div className={styles.chatMain}>
              <div className={`${styles.chatLayout} ${styles.chatLayoutFull}`}>
                <div className={styles.convList}>
                  {conversations.length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        fontSize: 14,
                        color: "var(--gray-600, #666)",
                      }}
                    >
                      No conversations yet. Open{" "}
                      <strong>Find peers</strong> or check{" "}
                      <strong>Requests</strong>.
                    </div>
                  ) : (
                    conversations.map((c) => (
                      <button
                        key={c.conversationId}
                        type="button"
                        className={
                          activeConvId === c.conversationId
                            ? styles.convItemActive
                            : styles.convItem
                        }
                        onClick={() => setActiveConvId(c.conversationId)}
                      >
                        {c.otherLabel}
                        <div className={styles.convPreview}>{c.preview}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className={styles.thread}>
                  {!activeConvId ? (
                    <div
                      style={{
                        padding: 24,
                        color: "var(--gray-600, #666)",
                        alignSelf: "center",
                        margin: "auto",
                        textAlign: "center",
                        maxWidth: 320,
                      }}
                    >
                      Select a conversation on the left, or use{" "}
                      <strong>Find peers</strong> to start one.
                    </div>
                  ) : (
                    <>
                      <div className={styles.threadHeader}>
                        <span>{activeConv?.otherLabel ?? "Chat"}</span>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={onBlockPeer}
                        >
                          Block peer
                        </button>
                      </div>
                      <div className={styles.threadMessages}>
                        {msgLoading && messages.length === 0 ? (
                          <p>Loading messages…</p>
                        ) : (
                          messages.map((m) => (
                            <div
                              key={m.id}
                              className={
                                m.mine ? styles.msgRowMine : styles.msgRow
                              }
                            >
                              <div
                                className={
                                  m.mine
                                    ? styles.msgBubbleMine
                                    : styles.msgBubble
                                }
                              >
                                {m.body}
                                <div className={styles.msgTime}>
                                  {formatTime(m.createdAt)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <form
                        className={styles.threadInput}
                        onSubmit={onSendMessage}
                      >
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Message…"
                          maxLength={8000}
                          aria-label="Message"
                        />
                        <button type="submit" className={styles.btnPrimary}>
                          Send
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {overlay ? (
            <>
              <button
                type="button"
                className={styles.overlayBackdrop}
                aria-label="Close panel"
                onClick={() => setOverlay(null)}
              />
              <aside
                className={styles.drawer}
                role="dialog"
                aria-modal="true"
                aria-labelledby="peer-drawer-title"
              >
                <div className={styles.drawerHeader}>
                  <h2 id="peer-drawer-title" className={styles.drawerTitle}>
                    {overlay === "settings" && "Privacy & profile"}
                    {overlay === "requests" && "Connection requests"}
                    {overlay === "find" && "Find peers"}
                  </h2>
                  <button
                    type="button"
                    className={styles.drawerClose}
                    aria-label="Close"
                    onClick={() => setOverlay(null)}
                  >
                    <X size={20} aria-hidden />
                  </button>
                </div>
                <div className={styles.drawerBody}>
                  {overlay === "settings" && settingsPanel}
                  {overlay === "requests" && requestsPanel}
                  {overlay === "find" && findPeersPanel}
                </div>
              </aside>
            </>
          ) : null}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export default function PeerSupportClient() {
  return (
    <Suspense fallback={<div className={styles.page}>Loading…</div>}>
      <PeerSupportPageContent />
    </Suspense>
  );
}
