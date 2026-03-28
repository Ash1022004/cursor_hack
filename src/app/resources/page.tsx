"use client";

import React, { useState, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import Layout from "@/components/layout/Layout";
import {
  BookOpen,
  FileText,
  ExternalLink,
  Search,
  Loader2,
} from "lucide-react";
import AssessmentSelector from "@/components/assessments/AssessmentSelector";
import styles from "@/styles/pages/Resources.module.css";

/** Extract a readable domain name from a URL (e.g. "psychologytoday.com" → "Psychology Today") */
function getDomainLabel(url: string): string {
  const nice: Record<string, string> = {
    "healthline.com": "Healthline",
    "verywellmind.com": "Verywell Mind",
    "psychologytoday.com": "Psychology Today",
    "mayoclinic.org": "Mayo Clinic",
    "who.int": "WHO",
    "nimhans.ac.in": "NIMHANS",
    "mind.org.uk": "Mind UK",
    "nhs.uk": "NHS",
    "helpguide.org": "HelpGuide",
    "medlineplus.gov": "MedlinePlus",
  };
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, label] of Object.entries(nice)) {
      if (host.includes(domain)) return label;
    }
    // Fallback: capitalize domain
    return host.split(".").slice(0, -1).join(".").replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || host;
  } catch {
    return "Article";
  }
}

/** Clean up raw Exa snippets — remove markdown artifacts, duplicate titles, etc. */
function cleanSnippet(raw: string): string {
  return raw
    .replace(/#{1,6}\s*/g, "")         // remove markdown headings
    .replace(/\|/g, " ")               // remove pipe chars
    .replace(/\*{1,2}/g, "")           // remove bold/italic markers
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) → text
    .replace(/\s{2,}/g, " ")           // collapse whitespace
    .replace(/^\s+/, "")               // trim leading
    .trim();
}

const BROWSE_TOPICS = [
  "depression",
  "anxiety",
  "exam stress",
  "sleep problems",
  "loneliness",
  "grief and loss",
  "panic attacks",
  "academic pressure",
  "mindfulness techniques",
  "breathing exercises",
  "anger management",
  "social anxiety",
  "relationship issues",
  "self-harm support",
  "OCD",
  "PTSD",
];

type ResourceResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  topic: string;
};

const ResourcesPage: React.FC = () => {
  const [showAssessments, setShowAssessments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [results, setResults] = useState<ResourceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchResources = useAction(api.resources.searchResources);
  const cachedTopics = useQuery(api.resourcesDb.listTopics);

  const doSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setIsSearching(true);
      setHasSearched(true);
      setActiveTopic(query.toLowerCase().trim());
      try {
        const res = await searchResources({ query: query.trim() });
        setResults(res as ResourceResult[]);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchResources]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchQuery);
  };

  const handleChipClick = (topic: string) => {
    setSearchQuery(topic);
    doSearch(topic);
  };

  if (showAssessments) {
    return (
      <Layout
        title="Mental Health Assessments - Sehat-Saathi"
        description="Take validated psychological assessments to better understand your mental health."
      >
        <AssessmentSelector />
      </Layout>
    );
  }

  // Merge browse topics with any DB-cached topics for chips
  const allTopics = Array.from(
    new Set([...BROWSE_TOPICS, ...(cachedTopics ?? [])])
  ).sort();

  const quickLinks = [
    {
      title: "Crisis Support",
      description: "24/7 mental health crisis resources",
      icon: ExternalLink,
      href: "#",
      urgent: true,
    },
    {
      title: "Campus Resources",
      description: "Connect with your university counseling center",
      icon: BookOpen,
      href: "#",
      urgent: false,
    },
    {
      title: "Self-Assessment Tools",
      description: "Take a quick mental health assessment",
      icon: FileText,
      href: "#",
      urgent: false,
      onClick: () => setShowAssessments(true),
    },
  ];

  return (
    <Layout
      title="Resources - Sehat-Saathi"
      description="Search our Exa-powered library of curated mental health resources, articles, and self-help guides."
    >
      <div className={styles.resources}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Mental Health Resources</h1>
              <p className={styles.heroSubtitle}>
                Search our curated library of evidence-based articles, guides,
                and self-help resources — powered by Exa AI search.
              </p>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className={styles.searchSection}>
          <div className={styles.container}>
            <form className={styles.searchBar} onSubmit={handleSubmit}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search for a topic... (e.g. anxiety, exam stress, sleep)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className={styles.searchButton}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <Loader2 size={18} className={styles.spinnerInline} />
                ) : (
                  <Search size={18} />
                )}
                {isSearching ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Topic Chips */}
            <div className={styles.topicChips}>
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  className={`${styles.topicChip} ${activeTopic === topic ? styles.topicChipActive : ""}`}
                  onClick={() => handleChipClick(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Results */}
            {isSearching && (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>
                  Searching resources for &quot;{activeTopic}&quot;...
                </p>
              </div>
            )}

            {!isSearching && hasSearched && results.length === 0 && (
              <div className={styles.emptyState}>
                <p>No resources found for &quot;{activeTopic}&quot;.</p>
                <p>Try a different topic or check back later.</p>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <>
                <h2 className={styles.sectionTitle}>
                  Resources for &quot;{activeTopic}&quot;
                </h2>
                <div className={styles.resultsGrid}>
                  {results.map((r, i) => {
                    const cleaned = cleanSnippet(r.snippet);
                    const domain = getDomainLabel(r.url);
                    return (
                      <div key={`${r.url}-${i}`} className={styles.resultCard}>
                        <h3 className={styles.resultTitle}>{r.title}</h3>
                        <p className={styles.resultSnippet}>
                          {cleaned.length > 250
                            ? cleaned.slice(0, 250) + "..."
                            : cleaned}
                        </p>
                        <div className={styles.resultFooter}>
                          <span className={styles.resultSource}>{domain}</span>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.resultLink}
                          >
                            Read More <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className={styles.poweredBy}>
                  Powered by Exa AI Search — results are cached for faster
                  access
                </p>
              </>
            )}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className={styles.quickLinks}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Quick Access</h2>
            <div className={styles.quickLinksGrid}>
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <div
                    key={index}
                    className={`${styles.quickLinkCard} ${link.urgent ? styles.urgent : ""}`}
                    onClick={link.onClick}
                    style={{ cursor: link.onClick ? "pointer" : "default" }}
                  >
                    <div className={styles.quickLinkIcon}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.quickLinkContent}>
                      <h3 className={styles.quickLinkTitle}>{link.title}</h3>
                      <p className={styles.quickLinkDescription}>
                        {link.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ResourcesPage;
