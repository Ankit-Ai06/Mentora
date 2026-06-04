import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import {
  FaBriefcase,
  FaCamera,
  FaCertificate,
  FaCheck,
  FaEdit,
  FaGithub,
  FaGlobe,
  FaGraduationCap,
  FaHeart,
  FaHandsHelping,
  FaLinkedin,
  FaLock,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPlus,
  FaRegHeart,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUserPlus,
  FaUserMinus,
} from "react-icons/fa";
import { API_URL } from "../config";

const API = API_URL;

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function imageSrc(src) {
  if (!src) return "";
  return src.startsWith("http") ? src : `${API}/uploads/${src}`;
}

function asObjectArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item))
    : [];
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-cyan-400 text-sm">{icon}</span>
      <h3 className="font-black text-white text-sm uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="text-gray-500 text-sm">{children}</p>;
}

function PostMedia({ post }) {
  const media = Array.isArray(post.media) && post.media.length
    ? post.media
    : post.image
    ? [{ url: post.image, type: "image" }]
    : [];

  if (!media.length) return null;

  return (
    <div className="mt-4 grid gap-3">
      {media.map((item, index) =>
        item.type === "video" ? (
          <video
            key={`${item.url}-${index}`}
            src={item.url}
            className="w-full max-h-96 rounded-2xl bg-black object-cover"
            controls
          />
        ) : (
          <img
            key={`${item.url}-${index}`}
            src={item.url}
            alt=""
            className="w-full max-h-96 object-cover rounded-2xl"
          />
        )
      )}
    </div>
  );
}

function EditInput({ value, onChange, placeholder, multiline = false }) {
  const className =
    "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-cyan-400/50 transition-colors";

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`${className} resize-none`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

function PostCard({ post, currentUserId, onDelete }) {
  const liked = post.likes?.includes(currentUserId);
  const isOwn = post.user?._id === currentUserId || post.user === currentUserId;
  const commentCount = post.comments?.length || 0;
  const shareCount = post.shares?.length || 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {isOwn && (
          <button
            type="button"
            onClick={() => onDelete(post._id)}
            className="text-gray-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10"
            title="Delete post"
          >
            <FaTrash size={13} />
          </button>
        )}
      </div>
      <PostMedia post={post} />
      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-white/5">
        <span className="flex items-center gap-1">
          {liked ? <FaHeart className="text-red-400" /> : <FaRegHeart />}
          {post.likes?.length || 0}
        </span>
        <span>
          {commentCount} comments · {shareCount} shares
        </span>
        <span>{timeAgo(post.createdAt)}</span>
      </div>
    </Card>
  );
}

