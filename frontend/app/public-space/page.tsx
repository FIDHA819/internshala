"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "../../Feature/userSlice"; 
import axios from "axios";
import { toast } from "react-toastify";
import { Image, Video, Send, MessageCircle, Heart, ShieldAlert, UserPlus, UserCheck, UserX } from "lucide-react";

interface PostItem {
  _id: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  likes: string[];
  user: { _id: string; email: string; photo?: string };
  comments: Array<{ _id: string; text: string; user: { email: string; photo?: string } }>;
}

interface DiscoverUserItem {
  _id: string;
  email: string;
  photo?: string;
  friends: string[];
  friendRequests?: string[]; // Tracks incoming requests sent to this user
}

export default function PublicSpace() {
  const user = useSelector(selectuser);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUserItem[]>([]);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  
  // Hydration safeguard to prevent Next.js SSR attributes mismatch
  const [hasMounted, setHasMounted] = useState(false);

  const friendCount = user?.friends?.length || 0;
  const currentDailyCount = user?.dailyPostCount || 0;

  useEffect(() => {
    setHasMounted(true);
    fetchPosts();
    fetchDiscoveryUsers();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/all`);
      if (res.data.success) setPosts(res.data.posts);
    } catch (err) {
      console.error("Failed fetching space feed artifacts:", err);
    }
  };

  const fetchDiscoveryUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/discover`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setDiscoverUsers(res.data.users);
      }
    } catch (err) {
      console.error("DISCOVER ERROR:", err);
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-request/send/${targetUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Friend request sent successfully!");
        fetchDiscoveryUsers(); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed processing request actions.");
    }
  };

  const handleAcceptFriend = async (targetUserId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-request/accept/${targetUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Friend request accepted!");
        fetchDiscoveryUsers();
        // If your auth management allows context updates, refresh your global app user status here
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed accepting friend request.");
    }
  };

  const handleRejectFriend = async (targetUserId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-request/reject/${targetUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.info("Friend request removed.");
        fetchDiscoveryUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed rejecting friend request.");
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return toast.error("Please insert a hosting link URL parameter asset resource.");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/create`,
        { caption, mediaUrl, mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Post updated live to stream!");
        setCaption("");
        setMediaUrl("");
        fetchPosts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Posting threshold action validation failed.");
    } finally {
      setLoading(false);
    }
  };

 const handleLikeToggle = async (postId: string) => {
  try {
    const token = localStorage.getItem("token");

    console.log("TOKEN:", token);

    const res = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("LIKE RESPONSE:", res.data);

    if (res.data.success) {
      setPosts(
        posts.map((p) =>
          p._id === postId
            ? { ...p, likes: res.data.likes }
            : p
        )
      );
    }
  } catch (err: any) {
    console.log("LIKE ERROR:", err.response?.data);
    toast.error(
      err.response?.data?.message ||
      "Sign in to execute interaction actions."
    );
  }
};

  const handleCommentSubmit = async (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data.comments } : p));
        setCommentText({ ...commentText, [postId]: "" });
      }
    } catch (err) {
      toast.error("Could not append commentary payload index.");
    }
  };

  // Filter incoming requests separately from discovery profiles
  // An incoming request means the listed profile user has sent a request that awaits the logged-in user's approval
  const incomingRequests = discoverUsers.filter((u) => user?.friendRequests?.includes(u._id));
  const regularDiscovery = discoverUsers.filter((u) => !user?.friendRequests?.includes(u._id));

  if (!hasMounted) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800">
      
      {/* Feed Section */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Creator Form */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-md font-bold text-slate-900">Public Timeline Feed</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              friendCount === 0 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
            }`}>
              <ShieldAlert size={12} />
              Limit: {friendCount === 0 ? "Locked" : `${currentDailyCount} / ${friendCount} used`}
            </span>
          </div>

          <form onSubmit={handlePostSubmit} className="space-y-3">
            <textarea
              placeholder={friendCount === 0 ? "Unlock streaming interaction access by gaining friends..." : "Compose platform commentary context updates..."}
              disabled={friendCount === 0}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border rounded-xl p-3 text-xs outline-none focus:border-blue-500 min-h-[70px] resize-none bg-slate-50/30"
            />
            <input
              type="text"
              placeholder="Media reference asset URL route link..."
              disabled={friendCount === 0}
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-blue-500"
            />

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType("image")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold ${mediaType === "image" ? "bg-slate-100 text-blue-600" : "text-slate-400"}`}
                >
                  <Image size={14} /> Photo
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("video")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold ${mediaType === "video" ? "bg-slate-100 text-blue-600" : "text-slate-400"}`}
                >
                  <Video size={14} /> Video
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || friendCount === 0 || (friendCount <= 10 && currentDailyCount >= friendCount)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Send size={12} /> Share Stream
              </button>
            </div>
          </form>
        </div>

        {/* Timeline Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              
              {/* Card Header Container */}
              <div className="p-4 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center uppercase overflow-hidden">
                    {post.user?.photo ? <img src={post.user.photo} alt="" className="h-full w-full object-cover" /> : post.user?.email?.[0]}
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{post.user?.email || "Anonymous user"}</p>
                </div>

                {user && post.user?._id !== user.id && (
                  <button
                    onClick={() => handleAddFriend(post.user._id)}
                    className="p-1.5 rounded-lg border text-slate-500 hover:text-blue-600 hover:border-blue-200 flex items-center gap-1 text-[11px] font-medium transition-all"
                  >
                    <UserPlus size={13} /> Add Friend
                  </button>
                )}
              </div>

              {/* Caption */}
              {post.caption && <p className="px-4 pt-3 text-xs text-slate-600 leading-relaxed">{post.caption}</p>}

              {/* Media Container */}
              <div className="p-4">
                <div className="bg-slate-900 w-full max-h-[400px] rounded-xl overflow-hidden flex items-center justify-center">
                  {post.mediaType === "video" ? (
                    <video src={post.mediaUrl} controls className="w-full h-full max-h-[400px]" />
                  ) : (
                    <img src={post.mediaUrl} alt="Public space content item" className="w-full h-full object-contain max-h-[400px]" />
                  )}
                </div>
              </div>

              {/* Action row layout */}
              <div className="px-4 pb-2 flex gap-4 text-xs font-semibold border-b border-slate-50">
                <button 
                  onClick={() => handleLikeToggle(post._id)}
                  className={`flex items-center gap-1.5 py-1 ${user && post.likes.includes(user.id) ? "text-rose-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Heart size={16} fill={user && post.likes.includes(user.id) ? "currentColor" : "none"} /> 
                  <span>{post.likes.length} Likes</span>
                </button>
                <div className="text-slate-500 flex items-center gap-1.5 py-1">
                  <MessageCircle size={16} />
                  <span>{post.comments.length} Comments</span>
                </div>
              </div>

              {/* Comments Node Wrapper */}
              <div className="bg-slate-50/50 p-4 space-y-3 flex-1 text-xs">
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2">
                  {post.comments.map((comm) => (
                    <div key={comm._id} className="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                      <span className="font-bold text-[10px] text-slate-500">{comm.user?.email}</span>
                      <p className="text-slate-700">{comm.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1.5">
                  <input
                    type="text"
                    placeholder="Append public conversation feed text row..."
                    value={commentText[post._id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                    className="flex-1 border bg-white rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-xs"
                  />
                  <button 
                    onClick={() => handleCommentSubmit(post._id)}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3 flex items-center justify-center transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Right Sidebar Columns */}
      <div className="space-y-6">
        
        {/* Allowance Matrix Sidebar Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-xs tracking-wider uppercase text-indigo-300">Allowance Matrix</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your capabilities dynamically expand to scale stream privileges based on social connections.
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">0 Friends</span>
              <span className="font-semibold text-rose-400">Locked Stream Access</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">1–10 Friends</span>
              <span className="font-semibold text-amber-400">1 Post / Friend / Day</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-400">&gt; 10 Friends</span>
              <span className="font-semibold text-emerald-400">Unlimited Actions ✨</span>
            </div>
          </div>
        </div>

        {/* NEW: Pending Friend Requests Received Card */}
        {incomingRequests.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs tracking-wider uppercase text-amber-700 flex items-center gap-1">
              <span>Friend Requests</span>
              <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full">{incomingRequests.length}</span>
            </h3>
            <div className="space-y-3">
              {incomingRequests.map((reqUser) => (
                <div key={reqUser._id} className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-amber-200 text-[10px] font-bold text-amber-800 flex items-center justify-center uppercase overflow-hidden flex-shrink-0">
                      {reqUser.photo ? <img src={reqUser.photo} alt="" className="h-full w-full object-cover" /> : reqUser.email?.[0]}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{reqUser.email}</p>
                  </div>
                  
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleAcceptFriend(reqUser._id)}
                      className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      title="Accept Request"
                    >
                      <UserCheck size={14} />
                    </button>
                    <button
                      onClick={() => handleRejectFriend(reqUser._id)}
                      className="p-1 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
                      title="Decline"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discover Connections Sidebar Card */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs tracking-wider uppercase text-slate-500">Discover Connections</h3>
          <div className="space-y-3">
            {regularDiscovery.map((profileUser) => {
              const isFriend = profileUser.friends?.includes(user?.id);
              // Check if currently logged in user has already sent a pending request outwards
              const hasSentRequest = profileUser.friendRequests?.includes(user?.id);

              return (
                <div key={profileUser._id} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center uppercase overflow-hidden flex-shrink-0">
                      {profileUser.photo ? <img src={profileUser.photo} alt="" className="h-full w-full object-cover" /> : profileUser.email?.[0]}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{profileUser.email}</p>
                  </div>
                  
                  <button
                    onClick={() => !isFriend && !hasSentRequest && handleAddFriend(profileUser._id)}
                    disabled={isFriend || hasSentRequest}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all flex items-center gap-1 flex-shrink-0 ${
                      isFriend 
                        ? "bg-slate-50 text-slate-400 border-slate-200" 
                        : hasSentRequest
                        ? "bg-amber-50 text-amber-600 border-amber-200 italic"
                        : "border-blue-200 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {isFriend ? "Friends" : hasSentRequest ? "Pending" : "Add Friend"}
                  </button>
                </div>
              );
            })}
            {regularDiscovery.length === 0 && (
              <p className="text-[11px] text-slate-400 italic">No alternative profiles available.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}