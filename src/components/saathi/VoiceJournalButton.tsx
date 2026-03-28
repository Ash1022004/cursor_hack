"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useCallback, useRef, useState } from "react";

interface Props {
  anonymousId: string;
  onResult: (result: {
    transcription: string;
    summary: string;
    moodScore: number;
    emotion: string;
    crisisDetected: boolean;
  }) => void;
  disabled?: boolean;
}

export default function VoiceJournalButton({
  anonymousId,
  onResult,
  disabled,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const getUploadUrl = useMutation(api.voiceJournalsDb.getUploadUrl);
  const processVoiceJournal = useAction(api.voiceJournals.processVoiceJournal);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(250);
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      // Microphone permission denied or unavailable
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
      mediaRecorder.stop();
    });

    // Stop all tracks
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
    setProcessing(true);

    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      // Upload to Convex storage
      const uploadUrl = await getUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: blob,
      });
      const { storageId } = (await uploadRes.json()) as {
        storageId: string;
      };

      // Process via Groq Whisper + LLM
      const result = await processVoiceJournal({
        storageId: storageId as never,
        anonymousId,
        duration,
      });

      onResult(result);
    } catch {
      // Processing error — silently handled
    } finally {
      setProcessing(false);
    }
  }, [anonymousId, getUploadUrl, processVoiceJournal, onResult]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (processing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 20,
          background: "#f3f0ff",
          fontSize: 12,
          color: "#7c6fcd",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#7c6fcd",
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
        Transcribing...
      </div>
    );
  }

  if (recording) {
    return (
      <button
        type="button"
        onClick={stopRecording}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 20,
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          cursor: "pointer",
          fontSize: 12,
          color: "#dc2626",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#dc2626",
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
        {formatTime(elapsed)} — Tap to stop
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled || !anonymousId}
      title="Record voice journal"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "1px solid #d1d5db",
        background: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z"
          fill="#7c6fcd"
        />
        <path
          d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8"
          stroke="#7c6fcd"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
