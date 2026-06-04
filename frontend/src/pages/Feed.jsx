import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaHeart, FaRegHeart, FaComment, FaShare,
  FaImage, FaVideo, FaEllipsisH, FaPaperPlane, FaTrash, FaTimes, FaCheck,
} from "react-icons/fa";

import { API_URL } from "../config";

const API = API_URL;
const profileImageSrc = (src) =>
  src?.startsWith("http") ? src : `${API}/uploads/${src}`;

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ user, size = "md", linked = false }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  const src = user?.profileImage || user?.profilePicture;
  const body = src ? (
    <img src={profileImageSrc(src)} alt="" className={`${sz} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${sz} rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-slate-900 shrink-0`}>
      {user?.fullName?.charAt(0)}
    </div>
  );

  if (linked && user?._id) {
    return <Link to={`/profile/${user._id}`} className="shrink-0">{body}</Link>;
  }

  return body;
}

function PostMedia({ post }) {
  const media = Array.isArray(post.media) && post.media.length
    ? post.media
    : post.image
    ? [{ url: post.image, type: "image" }]
    : [];

  if (!media.length) return null;

  return (
    <div className="px-4 pb-3 grid gap-3">
      {media.map((item, index) =>
        item.type === "video" ? (
          <video
            key={`${item.url}-${index}`}
            src={item.url}
            className="w-full rounded-2xl object-cover max-h-96 bg-black"
            controls
          />
        ) : (
          <img
            key={`${item.url}-${index}`}
            src={item.url}
            alt=""
            className="w-full rounded-2xl object-cover max-h-80"
          />
        )
      )}
    </div>
  );
}