export default function Profile() {
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const isOwn = !id || id === currentUser._id;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("about");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [form, setForm] = useState({
    headline: "",
    location: "",
    about: "",
    github: "",
    linkedin: "",
    portfolio: "",
    skills: [],
    education: [],
    experience: [],
    achievements: [],
    mentorshipAvailable: false,
  });
  const [newSkill, setNewSkill] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const syncForm = (data) => {
    setForm({
      headline: data.headline || "",
      location: data.location || "",
      about: data.about || data.bio || "",
      github: data.github || data.socialLinks?.github || "",
      linkedin: data.linkedin || data.socialLinks?.linkedin || "",
      portfolio: data.socialLinks?.portfolio || "",
      skills: Array.isArray(data.skills) ? data.skills.filter((s) => typeof s === "string") : [],
      education: asObjectArray(data.education),
      experience: asObjectArray(data.experience),
      achievements: asObjectArray(data.achievements),
      mentorshipAvailable: !!data.mentorshipAvailable,
    });
  };

  const loadProfile = async () => {
    try {
      if (isOwn) {
        const [profileRes, postRes] = await Promise.all([
          axios.get(`${API}/api/profile`, { headers }),
          axios.get(`${API}/api/posts/mine`, { headers }),
        ]);
        setProfile({ ...profileRes.data, canViewFullProfile: true });
        setPosts(Array.isArray(postRes.data) ? postRes.data : []);
        syncForm(profileRes.data);
      } else {
        const res = await axios.get(`${API}/api/profile/${id}`, { headers });
        setProfile(res.data);
        setPosts(Array.isArray(res.data.posts) ? res.data.posts : []);
        if (res.data.canViewFullProfile) syncForm(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${API}/api/profile`,
        {
          headline: form.headline,
          location: form.location,
          about: form.about,
          github: form.github,
          linkedin: form.linkedin,
          socialLinks: {
            github: form.github,
            linkedin: form.linkedin,
            portfolio: form.portfolio,
          },
          skills: form.skills,
          education: form.education.filter((item) => item.college || item.degree || item.year),
          experience: form.experience.filter((item) => item.company || item.position || item.duration),
          achievements: form.achievements.filter((item) => item.title || item.description),
          mentorshipAvailable: form.mentorshipAvailable,
        },
        { headers }
      );
      setProfile({ ...res.data, canViewFullProfile: true });
      localStorage.setItem("user", JSON.stringify(res.data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setTab("about");
    } catch (err) {
      console.log(err);
    }
    setSaving(false);
  };

  const uploadImage = async (file, type) => {
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await axios.post(`${API}/api/profile/upload-${type}`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      const image = res.data.image;
      const payload =
        type === "profile"
          ? { profilePicture: image, profileImage: image }
          : { coverPicture: image, coverImage: image };
      const update = await axios.put(`${API}/api/profile`, payload, { headers });
      setProfile({ ...update.data, canViewFullProfile: true });
      localStorage.setItem("user", JSON.stringify(update.data));
    } catch (err) {
      console.log(err);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill || form.skills.includes(skill)) return;
    setField("skills", [...form.skills, skill]);
    setNewSkill("");
  };

  const updateArray = (key, index, patch) => {
    setField(
      key,
      form[key].map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeArray = (key, index) => {
    setField(
      key,
      form[key].filter((_, i) => i !== index)
    );
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`${API}/api/posts/${postId}`, { headers });
      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      console.log(err);
    }
  };

  const sendRequest = async () => {
    if (!profile?._id) return;
    setRequesting(true);
    try {
      const res = await axios.post(`${API}/api/users/connect/${profile._id}`, {}, { headers });
      setProfile((prev) =>
        res.data.status === "connected"
          ? {
              ...prev,
              requestSent: false,
              isConnected: true,
              connections: [...(prev.connections || []), currentUser._id],
            }
          : {
              ...prev,
              requestSent: true,
              isConnected: false,
            }
      );
    } catch (err) {
      console.log(err);
    }
    setRequesting(false);
  };

  const disconnect = async () => {
    if (!profile?._id) return;
    setRequesting(true);
    try {
      await axios.post(`${API}/api/users/disconnect/${profile._id}`, {}, { headers });
      setProfile((prev) => ({
        ...prev,
        isConnected: false,
        requestSent: false,
        connections: (prev.connections || []).filter((id) => id !== currentUser._id),
      }));
    } catch (err) {
      console.log(err);
    }
    setRequesting(false);
  };

  if (!profile) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center text-gray-500">Loading profile...</div>
      </Layout>
    );
  }

  const cover = imageSrc(profile.coverPicture || profile.coverImage);
  const avatar = imageSrc(profile.profilePicture || profile.profileImage);
  const visible = profile.canViewFullProfile !== false;
  const links = {
    github: profile.github || profile.socialLinks?.github,
    linkedin: profile.linkedin || profile.socialLinks?.linkedin,
    portfolio: profile.socialLinks?.portfolio,
  };
  const mentorConnected = !isOwn && profile.isConnected && profile.mentorshipAvailable;

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto pb-10">
        <div className="relative mb-16">
          <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-white/10">
            {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
            {isOwn && (
              <label className="absolute inset-0 cursor-pointer group">
                <span className="absolute top-4 right-4 bg-black/50 group-hover:bg-black/70 p-3 rounded-xl transition-colors">
                  <FaCamera size={13} className="text-white" />
                </span>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], "cover")}
                />
              </label>
            )}
          </div>

          <div className="absolute -bottom-12 left-5 md:left-8 flex items-end gap-4">
            <div className="relative">
              {isOwn ? (
                <label className="block cursor-pointer group">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt=""
                      className="w-28 h-28 rounded-full border-4 border-slate-950 object-cover bg-slate-900"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full border-4 border-slate-950 bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-black text-slate-950">
                      {profile.fullName?.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-8 h-8 bg-cyan-400 group-hover:bg-cyan-300 rounded-full flex items-center justify-center transition-colors shadow-lg">
                    <FaCamera size={11} className="text-slate-950" />
                  </span>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], "profile")}
                  />
                </label>
              ) : (
                <>
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="w-28 h-28 rounded-full border-4 border-slate-950 object-cover bg-slate-900"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-slate-950 bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-black text-slate-950">
                  {profile.fullName?.charAt(0)}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-5 px-1">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-white">{profile.fullName}</h1>
              {profile.isPrivate && <FaLock className="text-gray-500" title="Private account" />}
              {profile.role && (
                <span className="bg-cyan-400/15 text-cyan-300 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {profile.role}
                </span>
              )}
              {profile.mentorshipAvailable && (
                <span className="inline-flex items-center gap-1 bg-emerald-400/15 text-emerald-300 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  <FaHandsHelping size={11} /> Mentorship available
                </span>
              )}
              {mentorConnected && (
                <span className="bg-cyan-400/15 text-cyan-300 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Mentor connected
                </span>
              )}
            </div>
            {profile.headline && <p className="text-gray-300 mt-2">{profile.headline}</p>}
            {profile.location && (
              <p className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                <FaMapMarkerAlt size={12} /> {profile.location}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {!isOwn && (
              <button
                type="button"
                onClick={profile.isConnected ? disconnect : sendRequest}
                disabled={requesting || profile.requestSent}
                className={`px-5 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60 ${
                  profile.isConnected
                    ? "bg-white/10 border border-white/10 text-white hover:bg-red-500/10 hover:text-red-300"
                    : "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
                }`}
              >
                {profile.isConnected ? <FaUserMinus size={13} /> : <FaUserPlus size={13} />}
                {requesting
                  ? "Working..."
                  : profile.isConnected
                  ? "Connected"
                  : profile.requestSent
                  ? "Request sent"
                  : "Connect"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 md:flex md:items-center gap-3 md:gap-6 border-y border-white/10 py-4 mb-5">
          <div>
            <p className="text-white font-black text-xl">{posts.length}</p>
            <p className="text-gray-600 text-xs">Posts</p>
          </div>
          <div>
            <p className="text-white font-black text-xl">{profile.connections?.length || 0}</p>
            <p className="text-gray-600 text-xs">Connections</p>
          </div>
          <div>
            <p className="text-white font-black text-xl">{profile.profileViews || 0}</p>
            <p className="text-gray-600 text-xs">Profile views</p>
          </div>
          <div className="md:ml-auto col-span-3 flex items-center gap-3">
            {links.github && <a href={links.github} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white"><FaGithub size={19} /></a>}
            {links.linkedin && <a href={links.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-cyan-400"><FaLinkedin size={19} /></a>}
            {links.portfolio && <a href={links.portfolio} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white"><FaGlobe size={18} /></a>}
          </div>
        </div>

        {!visible ? (
          <Card className="text-center py-16">
            <FaLock className="mx-auto text-5xl text-gray-600 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">This account is private</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Connect with {profile.fullName} to see their About section and posts.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-5 max-w-xl">
              {["about", "posts", ...(isOwn ? ["edit"] : [])].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    tab === item
                      ? "bg-gradient-to-r from-cyan-400/20 to-blue-400/20 text-cyan-300 border border-cyan-400/20"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {item === "posts" ? `Posts (${posts.length})` : item === "edit" ? "Edit Profile" : "About"}
                </button>
              ))}
            </div>

            {tab === "about" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                <Card className="h-full">
                  <SectionTitle icon={<FaEdit />} title="About" />
                  {profile.about || profile.bio ? (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.about || profile.bio}</p>
                  ) : (
                    <EmptyText>No about details added yet.</EmptyText>
                  )}
                </Card>
                <Card className="h-full">
                  <SectionTitle icon={<FaBriefcase />} title="Experience" />
                  {asObjectArray(profile.experience).length ? (
                    <div className="space-y-3">
                      {asObjectArray(profile.experience).map((item, index) => (
                        <div key={index} className="border-l-2 border-cyan-400/40 pl-3">
                          <p className="font-bold text-white">{item.position || "Role"}</p>
                          <p className="text-gray-400 text-sm">{item.company}</p>
                          <p className="text-gray-600 text-xs">{item.duration}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>No experience added yet.</EmptyText>
                  )}
                </Card>
                <Card className="h-full">
                  <SectionTitle icon={<FaGraduationCap />} title="Education" />
                  {asObjectArray(profile.education).length ? (
                    <div className="space-y-3">
                      {asObjectArray(profile.education).map((item, index) => (
                        <div key={index}>
                          <p className="font-bold text-white text-sm">{item.degree || "Degree"}</p>
                          <p className="text-gray-400 text-sm">{item.college}</p>
                          <p className="text-gray-600 text-xs">{item.year}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>No education added yet.</EmptyText>
                  )}
                </Card>
                <Card className="h-full">
                  <SectionTitle icon={<FaCertificate />} title="Skills" />
                  {profile.skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span key={skill} className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>No skills added yet.</EmptyText>
                  )}
                </Card>
                <Card className="h-full">
                  <SectionTitle icon={<FaTrophy />} title="Achievements" />
                  {asObjectArray(profile.achievements).length ? (
                    <div className="space-y-3">
                      {asObjectArray(profile.achievements).map((item, index) => (
                        <div key={index}>
                          <p className="font-bold text-white text-sm">{item.title}</p>
                          <p className="text-gray-500 text-xs">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>No achievements added yet.</EmptyText>
                  )}
                </Card>
              </div>
            )}

            {tab === "posts" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {posts.length ? (
                  posts.map((post) => (
                    <PostCard key={post._id} post={post} currentUserId={currentUser._id} onDelete={deletePost} />
                  ))
                ) : (
                  <Card className="lg:col-span-2 text-center py-16">
                    <FaPaperPlane className="mx-auto text-5xl text-gray-700 mb-3" />
                    <p className="text-gray-400 font-semibold">No posts yet</p>
                  </Card>
                )}
              </div>
            )}

            {tab === "edit" && isOwn && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="space-y-3">
                  <SectionTitle icon={<FaEdit />} title="Basic Info" />
                  <button
                    type="button"
                    onClick={() => setField("mentorshipAvailable", !form.mentorshipAvailable)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      form.mentorshipAvailable
                        ? "bg-emerald-400/15 border-emerald-400/30 text-emerald-300"
                        : "bg-white/5 border-white/10 text-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-black">
                      <FaHandsHelping /> Offer mentorship
                    </span>
                    <span className="text-xs font-bold">
                      {form.mentorshipAvailable ? "On" : "Off"}
                    </span>
                  </button>
                  <EditInput value={form.headline} onChange={(v) => setField("headline", v)} placeholder="Headline" />
                  <EditInput value={form.location} onChange={(v) => setField("location", v)} placeholder="Location" />
                  <EditInput value={form.about} onChange={(v) => setField("about", v)} placeholder="About" multiline />
                </Card>

                <Card>
                  <SectionTitle icon={<FaCertificate />} title="Skills" />
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      placeholder="Add a skill"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-400/50"
                    />
                    <button type="button" onClick={addSkill} className="px-3 rounded-xl bg-cyan-400/20 text-cyan-300 font-bold">
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill) => (
                      <span key={skill} className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-xs">
                        {skill}
                        <button type="button" onClick={() => setField("skills", form.skills.filter((s) => s !== skill))}>
                          <FaTimes size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                </Card>

                <EditList
                  title="Education"
                  icon={<FaGraduationCap />}
                  items={form.education}
                  fields={[
                    ["college", "College / University"],
                    ["degree", "Degree"],
                    ["year", "Year"],
                  ]}
                  onAdd={() => setField("education", [...form.education, { college: "", degree: "", year: "" }])}
                  onChange={(i, patch) => updateArray("education", i, patch)}
                  onRemove={(i) => removeArray("education", i)}
                />

                <EditList
                  title="Experience"
                  icon={<FaBriefcase />}
                  items={form.experience}
                  fields={[
                    ["company", "Company"],
                    ["position", "Position"],
                    ["duration", "Duration"],
                  ]}
                  onAdd={() => setField("experience", [...form.experience, { company: "", position: "", duration: "" }])}
                  onChange={(i, patch) => updateArray("experience", i, patch)}
                  onRemove={(i) => removeArray("experience", i)}
                />

                <EditList
                  title="Achievements"
                  icon={<FaTrophy />}
                  items={form.achievements}
                  fields={[
                    ["title", "Title"],
                    ["description", "Description"],
                  ]}
                  onAdd={() => setField("achievements", [...form.achievements, { title: "", description: "" }])}
                  onChange={(i, patch) => updateArray("achievements", i, patch)}
                  onRemove={(i) => removeArray("achievements", i)}
                />

                <Card className="space-y-3">
                  <SectionTitle icon={<FaGlobe />} title="Linked Accounts" />
                  <EditInput value={form.github} onChange={(v) => setField("github", v)} placeholder="GitHub URL" />
                  <EditInput value={form.linkedin} onChange={(v) => setField("linkedin", v)} placeholder="LinkedIn URL" />
                  <EditInput value={form.portfolio} onChange={(v) => setField("portfolio", v)} placeholder="Portfolio URL" />
                </Card>

                <div className="lg:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 ${
                      saved
                        ? "bg-green-500/20 text-green-300 border border-green-400/30"
                        : "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
                    } disabled:opacity-60`}
                  >
                    {saved ? <><FaCheck /> Saved</> : saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-sm text-gray-500">
          Made with care by Mentora. Keep learning, keep showing up, and let your people find you.
        </footer>
      </div>
    </Layout>
  );
}

function EditList({ title, icon, items, fields, onAdd, onChange, onRemove }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={icon} title={title} />
        <button type="button" onClick={onAdd} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-cyan-400/20 text-cyan-300 flex items-center justify-center">
          <FaPlus size={11} />
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <EmptyText>No entries added yet.</EmptyText>}
        {items.map((item, index) => (
          <div key={index} className="bg-white/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry {index + 1}</span>
              <button type="button" onClick={() => onRemove(index)} className="text-gray-600 hover:text-red-400">
                <FaTrash size={10} />
              </button>
            </div>
            {fields.map(([key, placeholder]) => (
              <input
                key={key}
                value={item[key] || ""}
                onChange={(e) => onChange(index, { [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30"
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
