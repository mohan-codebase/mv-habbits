'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Monitor,
  Laptop,
  Smartphone,
  Shield,
  ShieldAlert,
  Trash2,
  LogOut,
  CheckCircle,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface Session {
  id: string;
  user_agent: string;
  ip: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

interface DevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();
  let os = 'Unknown Device';
  let osIcon = Smartphone;

  if (uaLower.includes('iphone') || uaLower.includes('ipod')) {
    os = 'iPhone';
    osIcon = Smartphone;
  } else if (uaLower.includes('ipad')) {
    os = 'iPad';
    osIcon = Smartphone;
  } else if (uaLower.includes('android')) {
    os = 'Android';
    osIcon = Smartphone;
  } else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) {
    os = 'macOS';
    osIcon = Laptop;
  } else if (uaLower.includes('windows')) {
    os = 'Windows';
    osIcon = Monitor;
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
    osIcon = Monitor;
  }

  let browser = 'Web Browser';
  if (uaLower.includes('firefox') && !uaLower.includes('seamonkey')) {
    browser = 'Firefox';
  } else if (uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Chrome';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Safari';
  } else if (uaLower.includes('edge') || uaLower.includes('edg/')) {
    browser = 'Edge';
  } else if (uaLower.includes('opera') || uaLower.includes('opr/')) {
    browser = 'Opera';
  }

  return { os, browser, osIcon };
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DevicesModal({ isOpen, onClose }: DevicesModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null); // 'all' or sessionId
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    label: string;
    type: 'single' | 'others';
  } | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_sessions');
      if (rpcError) throw rpcError;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Could not retrieve active sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setConfirmTarget(null);
    }
  }, [isOpen]);

  const requestRevokeSession = (session: Session) => {
    const { os, browser } = parseUserAgent(session.user_agent);
    setConfirmTarget({
      id: session.id,
      label: `${os} · ${browser}`,
      type: 'single',
    });
  };

  const requestRevokeOthers = () => {
    setConfirmTarget({
      id: 'all',
      label: 'all other devices',
      type: 'others',
    });
  };

  const executeRevokeSession = async (sessionId: string) => {
    setActionInProgress(sessionId);
    setConfirmTarget(null);
    try {
      const { error: rpcError } = await supabase.rpc('revoke_user_session', { target_session_id: sessionId });
      if (rpcError) throw rpcError;
      
      // Update local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Error revoking session:', err);
      alert('Failed to revoke session. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const executeRevokeOthers = async () => {
    setActionInProgress('all');
    setConfirmTarget(null);
    try {
      const { error: rpcError } = await supabase.rpc('revoke_other_user_sessions');
      if (rpcError) throw rpcError;

      // Update state to keep only the current session
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (err) {
      console.error('Error revoking other sessions:', err);
      alert('Failed to sign out of other devices. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Devices & Sessions" size="md">
      <div className="[font-family:system-ui,-apple-system,sans-serif] text-text-primary min-h-[180px]">

        <AnimatePresence mode="wait">
          {confirmTarget ? (
            <motion.div
              key="confirm-view"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex flex-col items-center gap-4 rounded-[20px] border-[1.5px] border-[rgba(104,104,104,0.22)] bg-[rgba(104,104,104,0.04)] p-[24px_20px] text-center"
            >
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[rgba(104,104,104,0.12)] text-[#6a6a6a]">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="m-0 text-[17px] font-extrabold [font-family:'Outfit',sans-serif]">
                  {confirmTarget.type === 'single' ? 'Log Out of Device?' : 'Log Out of Other Devices?'}
                </h3>
                <p className="mt-2 mb-0 text-[13px] leading-[1.5] text-text-secondary">
                  {confirmTarget.type === 'single' ? (
                    <>
                      Are you sure you want to log out of <strong className="font-bold text-text-primary">{confirmTarget.label}</strong>?
                      The user on that device will be signed out immediately.
                    </>
                  ) : (
                    'Are you sure you want to log out of all other active sessions? You will remain signed in only on this device.'
                  )}
                </p>
              </div>

              <div className="mt-2 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmTarget(null)}
                  className="flex-1 cursor-pointer rounded-xl border-[1.5px] border-border-default bg-bg-tertiary py-3 text-[14px] font-bold text-text-secondary transition-all duration-150 ease-in-out hover:bg-bg-elevated"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmTarget.type === 'single') {
                      executeRevokeSession(confirmTarget.id);
                    } else {
                      executeRevokeOthers();
                    }
                  }}
                  className="flex-1 cursor-pointer rounded-xl border-none bg-[#6a6a6a] py-3 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(104,104,104,0.2)] transition-all duration-150 ease-in-out hover:bg-[#4d4d4d]"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Info Alert */}
              <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-[rgba(85,85,85,0.16)] bg-[rgba(85,85,85,0.08)] p-4">
                <Shield size={20} color="var(--accent-light)" className="mt-[2px] shrink-0" />
                <div className="text-[13px] leading-[1.5] text-text-secondary">
                  <strong className="font-bold text-text-primary">Security Information:</strong>
                  <p className="mt-1 mb-0">
                    These are the devices currently logged into your account. If you see any unrecognized login details, you should immediately revoke the session and update your password.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[rgba(104,104,104,0.16)] bg-[rgba(104,104,104,0.08)] p-[14px]">
                  <AlertTriangle size={18} color="#6a6a6a" className="shrink-0" />
                  <p className="m-0 text-[13px] font-semibold text-[#8e8e8e]">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <RefreshCw size={24} color="var(--accent-primary)" className="animate-spin" />
                  <span className="text-[14px] text-text-muted">Retrieving active sessions...</span>
                  <style jsx global>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                      animation: spin 1s linear infinite;
                    }
                  `}</style>
                </div>
              ) : (
                <>
                  {/* Action Bar */}
                  {sessions.length > 1 && (
                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={requestRevokeOthers}
                        disabled={actionInProgress !== null}
                        className={`inline-flex items-center gap-2 rounded-[10px] border border-[rgba(104,104,104,0.2)] bg-[rgba(104,104,104,0.08)] px-3.5 py-2 text-[12.5px] font-bold text-danger transition-all duration-150 ease-in-out${actionInProgress === null ? ' cursor-pointer hover:bg-[rgba(104,104,104,0.14)]' : ' cursor-wait'}`}
                      >
                        <LogOut size={14} />
                        {actionInProgress === 'all' ? 'Revoking others...' : 'Log out of other devices'}
                      </button>
                    </div>
                  )}

                  {/* Sessions List */}
                  <div className="flex flex-col gap-3">
                    {sessions.map((session) => {
                      const { os, browser, osIcon: Icon } = parseUserAgent(session.user_agent);
                      const isCurrent = session.is_current;
                      const isCurrentAction = actionInProgress === session.id;

                      return (
                        <div
                          key={session.id}
                          className={`relative flex items-center gap-4 rounded-2xl bg-bg-secondary p-4 border ${isCurrent ? 'border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border-default))] shadow-[0_0_12px_rgba(85,85,85,0.06)]' : 'border-border-default shadow-none'}`}
                        >
                          {/* Device Icon */}
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isCurrent ? 'bg-[rgba(85,85,85,0.12)] text-accent-light' : 'bg-[rgba(127,127,127,0.08)] text-text-muted'}`}
                          >
                            <Icon size={22} />
                          </div>

                          {/* Session Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[15px] font-bold text-text-primary">
                                {os} · {browser}
                              </span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-accent-primary px-2 py-0.5 text-[10px] font-bold text-accent-on-primary">
                                  <CheckCircle size={10} />
                                  This device
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-4">
                              <span className="inline-flex items-center gap-[5px] text-[12.5px] text-text-muted">
                                <Globe size={13} className="opacity-80" />
                                {session.ip || 'Unknown IP'}
                              </span>
                              <span className="inline-flex items-center gap-[5px] text-[12.5px] text-text-muted">
                                <Clock size={13} className="opacity-80" />
                                {isCurrent ? 'Active now' : formatRelativeTime(session.updated_at)}
                              </span>
                            </div>
                          </div>

                          {/* Revoke Action */}
                          {!isCurrent && (
                            <button
                              onClick={() => requestRevokeSession(session)}
                              disabled={actionInProgress !== null}
                              title="Log out this device"
                              className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border-none bg-[rgba(104,104,104,0.08)] text-[#6a6a6a] transition-all duration-150 ease-in-out${actionInProgress === null ? ' cursor-pointer hover:bg-[rgba(104,104,104,0.15)]' : ' cursor-wait'}`}
                            >
                              {isCurrentAction ? (
                                <RefreshCw size={16} className="animate-spin" color="#6a6a6a" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty State */}
                  {sessions.length === 0 && (
                    <div className="py-8 text-center text-text-muted">
                      No active sessions found.
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Modal>
  );
}
