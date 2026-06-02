import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import {
  FaEdit, FaPlus, FaGithub, FaLinkedin, FaGlobe,
  FaGraduationCap, FaBriefcase, FaMapMarkerAlt,
  FaCamera, FaCheck, FaTimes, FaTrash,
  FaHeart, FaRegHeart, FaComment, FaShare,
  FaEllipsisH, FaTrophy, FaCertificate,
} from "react-icons/fa";

const API = "http://localhost:5000";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── SECTION CARD ─────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────
function SectionTitle({ icon, title, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-cyan-400 text-sm">{icon}</span>
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h3>
      </div>
      {onAdd && (
        <button onClick={onAdd} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-cyan-400/20 hover:text-cyan-400 flex items-center justify-center transition-all text-gray-400">
          <FaPlus size={9} />
        </button>
      )}
    </div>
  );
}

// ─── INLINE EDIT INPUT ────────────────────────────────────────────
function EditInput({ value, onChange, placeholder, multiline = false, className = "" }) {
  const cls = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-cyan-400/50 transition-colors ${className}`;
  if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + " resize-none"} />;
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

// ─── POST MINI CARD ───────────────────────────────────────────────
function PostMiniCard({ post, onDelete, currentUserId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const liked = post.likes?.includes(currentUserId);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-gray-200 text-sm leading-relaxed line-clamp-3 flex-1">{post.content}</p>
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 hover:text-white p-1 transition-colors">
            <FaEllipsisH size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 bg-slate-800 border border-white/10 rounded-xl shadow-xl py-1.5 min-w-[110px] z-10">
              <button onClick={() => { onDelete(post._id); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-white/5 text-xs transition-colors flex items-center gap-2">
                <FaTrash size={10} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {post.image && <img src={post.image} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />}
      <div className="flex items-center justify-between text-gray-600 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {liked ? <FaHeart className="text-red-400" size={11} /> : <FaRegHeart size={11} />}
            {post.likes?.length || 0}
          </span>
        </div>
        <span>{timeAgo(post.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── MAIN PROFILE ─────────────────────────────────────────────────
export default function Profile() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("about"); // about | posts
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // editable fields
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Load profile ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, postRes] = await Promise.all([
          axios.get(`${API}/api/profile`, { headers }),
          axios.get(`${API}/api/posts/mine`, { headers }),
        ]);
        const d = pRes.data;
        setProfile(d);
        setHeadline(d.headline || "");
        setLocation(d.location || "");
        setAbout(d.about || d.bio || "");
        setGithub(d.github || d.socialLinks?.github || "");
        setLinkedin(d.linkedin || d.socialLinks?.linkedin || "");
        setPortfolio(d.socialLinks?.portfolio || "");
        setSkills(Array.isArray(d.skills) ? d.skills.filter(s => typeof s === "string") : []);
        setEducation(Array.isArray(d.education)
          ? d.education.filter(e => typeof e === "object" && e !== null && !Array.isArray(e))
          : []);
        setExperience(Array.isArray(d.experience)
          ? d.experience.filter(e => typeof e === "object" && e !== null)
          : []);
        setAchievements(Array.isArray(d.achievements)
          ? d.achievements.filter(a => typeof a === "object" && a !== null)
          : []);
        setPosts(postRes.data);
      } catch (err) { console.log(err); }
    };
    load();
  }, []);

  // ── Save profile ────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/profile`, {
        headline, location, about, github, linkedin,
        skills,
        education: education.filter(e => e.college || e.degree),
        experience: experience.filter(e => e.company || e.position),
        achievements: achievements.filter(a => a.title),
        socialLinks: { github, linkedin, portfolio },
      }, { headers });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.log(err); }
    setSaving(false);
  };

  // ── Upload image ────────────────────────────────────────────────
  const uploadImage = async (file, type) => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await axios.post(`${API}/api/profile/upload-${type}`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      if (type === "profile") setProfile(p => ({ ...p, profilePicture: file.name, profileImage: file.name }));
      if (type === "cover") setProfile(p => ({ ...p, coverPicture: file.name, coverImage: file.name }));
      return res.data.image;
    } catch (err) { console.log(err); }
  };

  // ── Delete post ─────────────────────────────────────────────────
  const deletePost = async (postId) => {
    try {
      await axios.delete(`${API}/api/posts/${postId}`, { headers });
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) { console.log(err); }
  };

  // ── Skills ──────────────────────────────────────────────────────
  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) { setSkills(p => [...p, s]); setNewSkill(""); }
  };
  const removeSkill = (i) => setSkills(p => p.filter((_, idx) => idx !== i));

  // ── Education ──────────────────────────────────────────────────
  const addEdu = () => setEducation(p => [...p, { college: "", degree: "", year: "" }]);
  const setEdu = (i, k, v) => setEducation(p => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
  const removeEdu = (i) => setEducation(p => p.filter((_, idx) => idx !== i));

  // ── Experience ─────────────────────────────────────────────────
  const addExp = () => setExperience(p => [...p, { company: "", position: "", duration: "" }]);
  const setExp = (i, k, v) => setExperience(p => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
  const removeExp = (i) => setExperience(p => p.filter((_, idx) => idx !== i));

  // ── Achievements ───────────────────────────────────────────────
  const addAch = () => setAchievements(p => [...p, { title: "", description: "" }]);
  const setAch = (i, k, v) => setAchievements(p => p.map((a, idx) => idx === i ? { ...a, [k]: v } : a));
  const removeAch = (i) => setAchievements(p => p.filter((_, idx) => idx !== i));

  const coverSrc = profile?.coverPicture || profile?.coverImage;
  const avatarSrc = profile?.profilePicture || profile?.profileImage;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-10">

        {/* ── COVER + AVATAR ── */}
        <div className="relative mb-14">
          {/* Cover */}
          <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-white/10">
            {coverSrc && (
              <img src={coverSrc.startsWith("http") ? coverSrc : `${API}/uploads/${coverSrc}`}
                alt="" className="w-full h-full object-cover" />
            )}
            <label className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-2 rounded-xl cursor-pointer transition-colors">
              <FaCamera size={12} className="text-white" />
              <input type="file" hidden accept="image/*" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], "cover")} />
            </label>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-4 flex items-end gap-3">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc.startsWith("http") ? avatarSrc : `${API}/uploads/${avatarSrc}`}
                  alt="" className="w-20 h-20 rounded-full border-4 border-slate-950 object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-slate-950 bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-black text-slate-900">
                  {currentUser?.fullName?.charAt(0)}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-400 hover:bg-cyan-300 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                <FaCamera size={9} className="text-slate-900" />
                <input type="file" hidden accept="image/*" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], "profile")} />
              </label>
            </div>
          </div>
        </div>

        {/* ── NAME + HEADLINE ── */}
        <div className="px-1 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-white leading-none">{currentUser?.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {currentUser?.role && (
                  <span className="bg-cyan-400/15 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <FaMapMarkerAlt size={9} /> {location}
                  </span>
                )}
              </div>
              {headline && <p className="text-gray-400 text-sm mt-1">{headline}</p>}
            </div>

            {/* Save button */}
            <button onClick={save} disabled={saving}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                saved ? "bg-green-500/20 text-green-400 border border-green-400/30"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 hover:scale-105 shadow-lg shadow-cyan-500/20"
              } disabled:opacity-60`}>
              {saved ? <><FaCheck size={10} /> Saved</> : saving ? "Saving…" : <><FaEdit size={10} /> Save</>}
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/5">
            {[
              { label: "Posts", value: posts.length },
              { label: "Connections", value: profile?.connections?.length || 0 },
              { label: "Profile Views", value: profile?.profileViews || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-white font-black text-base leading-none">{value}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}

            {/* Social links */}
            <div className="flex items-center gap-2 ml-auto">
              {(github || profile?.github) && (
                <a href={github || profile?.github} target="_blank" rel="noreferrer"
                  className="text-gray-500 hover:text-white transition-colors">
                  <FaGithub size={16} />
                </a>
              )}
              {(linkedin || profile?.linkedin) && (
                <a href={linkedin || profile?.linkedin} target="_blank" rel="noreferrer"
                  className="text-gray-500 hover:text-cyan-400 transition-colors">
                  <FaLinkedin size={16} />
                </a>
              )}
              {portfolio && (
                <a href={portfolio} target="_blank" rel="noreferrer"
                  className="text-gray-500 hover:text-white transition-colors">
                  <FaGlobe size={15} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
          {["about", "posts"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t ? "bg-gradient-to-r from-cyan-400/20 to-blue-400/20 text-cyan-300 border border-cyan-400/20"
                          : "text-gray-500 hover:text-gray-300"
              }`}>
              {t === "posts" ? `Posts (${posts.length})` : "About"}
            </button>
          ))}
        </div>

        {/* ══ ABOUT TAB ══════════════════════════════════════════ */}
        {tab === "about" && (
          <div className="space-y-3">

            {/* Headline + Location */}
            <Card>
              <SectionTitle icon={<FaEdit size={11} />} title="Basic Info" />
              <div className="space-y-2">
                <EditInput value={headline} onChange={setHeadline} placeholder="Headline — e.g. Full Stack Developer at Google" />
                <EditInput value={location} onChange={setLocation} placeholder="Location — e.g. Mumbai, India" />
              </div>
            </Card>

            {/* About */}
            <Card>
              <SectionTitle icon="✍️" title="About" />
              <EditInput value={about} onChange={setAbout} placeholder="Write a short bio about yourself…" multiline />
            </Card>

            {/* Skills */}
            <Card>
              <SectionTitle icon="⚡" title="Skills" />
              <div className="flex gap-2 mb-3">
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addSkill()}
                  placeholder="Add a skill…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/50 transition-colors" />
                <button onClick={addSkill}
                  className="px-3 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-400 rounded-xl text-xs font-bold transition-colors">
                  + Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="group flex items-center gap-1 bg-white/5 border border-white/10 hover:border-red-400/30 text-gray-300 px-3 py-1 rounded-full text-xs transition-all">
                      {s}
                      <button onClick={() => removeSkill(i)} className="text-gray-600 group-hover:text-red-400 transition-colors ml-0.5">
                        <FaTimes size={8} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Education */}
            <Card>
              <SectionTitle icon={<FaGraduationCap size={11} />} title="Education" onAdd={addEdu} />
              {education.length === 0 && (
                <p className="text-gray-600 text-xs">No education added yet</p>
              )}
              <div className="space-y-3">
                {education.map((e, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry {i + 1}</span>
                      <button onClick={() => removeEdu(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <FaTrash size={10} />
                      </button>
                    </div>
                    <input value={e.college} onChange={ev => setEdu(i, "college", ev.target.value)}
                      placeholder="College / University"
                      className="w-full bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                    <div className="flex gap-2">
                      <input value={e.degree} onChange={ev => setEdu(i, "degree", ev.target.value)}
                        placeholder="Degree" className="flex-1 bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                      <input value={e.year} onChange={ev => setEdu(i, "year", ev.target.value)}
                        placeholder="Year" className="w-20 bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Experience */}
            <Card>
              <SectionTitle icon={<FaBriefcase size={11} />} title="Experience" onAdd={addExp} />
              {experience.length === 0 && (
                <p className="text-gray-600 text-xs">No experience added yet</p>
              )}
              <div className="space-y-3">
                {experience.map((e, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry {i + 1}</span>
                      <button onClick={() => removeExp(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <FaTrash size={10} />
                      </button>
                    </div>
                    <input value={e.company} onChange={ev => setExp(i, "company", ev.target.value)}
                      placeholder="Company"
                      className="w-full bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                    <div className="flex gap-2">
                      <input value={e.position} onChange={ev => setExp(i, "position", ev.target.value)}
                        placeholder="Position" className="flex-1 bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                      <input value={e.duration} onChange={ev => setExp(i, "duration", ev.target.value)}
                        placeholder="Duration" className="w-24 bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card>
              <SectionTitle icon={<FaTrophy size={11} />} title="Achievements" onAdd={addAch} />
              {achievements.length === 0 && (
                <p className="text-gray-600 text-xs">No achievements added yet</p>
              )}
              <div className="space-y-3">
                {achievements.map((a, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry {i + 1}</span>
                      <button onClick={() => removeAch(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <FaTrash size={10} />
                      </button>
                    </div>
                    <input value={a.title} onChange={ev => setAch(i, "title", ev.target.value)}
                      placeholder="Title"
                      className="w-full bg-transparent border-b border-white/10 pb-1 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                    <input value={a.description} onChange={ev => setAch(i, "description", ev.target.value)}
                      placeholder="Description (optional)"
                      className="w-full bg-transparent border-b border-white/10 pb-1 text-gray-400 text-xs placeholder-gray-600 outline-none focus:border-cyan-400/30 transition-colors" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Social Links */}
            <Card>
              <SectionTitle icon="🔗" title="Social Links" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FaGithub size={13} className="text-gray-500 shrink-0" />
                  <input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/username"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/50 transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <FaLinkedin size={13} className="text-gray-500 shrink-0" />
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/50 transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <FaGlobe size={13} className="text-gray-500 shrink-0" />
                  <input value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:border-cyan-400/50 transition-colors" />
                </div>
              </div>
            </Card>

          </div>
        )}

        {/* ══ POSTS TAB ══════════════════════════════════════════ */}
        {tab === "posts" && (
          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">✍️</div>
                <p className="text-gray-400 font-semibold text-sm">No posts yet</p>
                <p className="text-gray-600 text-xs mt-1">Your posts will appear here</p>
              </div>
            ) : (
              posts.map(post => (
                <PostMiniCard key={post._id} post={post} onDelete={deletePost} currentUserId={currentUser._id} />
              ))
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
