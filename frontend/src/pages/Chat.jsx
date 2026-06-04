import { useEffect, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { Link, useLocation } from "react-router-dom";
import {
  FaPaperPlane,
  FaSearch,
  FaReply,
  FaCopy,
  FaShareSquare,
  FaTrash,
  FaTimes,
  FaCheck,
  FaCheckDouble,
  FaForward,
  FaArrowLeft,
} from "react-icons/fa";
import io from "socket.io-client";

import { API_URL } from "../config";
import { mediaUrl } from "../utils/media";

const API = API_URL;
const profileImageSrc = mediaUrl;

// ─── HELPERS ──────────────────────────────────────────────────────

function formatLastSeen(dateStr) {
  if (!dateStr) return "Last seen recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
  return `Last seen ${Math.floor(diff / 86400)}d ago`;
}

function MessageStatusIcon({ status, isOwn }) {
  if (!isOwn) return null;
  if (status === "seen")
    return <FaCheckDouble className="text-cyan-300" title="Seen" />;
  if (status === "delivered")
    return <FaCheckDouble className="text-gray-400" title="Delivered" />;
  return <FaCheck className="text-gray-500" title="Sent" />;
}

function LinkifiedText({ text }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s]+)/g);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, index) =>
        /^https?:\/\/[^\s]+$/.test(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="font-bold underline decoration-white/50 underline-offset-4 hover:decoration-white"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </p>
  );
}

// ─── FORWARD MODAL ────────────────────────────────────────────────

function ForwardModal({ users, onForward, onClose }) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-80 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl">Forward to</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => toggle(u._id)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                selected.includes(u._id)
                  ? "bg-cyan-500/20 border border-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-white">
                {u.fullName?.charAt(0)}
              </div>
              <span className="text-white font-medium">{u.fullName}</span>
              {selected.includes(u._id) && (
                <FaCheck className="ml-auto text-cyan-400" />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => selected.length > 0 && onForward(selected)}
          disabled={selected.length === 0}
          className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
        >
          Forward {selected.length > 0 ? `(${selected.length})` : ""}
        </button>
      </div>
    </div>
  );
}

// ─── CONTEXT MENU ─────────────────────────────────────────────────

function ContextMenu({ x, y, message, isOwn, onClose, onReply, onCopy, onUnsend, onForward }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    { icon: <FaReply />, label: "Reply", action: onReply },
    { icon: <FaCopy />, label: "Copy", action: onCopy },
    { icon: <FaForward />, label: "Forward", action: onForward },
    ...(isOwn && !message.unsent
      ? [{ icon: <FaTrash />, label: "Unsend", action: onUnsend, danger: true }]
      : []),
  ];

  // clamp so menu doesn't overflow viewport
  const menuStyle = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 200),
    left: Math.min(x, window.innerWidth - 180),
    zIndex: 1000,
  };

  return (
    <div
      ref={ref}
      style={menuStyle}
      className="mentora-menu bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[160px] animate-in fade-in zoom-in duration-150"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
            item.danger ? "text-red-400" : "text-white"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ConversationMenu({ x, y, user, onClose, onDelete }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: Math.min(y, window.innerHeight - 90),
        left: Math.min(x, window.innerWidth - 190),
        zIndex: 1000,
      }}
      className="mentora-menu bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[180px]"
    >
      <button
        type="button"
        onClick={() => {
          onDelete(user);
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
      >
        <FaTrash size={12} /> Delete chat
      </button>
    </div>
  );
}

// ─── REPLY PREVIEW ────────────────────────────────────────────────

function ReplyPreview({ message, currentUserId, onCancel }) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-3 bg-white/5 border-l-4 border-cyan-400 px-4 py-2 mx-6 mb-2 rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="text-cyan-400 text-xs font-semibold mb-0.5">
          {message.senderId === currentUserId ? "You" : "Them"}
        </p>
        <p className="text-gray-300 text-sm truncate">
          {message.unsent ? "This message was unsent" : message.text}
        </p>
      </div>
      <button onClick={onCancel} className="text-gray-400 hover:text-white shrink-0">
        <FaTimes size={14} />
      </button>
    </div>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────

