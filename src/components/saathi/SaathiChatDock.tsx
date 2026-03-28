"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, MessageCircle, Sparkles } from "lucide-react";
import { api } from "@cvx/_generated/api";
import AnonymousSaathiPanel from "@/components/saathi/AnonymousSaathiPanel";
import MemorySaathiPanel from "@/components/saathi/MemorySaathiPanel";
import SaathiHeaderToolbar from "@/components/saathi/SaathiHeaderToolbar";
import { useAuth } from "@/context/AuthContext";
import dockStyles from "./SaathiChatDock.module.css";

type ChatMode = "anonymous" | "memory";

export default function SaathiChatDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const getOrCreatePatient = useMutation(api.patients.getOrCreatePatient);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("anonymous");
  const [langNonce, setLangNonce] = useState(0);
  const [dockNeedsLanguage, setDockNeedsLanguage] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleDockPickLanguage = useCallback(
    async (language: string) => {
      let id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `saathi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const existing =
        typeof window !== "undefined" ? localStorage.getItem("saathi_id") : null;
      if (existing) id = existing;
      else if (typeof window !== "undefined") localStorage.setItem("saathi_id", id);
      await getOrCreatePatient({ anonymousId: id, language });
      setDockNeedsLanguage(false);
      setLangNonce((n) => n + 1);
    },
    [getOrCreatePatient]
  );

  const handleDockClearLanguage = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem("saathi_id");
    setDockNeedsLanguage(true);
    setLangNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!open || isLoading) return;
    setMode(isAuthenticated ? "memory" : "anonymous");
  }, [open, isAuthenticated, isLoading]);

  if (
    pathname === "/saathi" ||
    pathname === "/chat" ||
    pathname === "/chat/memory"
  ) {
    return null;
  }

  const handleMaximize = () => {
    setOpen(false);
    if (mode === "anonymous") {
      router.push("/saathi");
    } else {
      router.push("/chat/memory");
    }
  };

  return (
    <>
      <motion.button
        type="button"
        className={dockStyles.fab}
        onClick={() => setOpen(true)}
        aria-label="Open Sehat-Saathi chat"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        animate={{
          boxShadow: [
            "0 4px 20px rgba(0, 0, 0, 0.18)",
            "0 4px 28px rgba(72, 187, 120, 0.45)",
            "0 4px 20px rgba(0, 0, 0, 0.18)",
          ],
        }}
        transition={{
          boxShadow: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.span
          className={dockStyles.fabIconWrap}
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 2,
          }}
        >
          <span className={dockStyles.ring} aria-hidden />
          <MessageCircle size={22} strokeWidth={2} />
          <motion.span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              display: "flex",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={12} strokeWidth={2.5} />
          </motion.span>
        </motion.span>
      </motion.button>

      {open && (
        <>
          <button
            type="button"
            className={dockStyles.backdrop}
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          />
          <motion.div
            className={dockStyles.sheet}
            role="dialog"
            aria-label="Sehat-Saathi chat"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={dockStyles.brandRow}>
              <div className={dockStyles.brandIcon} aria-hidden>
                <motion.span
                  className={dockStyles.heartbeat}
                  animate={
                    reduceMotion
                      ? undefined
                      : { scale: [1, 1.1, 1, 1.06, 1] }
                  }
                  transition={{
                    duration: 1.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Activity size={20} strokeWidth={2.25} />
                </motion.span>
              </div>
              <div className={dockStyles.brandText}>
                <p className={dockStyles.brandTitle}>Saathi • Your Health Companion</p>
                <p className={dockStyles.brandSubtitle}>Calm, private support</p>
              </div>
            </div>

            <div className={dockStyles.sheetHeader}>
              <div className={dockStyles.headerSpacer} aria-hidden />
              <SaathiHeaderToolbar
                mode={mode}
                onToggleMode={() =>
                  setMode((m) => (m === "anonymous" ? "memory" : "anonymous"))
                }
                centerAction="maximize"
                onCenterClick={handleMaximize}
                onClose={() => setOpen(false)}
                languageMenu={
                  mode === "anonymous"
                    ? {
                        onSelectLanguage: handleDockPickLanguage,
                        onRequestClear: handleDockClearLanguage,
                        needsAttention: dockNeedsLanguage,
                      }
                    : undefined
                }
              />
            </div>
            <p className={dockStyles.subline}>
              {mode === "anonymous"
                ? "Private device ID only — no account."
                : "Signed-in companion with conversation memory."}
            </p>
            <div
              className={dockStyles.sheetBody}
              style={{ display: mode === "anonymous" ? "flex" : "none" }}
              aria-hidden={mode !== "anonymous"}
            >
              <AnonymousSaathiPanel
                variant="compact"
                hideCompactLanguageStrip
                languageSyncNonce={langNonce}
                onNeedsLanguageChange={setDockNeedsLanguage}
              />
            </div>
            <div
              className={dockStyles.sheetBody}
              style={{ display: mode === "memory" ? "flex" : "none" }}
              aria-hidden={mode !== "memory"}
            >
              <MemorySaathiPanel variant="compact" />
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