function ShareModal({ post, connections, currentUser, onSend, onClose }) {
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const send = async () => {
    if (selected.length === 0) return;
    setSending(true);
    await onSend(selected);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md max-h-[82vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-xl font-black text-white">Share post</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/10">
          <div className="bg-white/5 rounded-2xl p-3">
            <p className="text-xs text-gray-500 mb-1">
              {post.user?.fullName || "Mentora user"} posted
            </p>
            <p className="text-sm text-gray-200 line-clamp-3">{post.content}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {connections.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              Connect with people first to share posts in chat.
            </p>
          ) : (
            connections.map((user) => {
              const active = selected.includes(user._id);

              return (
                <button
                  type="button"
                  key={user._id}
                  onClick={() => toggle(user._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                    active
                      ? "bg-cyan-400/15 border border-cyan-400/30"
                      : "hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || user.role}</p>
                  </div>
                  {active && <FaCheck className="text-cyan-300" />}
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={send}
            disabled={selected.length === 0 || sending}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : selected.length
              ? `Send to ${selected.length}`
              : `Send as ${currentUser?.fullName?.split(" ")[0] || "you"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────
function PostCard({
  post,
  currentUser,
  currentUserId,
  onLike,
  onComment,
  onDeleteComment,
  onShare,
  onDelete,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const isOwn = post.user?._id === currentUserId;
  const liked = post.likes?.includes(currentUserId);
  const likeCount = post.likes?.length || 0;
  const comments = post.comments || [];
  const shares = post.shares || [];
  const commentCount = comments.length;
  const shareCount = shares.length;

  const submitComment = async () => {
    const clean = commentText.trim();
    if (!clean) return;

    setCommenting(true);
    const ok = await onComment(post._id, clean);
    if (ok) {
      setCommentText("");
      setShowComments(true);
    }
    setCommenting(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar user={post.user} size="md" linked />
          <div>
            <Link to={`/profile/${post.user?._id}`} className="font-bold text-white text-sm leading-none hover:text-cyan-300">
              {post.user?.fullName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {post.user?.role && (
                <span className="text-[10px] text-cyan-400/80 font-semibold">{post.user.role}</span>
              )}
              <span className="text-gray-600 text-[10px]">·</span>
              <span className="text-gray-500 text-[10px]">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {isOwn && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-white p-1 rounded-full transition-colors">
              <FaEllipsisH size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[120px] z-10">
                <button onClick={() => { onDelete(post._id); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 text-sm transition-colors">
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      <PostMedia post={post} />

      {/* Stats row */}
      {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
        <div className="px-4 pb-2 flex items-center justify-between text-gray-500 text-xs">
          <p>{likeCount} {likeCount === 1 ? "like" : "likes"}</p>
          <p>
            {commentCount > 0 && `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
            {commentCount > 0 && shareCount > 0 ? " · " : ""}
            {shareCount > 0 && `${shareCount} ${shareCount === 1 ? "share" : "shares"}`}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-white/5 px-2 py-1 flex items-center gap-1">
        <button onClick={() => onLike(post._id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
            liked ? "text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}>
          {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
          <span className="text-xs">Like</span>
        </button>

        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex-1 justify-center">
          <FaComment size={13} />
          <span className="text-xs">Comment</span>
        </button>

        <button onClick={() => onShare(post)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex-1 justify-center">
          <FaShare size={13} />
          <span className="text-xs">Share</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <Avatar user={currentUser} size="sm" />
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={commenting || !commentText.trim()}
                className="text-cyan-300 disabled:opacity-40"
                title="Post comment"
              >
                <FaPaperPlane size={12} />
              </button>
            </div>
          </div>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-xs pl-10">Be the first to comment.</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => {
                const canDelete =
                  comment.user?._id === currentUserId || post.user?._id === currentUserId;

                return (
                  <div key={comment._id} className="flex items-start gap-2">
                    <Avatar user={comment.user} size="sm" linked />
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/5 rounded-2xl px-3 py-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <Link to={`/profile/${comment.user?._id}`} className="text-white text-xs font-bold hover:text-cyan-300">
                              {comment.user?.fullName || "Mentora user"}
                            </Link>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                          </div>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(post._id, comment._id)}
                              className="text-gray-600 hover:text-red-400"
                              title="Delete comment"
                            >
                              <FaTrash size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-[10px] mt-0.5 ml-2">
                        {timeAgo(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CREATE POST BOX ──────────────────────────────────────────────
function CreatePostBox({ currentUser, onPosted }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const textRef = useRef(null);
  const mediaPreviewRef = useRef("");

  useEffect(() => {
    return () => {
      if (mediaPreviewRef.current) {
        URL.revokeObjectURL(mediaPreviewRef.current);
      }
    };
  }, []);

  const chooseMedia = (file) => {
    if (mediaPreviewRef.current) {
      URL.revokeObjectURL(mediaPreviewRef.current);
    }

    const url = URL.createObjectURL(file);
    mediaPreviewRef.current = url;
    setMediaFile(file);
    setMediaPreview(url);
  };

  const removeMedia = () => {
    if (mediaPreviewRef.current) {
      URL.revokeObjectURL(mediaPreviewRef.current);
      mediaPreviewRef.current = "";
    }
    setMediaFile(null);
    setMediaPreview("");
  };

  const submit = async () => {
    if (!content.trim() && !mediaFile) return;
    setLoading(true);
    try {
      let media = [];

      if (mediaFile) {
        const fd = new FormData();
        fd.append("media", mediaFile);
        const upload = await axios.post(`${API}/api/posts/upload-media`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        media = [upload.data];
      }

      await axios.post(`${API}/api/posts`, { content, media }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContent("");
      removeMedia();
      onPosted();
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <Avatar user={currentUser} size="md" />
        <div className="flex-1">
          <textarea
            ref={textRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) submit(); }}
            placeholder={`What's on your mind, ${currentUser?.fullName?.split(" ")[0]}?`}
            rows={content ? 3 : 1}
            className="w-full bg-transparent text-white placeholder-gray-600 outline-none text-sm resize-none leading-relaxed"
          />
          {mediaPreview && (
            <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              {mediaFile?.type.startsWith("video/") ? (
                <video src={mediaPreview} className="w-full max-h-72 object-cover bg-black" controls />
              ) : (
                <img src={mediaPreview} alt="" className="w-full max-h-72 object-cover" />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                title="Remove media"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}
          {(content || mediaFile) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <label className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 text-xs transition-colors cursor-pointer">
                {mediaFile?.type.startsWith("video/") ? <FaVideo size={13} /> : <FaImage size={13} />}
                Photo / Video
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files[0] && chooseMedia(e.target.files[0])}
                />
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${content.length > 280 ? "text-red-400" : "text-gray-600"}`}>
                  {content.length}/500
                </span>
                <button onClick={() => { setContent(""); removeMedia(); }}
                  className="text-gray-600 hover:text-white text-xs px-2 py-1 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={submit} disabled={loading || (!content.trim() && !mediaFile) || content.length > 500}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-black text-xs px-4 py-1.5 rounded-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {loading ? "Posting…" : <><FaPaperPlane size={10} /> Post</>}
                </button>
              </div>
            </div>
          )}
          {!content && !mediaFile && (
            <label className="inline-flex items-center gap-2 mt-3 text-gray-500 hover:text-cyan-400 text-xs transition-colors cursor-pointer">
              <FaImage size={13} /> Add photo or video
              <input
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={(e) => e.target.files[0] && chooseMedia(e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN FEED ────────────────────────────────────────────────────
export default function Feed() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [sharePost, setSharePost] = useState(null);
  const [loading, setLoading] = useState(true);

  const replacePost = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get(`${API}/api/users/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async (postId) => {
    try {
      const res = await axios.put(`${API}/api/posts/like/${postId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.post) replacePost(res.data.post);
    } catch (err) { console.log(err); }
  };

  const handleComment = async (postId, text) => {
    try {
      const res = await axios.post(
        `${API}/api/posts/comment/${postId}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      replacePost(res.data);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await axios.delete(`${API}/api/posts/${postId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      replacePost(res.data);
    } catch (err) { console.log(err); }
  };

  const handleShare = (post) => {
    setSharePost(post);
  };

  const sendSharedPost = async (receiverIds) => {
    if (!sharePost) return;

    try {
      const postUrl = `${window.location.origin}/profile/${sharePost.user?._id}`;
      const text = `Shared a Mentora post from ${sharePost.user?.fullName || "someone"}:\n\n${sharePost.content}\n\n${postUrl}`;

      await Promise.all(
        receiverIds.map((receiverId) =>
          axios.post(`${API}/api/messages`, {
            senderId: currentUser._id,
            receiverId,
            text,
          })
        )
      );

      const res = await axios.post(`${API}/api/posts/share/${sharePost._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      replacePost(res.data);
      setSharePost(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) { console.log(err); }
  };

  return (
    <Layout>
      {sharePost && (
        <ShareModal
          post={sharePost}
          connections={connections}
          currentUser={currentUser}
          onSend={sendSharedPost}
          onClose={() => setSharePost(null)}
        />
      )}
      <div className="max-w-xl mx-auto py-4 space-y-4">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Explore
          </h1>
          <p className="text-gray-600 text-xs mt-0.5">See what others are sharing</p>
        </div>

        {/* Create post */}
        <CreatePostBox currentUser={currentUser} onPosted={fetchPosts} />

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3 bg-white/10 rounded-full" />
                    <div className="w-16 h-2 bg-white/5 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-white/10 rounded-full" />
                  <div className="w-4/5 h-3 bg-white/10 rounded-full" />
                  <div className="w-3/5 h-3 bg-white/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🌐</div>
            <p className="text-gray-400 font-semibold">No posts yet</p>
            <p className="text-gray-600 text-sm mt-1">When others post, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                currentUserId={currentUser._id}
                onLike={handleLike}
                onComment={handleComment}
                onDeleteComment={handleDeleteComment}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