function MessageBubble({ msg, isOwn, currentUser, onContextMenu }) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
      <div
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, msg); }}
        className={`max-w-[86%] md:max-w-[62%] rounded-2xl shadow-lg cursor-context-menu select-none ${
          isOwn
            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm"
            : "bg-white/10 backdrop-blur-xl text-white rounded-bl-sm"
        }`}
      >
        {/* Forwarded label */}
        {msg.isForwarded && (
          <div className="flex items-center gap-1 px-4 pt-3 pb-1 text-xs text-white/60">
            <FaShareSquare size={10} />
            <span>Forwarded</span>
          </div>
        )}

        {/* Reply quote */}
        {msg.replyTo && !msg.replyTo.unsent && (
          <div
            className={`mx-3 mt-3 px-3 py-2 rounded-xl text-xs ${
              isOwn ? "bg-black/20" : "bg-white/10"
            }`}
          >
            <p className="font-semibold text-cyan-200 mb-0.5">
              {msg.replyTo.senderId === currentUser._id ? "You" : "Them"}
            </p>
            <p className="text-white/70 truncate">{msg.replyTo.text}</p>
          </div>
        )}

        {/* Message text */}
        <div className="px-4 py-2.5">
          {msg.unsent ? (
            <p className="text-sm italic opacity-60">This message was unsent</p>
          ) : (
            <LinkifiedText text={msg.text} />
          )}

          {/* Time + status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className="text-[10px] opacity-60">{time}</span>
            {isOwn && !msg.unsent && currentUser.preferences?.readReceipts !== false && (
              <span className="text-[11px]">
                <MessageStatusIcon status={msg.status} isOwn={isOwn} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CHAT COMPONENT ──────────────────────────────────────────

function Chat() {
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const savedPrefs = JSON.parse(localStorage.getItem("preferences") || "{}");
  currentUser.preferences = { ...(currentUser.preferences || {}), ...savedPrefs };

  const [users, setUsers] = useState([]);
  const [searchableUsers, setSearchableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, message }
  const [conversationMenu, setConversationMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);   // message to forward
  const [isTyping, setIsTyping] = useState(false);      // other person typing
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);
  const searchableUsersRef = useRef([]);
  const openedFromStateRef = useRef("");
  const refreshBadges = () =>
    window.dispatchEvent(new Event("mentora:refresh-badges"));

  // keep ref in sync so socket callbacks have current value
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { searchableUsersRef.current = searchableUsers; }, [searchableUsers]);

  // ── SOCKET SETUP ───────────────────────────────────────────────
  useEffect(() => {
    socketRef.current = io(API, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
    });
    socketRef.current.emit("join", currentUser._id);

    // receive new message
    socketRef.current.on("receiveMessage", (message) => {
      const active = selectedUserRef.current;
      if (
        active &&
        (message.senderId === active._id || message.receiverId === active._id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // auto-mark seen if chat is open
        socketRef.current.emit("messageSeen", {
          senderId: message.senderId,
          receiverId: currentUser._id,
        });
        refreshBadges();
      }

      // update sidebar last message
      setUsers((prevUsers) => {
        let changedUser = null;
        const updated = prevUsers.map((u) => {
          if (u._id === message.senderId || u._id === message.receiverId) {
            const isActive = active?._id === u._id;
            const isIncoming = message.senderId === u._id;
            changedUser = {
              ...u,
              hiddenChat: false,
              lastMessage: message.unsent ? "This message was unsent" : message.text,
              unreadCount: isIncoming && !isActive ? (u.unreadCount || 0) + 1 : 0,
              updatedAt: new Date(),
            };
            return changedUser;
          }
          return u;
        });
        if (!changedUser) {
          const restored = searchableUsersRef.current.find(
            (u) => u._id === message.senderId || u._id === message.receiverId
          );
          if (restored) {
            updated.unshift({
              ...restored,
              hiddenChat: false,
              lastMessage: message.unsent ? "This message was unsent" : message.text,
              unreadCount: message.senderId === restored._id ? 1 : 0,
              updatedAt: new Date(),
            });
          }
        }
        updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return updated;
      });
      setSearchableUsers((prevUsers) => {
        const updated = prevUsers.map((u) => {
          if (u._id === message.senderId || u._id === message.receiverId) {
            const isActive = active?._id === u._id;
            const isIncoming = message.senderId === u._id;
            return {
              ...u,
              hiddenChat: false,
              lastMessage: message.unsent ? "This message was unsent" : message.text,
              unreadCount: isIncoming && !isActive ? (u.unreadCount || 0) + 1 : 0,
              updatedAt: new Date(),
            };
          }
          return u;
        });
        updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return updated;
      });
    });

    // status updates (delivered / seen)
    socketRef.current.on("messageStatusUpdate", ({ receiverId, status, messageId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (messageId) return m._id === messageId ? { ...m, status } : m;
          // bulk update: all messages from me to that receiver
          if (m.senderId === currentUser._id && m.receiverId === receiverId) {
            return { ...m, status };
          }
          return m;
        })
      );
    });

    // bulk delivered (when receiver comes online)
    socketRef.current.on("messagesDelivered", ({ toReceiverId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.receiverId === toReceiverId && m.status === "sent"
            ? { ...m, status: "delivered" }
            : m
        )
      );
    });

    // unsend from other side
    socketRef.current.on("messageUnsent", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, unsent: true, text: "" } : m
        )
      );
    });

    // online users list
    socketRef.current.on("onlineUsers", (onlineIds) => {
      setUsers((prev) =>
        prev.map((u) => ({ ...u, isOnline: onlineIds.includes(u._id) }))
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, isOnline: onlineIds.includes(prev._id) } : prev
      );
    });

    // typing
    socketRef.current.on("typing", ({ senderId }) => {
      if (selectedUserRef.current?._id === senderId) setIsTyping(true);
    });
    socketRef.current.on("stopTyping", ({ senderId }) => {
      if (selectedUserRef.current?._id === senderId) setIsTyping(false);
    });

    return () => { socketRef.current.disconnect(); };
  }, [currentUser._id]);

  // ── FETCH USERS ────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/users/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const searchRes = await fetch(`${API}/api/users/connections?includeHidden=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const searchData = await searchRes.json();
      if (!Array.isArray(data)) { setUsers([]); setSearchableUsers([]); return; }
      const filtered = data.filter((u) => u?._id && u._id !== currentUser._id);
      filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      const searchable = Array.isArray(searchData)
        ? searchData.filter((u) => u?._id && u._id !== currentUser._id)
        : filtered;
      searchable.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setUsers(filtered);
      setSearchableUsers(searchable);
    } catch (err) {
      console.log(err);
      setUsers([]);
      setSearchableUsers([]);
    }
  }, [currentUser._id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  // ── FETCH MESSAGES ─────────────────────────────────────────────
  const fetchMessages = async (userId) => {
    try {
      const res = await fetch(`${API}/api/messages/${currentUser._id}/${userId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);

      // mark as seen
      await fetch(`${API}/api/messages/seen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId, receiverId: currentUser._id }),
      });

      socketRef.current.emit("messageSeen", {
        senderId: userId,
        receiverId: currentUser._id,
      });
      refreshBadges();
    } catch (err) {
      console.log(err);
    }
  };

  // ── SELECT USER ────────────────────────────────────────────────
  const selectUser = (user) => {
    const cleanUser = { ...user, unreadCount: 0 };
    setSelectedUser(cleanUser);
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, unreadCount: 0 } : u))
    );
    fetchMessages(user._id);
    setReplyingTo(null);
    setIsTyping(false);
  };

  // ── SEND MESSAGE ───────────────────────────────────────────────
  useEffect(() => {
    const userId = location.state?.userId;
    if (!userId || openedFromStateRef.current === userId) return;

    const target = users.find((user) => user._id === userId);
    if (target) {
      openedFromStateRef.current = userId;
      const id = window.setTimeout(() => selectUser(target), 0);
      return () => window.clearTimeout(id);
    }

    if (location.state?.user?._id) {
      openedFromStateRef.current = userId;
      const stateUser = location.state.user;
      const id = window.setTimeout(() => {
        setUsers((prev) => (
          prev.some((user) => user._id === stateUser._id) ? prev : [stateUser, ...prev]
        ));
        setSearchableUsers((prev) => (
          prev.some((user) => user._id === stateUser._id) ? prev : [stateUser, ...prev]
        ));
        selectUser(stateUser);
      }, 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, users]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const body = {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
        text: newMessage.trim(),
        replyTo: replyingTo?._id || null,
      };

      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const saved = await res.json();

      setMessages((prev) => [...prev, saved]);

      socketRef.current.emit("sendMessage", saved);
      socketRef.current.emit("stopTyping", {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
      });

      // update sidebar
      setUsers((prev) => {
        const exists = prev.some((u) => u._id === selectedUser._id);
        const updated = exists
          ? prev.map((u) =>
              u._id === selectedUser._id
                ? { ...u, lastMessage: saved.text, unreadCount: 0, updatedAt: new Date() }
                : u
            )
          : [{ ...selectedUser, lastMessage: saved.text, unreadCount: 0, updatedAt: new Date() }, ...prev];
        updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return updated;
      });
      setSearchableUsers((prev) => {
        const exists = prev.some((u) => u._id === selectedUser._id);
        const updated = exists
          ? prev.map((u) =>
              u._id === selectedUser._id
                ? { ...u, hiddenChat: false, lastMessage: saved.text, unreadCount: 0, updatedAt: new Date() }
                : u
            )
          : [{ ...selectedUser, hiddenChat: false, lastMessage: saved.text, unreadCount: 0, updatedAt: new Date() }, ...prev];
        updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return updated;
      });

      setNewMessage("");
      setReplyingTo(null);
    } catch (err) {
      console.log(err);
    }
  };

  // ── TYPING EVENTS ──────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedUser) return;

    socketRef.current.emit("typing", {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
    });

    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        socketRef.current.emit("stopTyping", {
          senderId: currentUser._id,
          receiverId: selectedUser._id,
        });
      }, 1500)
    );
  };

  // ── UNSEND ─────────────────────────────────────────────────────
  const handleUnsend = async (msg) => {
    try {
      await fetch(`${API}/api/messages/unsend/${msg._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id }),
      });

      socketRef.current.emit("unsendMessage", {
        messageId: msg._id,
        senderId: currentUser._id,
        receiverId: selectedUser._id,
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, unsent: true, text: "" } : m))
      );
    } catch (err) {
      console.log(err);
    }
  };

  // ── FORWARD ────────────────────────────────────────────────────
  const handleForward = async (receiverIds) => {
    try {
      const res = await fetch(`${API}/api/messages/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalMessageId: forwardMsg._id,
          senderId: currentUser._id,
          receiverIds,
        }),
      });

      const forwarded = await res.json();

      // if forwarding to current chat, add to messages
      const toCurrentChat = forwarded.find((m) => m.receiverId === selectedUser?._id);
      if (toCurrentChat) {
        setMessages((prev) => [...prev, toCurrentChat]);
        socketRef.current.emit("sendMessage", toCurrentChat);
      }

      setForwardMsg(null);
    } catch (err) {
      console.log(err);
    }
  };

  // ── COPY ───────────────────────────────────────────────────────
  const handleCopy = (msg) => {
    if (!msg.unsent) navigator.clipboard.writeText(msg.text);
  };

  // ── CONTEXT MENU ───────────────────────────────────────────────
  const openContextMenu = (e, msg) => {
    setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
  };

  const deleteConversation = async () => {
    if (!deleteTarget) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/api/messages/conversation/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((user) => user._id !== deleteTarget._id));
      setSearchableUsers((prev) =>
        prev.map((user) =>
          user._id === deleteTarget._id
            ? { ...user, hiddenChat: true, lastMessage: "", unreadCount: 0 }
            : user
        )
      );
      if (selectedUser?._id === deleteTarget._id) {
        setSelectedUser(null);
        setMessages([]);
      }
      setDeleteTarget(null);
      refreshBadges();
    } catch (err) {
      console.log(err);
    }
  };

  // ── AUTO SCROLL ────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const listSource = search.trim() ? searchableUsers : users;
  const filteredUsers = listSource.filter(
    (u) => u?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const canShowOnline = (user) => user?.preferences?.showOnlineStatus !== false;

  // ─── RENDER ──────────────────────────────────────────────────────

  return (
    <Layout>
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          isOwn={contextMenu.message.senderId === currentUser._id}
          onClose={() => setContextMenu(null)}
          onReply={() => setReplyingTo(contextMenu.message)}
          onCopy={() => handleCopy(contextMenu.message)}
          onUnsend={() => handleUnsend(contextMenu.message)}
          onForward={() => setForwardMsg(contextMenu.message)}
        />
      )}

      {conversationMenu && (
        <ConversationMenu
          x={conversationMenu.x}
          y={conversationMenu.y}
          user={conversationMenu.user}
          onClose={() => setConversationMenu(null)}
          onDelete={setDeleteTarget}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="mentora-menu bg-slate-900 border border-white/10 rounded-[28px] p-7 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2">Delete chat?</h2>
            <p className="text-gray-400 text-sm mb-7">
              This will remove your conversation with {deleteTarget.fullName} from your chat list.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-2xl font-bold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteConversation}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 px-4 py-3 rounded-2xl font-black text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardMsg && (
        <ForwardModal
          users={users}
          onForward={handleForward}
          onClose={() => setForwardMsg(null)}
        />
      )}

      <div className="h-[calc(100vh-2.5rem)] md:h-[92vh] flex rounded-2xl md:rounded-[35px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl">

        {/* ── LEFT SIDEBAR ── */}
        <div className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-[350px] border-r border-white/10 flex-col`}>

          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Messages
            </h1>

            <div className="mt-6 flex items-center bg-white/10 rounded-2xl px-4 py-3">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Search people"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none ml-3 text-white w-full placeholder-gray-400"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => selectUser(user)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setConversationMenu({ x: e.clientX, y: e.clientY, user });
                  }}
                  className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 ${
                    selectedUser?._id === user._id
                      ? "bg-cyan-500/20 border border-cyan-400/30"
                      : user.unreadCount > 0
                      ? "bg-white/15 border border-cyan-400/20"
                      : "hover:bg-white/10"
                  }`}
                >
                  {/* Avatar + online dot */}
                  <div className="relative shrink-0">
                    {user.profileImage || user.profilePicture ? (
                      <img
                        src={profileImageSrc(user.profileImage || user.profilePicture)}
                        alt={user.fullName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black text-white">
                        {user.fullName?.charAt(0)}
                      </div>
                    )}
                    {canShowOnline(user) && (
                      <div
                        className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          user.isOnline ? "bg-green-400" : "bg-gray-500"
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h2 className={`truncate ${user.unreadCount > 0 ? "font-black text-white" : "font-bold text-white"}`}>
                        {user.fullName}
                      </h2>
                      {user.unreadCount > 0 && (
                        <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                          {user.unreadCount > 9 ? "9+" : user.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${user.unreadCount > 0 ? "font-black text-white" : "text-gray-400"}`}>
                      {user.lastMessage
                        ? user.lastMessage
                        : canShowOnline(user) && user.isOnline
                        ? "Online"
                        : "Start conversation"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 mt-10">No users found</div>
            )}
          </div>
        </div>

        {/* ── RIGHT CHAT PANEL ── */}
        <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3 md:p-5 border-b border-white/10 flex items-center gap-3 md:gap-4 bg-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white"
                  title="Back to chats"
                >
                  <FaArrowLeft />
                </button>
                <div className="relative shrink-0">
                  <Link to={`/profile/${selectedUser._id}`}>
                    {selectedUser.profileImage || selectedUser.profilePicture ? (
                      <img
                        src={profileImageSrc(selectedUser.profileImage || selectedUser.profilePicture)}
                        alt={selectedUser.fullName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black text-white">
                        {selectedUser.fullName?.charAt(0)}
                      </div>
                    )}
                  </Link>
                  {canShowOnline(selectedUser) && (
                    <div
                      className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                        selectedUser.isOnline ? "bg-green-400" : "bg-gray-500"
                      }`}
                    />
                  )}
                </div>

                <div>
                  <Link to={`/profile/${selectedUser._id}`} className="text-lg md:text-2xl font-black text-white hover:text-cyan-300">
                    {selectedUser.fullName}
                  </Link>
                  <p className="text-cyan-300 text-sm">
                    {isTyping
                      ? "Typing..."
                      : canShowOnline(selectedUser) && selectedUser.isOnline
                      ? "Active now"
                      : formatLastSeen(selectedUser.lastSeen)}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 bg-gradient-to-b from-transparent to-black/10">
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === currentUser._id;
                  return (
                    <MessageBubble
                      key={msg._id || i}
                      msg={msg}
                      isOwn={isOwn}
                      currentUser={currentUser}
                      onContextMenu={openContextMenu}
                    />
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-xl px-5 py-3 rounded-[24px] rounded-bl-md">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview */}
              <ReplyPreview
                message={replyingTo}
                currentUserId={currentUser._id}
                onCancel={() => setReplyingTo(null)}
              />

              {/* Input */}
              <div className="p-3 md:p-5 border-t border-white/10 bg-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Message…"
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-2xl px-4 md:px-5 py-3 md:py-3.5 outline-none text-white placeholder-gray-400 focus:border-cyan-400/40 transition-colors"
                  />

                  <button
                    onClick={sendMessage}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-xl shrink-0"
                  >
                    <FaPaperPlane className="text-white text-lg" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
              <FaPaperPlane className="text-5xl opacity-20" />
              <p className="text-xl font-semibold">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Chat;
