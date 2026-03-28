"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Brain,
  Ghost,
  House,
  Languages,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SAATHI_LANGUAGES } from "@/components/saathi/SaathiLanguageGate";
import styles from "./SaathiHeaderToolbar.module.css";

export type SaathiHeaderToolbarChrome = "sheet" | "onGradient";

export type SaathiHeaderLanguageMenu = {
  onSelectLanguage: (code: string) => void | Promise<void>;
  onRequestClear?: () => void;
  needsAttention?: boolean;
};

type Props = {
  mode: "anonymous" | "memory";
  onToggleMode: () => void;
  centerAction: "maximize" | "minimize";
  onCenterClick: () => void;
  onClose: () => void;
  chrome?: SaathiHeaderToolbarChrome;
  className?: string;
  languageMenu?: SaathiHeaderLanguageMenu;
  showHomeLink?: boolean;
};

export default function SaathiHeaderToolbar({
  mode,
  onToggleMode,
  centerAction,
  onCenterClick,
  onClose,
  chrome = "sheet",
  className,
  languageMenu,
  showHomeLink,
}: Props) {
  const reduceMotion = useReducedMotion();
  const onGradient = chrome === "onGradient";
  const [langOpen, setLangOpen] = useState(false);
  const langRootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iconBtnClass = `${styles.iconBtn}${onGradient ? ` ${styles.iconBtnGradient}` : ""}`;
  const modeMemoryClass = `${styles.modeToggleMemory}${
    onGradient ? ` ${styles.modeToggleMemoryGradient}` : ""
  }`;
  const modeAnonClass = `${styles.modeToggleAnonymous}${
    onGradient ? ` ${styles.modeToggleAnonymousGradient}` : ""
  }`;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleCloseMenu = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setLangOpen(false), 200);
  }, [clearCloseTimer]);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setLangOpen(true);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!langOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [langOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = langRootRef.current;
      if (el && !el.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [langOpen]);

  const handlePickLanguage = async (code: string) => {
    try {
      await Promise.resolve(languageMenu?.onSelectLanguage(code));
    } finally {
      setLangOpen(false);
    }
  };

  const langTriggerClass = `${iconBtnClass}${
    languageMenu?.needsAttention ? ` ${styles.langTriggerNeedsAttention}` : ""
  }`;

  const panelClass = `${styles.langMenuPanel}${
    onGradient ? ` ${styles.langMenuPanelOnGradient}` : ""
  }`;
  const titleClass = `${styles.langMenuTitle}${
    onGradient ? ` ${styles.langMenuTitleOnGradient}` : ""
  }`;
  const itemClass = `${styles.langMenuItem}${
    onGradient ? ` ${styles.langMenuItemOnGradient}` : ""
  }`;
  const dividerClass = `${styles.langMenuDivider}${
    onGradient ? ` ${styles.langMenuDividerOnGradient}` : ""
  }`;
  const resetClass = `${styles.langMenuReset}${
    onGradient ? ` ${styles.langMenuResetOnGradient}` : ""
  }`;
  const crisisClass = `${styles.langMenuCrisis}${
    onGradient ? ` ${styles.langMenuCrisisOnGradient}` : ""
  }`;

  return (
    <div className={`${styles.actions} ${className ?? ""}`}>
      <motion.button
        type="button"
        className={`${iconBtnClass} ${styles.modeToggle} ${
          mode === "memory" ? modeMemoryClass : modeAnonClass
        }`}
        onClick={onToggleMode}
        aria-label={
          mode === "anonymous"
            ? "Anonymous chat. Switch to memory mode."
            : "Memory chat. Switch to anonymous mode."
        }
        title={
          mode === "anonymous"
            ? "Switch to Memory (signed-in companion)"
            : "Switch to Anonymous"
        }
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      >
        <motion.span
          key={mode}
          className={styles.modeToggleIconWrap}
          initial={
            reduceMotion ? undefined : { rotate: -90, opacity: 0, scale: 0.55 }
          }
          animate={reduceMotion ? undefined : { rotate: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 440,
            damping: 24,
          }}
          aria-hidden
        >
          {mode === "anonymous" ? (
            <Ghost size={18} strokeWidth={2.25} />
          ) : (
            <Brain size={18} strokeWidth={2.25} />
          )}
        </motion.span>
      </motion.button>

      {languageMenu ? (
        <div
          ref={langRootRef}
          className={styles.langMenuRoot}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
        >
          <button
            type="button"
            className={langTriggerClass}
            aria-label="Choose language"
            title="Language"
            aria-expanded={langOpen}
            aria-haspopup="true"
            onClick={() => setLangOpen((o) => !o)}
          >
            <Languages size={18} strokeWidth={2.25} aria-hidden />
          </button>
          {langOpen ? (
            <>
              <div className={styles.langMenuBridge} aria-hidden />
            <div
              className={panelClass}
              role="menu"
              aria-label="Language options"
              onMouseEnter={openMenu}
            >
              <p className={titleClass}>Language / زبان</p>
              {SAATHI_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => void handlePickLanguage(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
              {languageMenu.onRequestClear ? (
                <>
                  <div className={dividerClass} aria-hidden />
                  <button
                    type="button"
                    className={resetClass}
                    onClick={() => {
                      languageMenu.onRequestClear?.();
                      setLangOpen(false);
                    }}
                  >
                    Start over (new chat ID)
                  </button>
                </>
              ) : null}
              <p className={crisisClass}>
                Crisis?{" "}
                <a href="tel:9152987821">iCall 9152987821</a>
              </p>
            </div>
            </>
          ) : null}
        </div>
      ) : null}

      {showHomeLink ? (
        <Link
          href="/"
          className={iconBtnClass}
          aria-label="Home"
          title="Home"
          prefetch={false}
        >
          <House size={18} strokeWidth={2.25} aria-hidden />
        </Link>
      ) : null}

      <button
        type="button"
        className={iconBtnClass}
        onClick={onCenterClick}
        aria-label={
          centerAction === "maximize"
            ? "Open chat in full screen"
            : "Return to site"
        }
        title={centerAction === "maximize" ? "Full screen" : "Return to site"}
      >
        {centerAction === "maximize" ? (
          <Maximize2 size={18} strokeWidth={2.25} aria-hidden />
        ) : (
          <Minimize2 size={18} strokeWidth={2.25} aria-hidden />
        )}
      </button>

      <button
        type="button"
        className={iconBtnClass}
        onClick={onClose}
        aria-label="Close chat"
        title="Close"
      >
        <X size={18} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
