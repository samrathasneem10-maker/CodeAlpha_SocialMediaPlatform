const state={token:localStorage.getItem("nova_token"),user:null,page:"home",searchTimer:null};

const icons={home:"⌂",explore:"⌕",create:"+",saved:"▱",bell:"♡",profile:"◎",settings:"⚙",sun:"☼",logout:"↪",more:"•••",like:"♡",liked:"♥",comment:"◯",share:"↗",save:"▱",saved2:"▰"};

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function avatar(u,cls="avatar"){return `<img class="${cls}" src="${esc(u?.profileImage||"https://i.pravatar.cc/150?img=1")}" alt="${esc(u?.username||"user")}">`}
function api(path,opts={}){const h=opts.headers||{};h["Content-Type"]=opts.body instanceof FormData?undefined:"application/json";if(state.token)h.Authorization=`Bearer ${state.token}`;return fetch(path,{...opts,headers:h}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||"Something went wrong.");return d})}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";if(s<604800)return Math.floor(s/86400)+"d";return new Date(d).toLocaleDateString()}
function setTheme(){document.body.classList.toggle("dark",localStorage.getItem("nova_theme")==="dark")}

function authView(){
 document.querySelector("#app").innerHTML=`<main class="auth-wrap"><section class="auth-card">
  <div class="logo"><span>Nova</span>Social</div><p class="tagline">Share moments. Discover people. Build your world.</p>
  <div class="tabs"><button id="loginTab" class="active">Log in</button><button id="registerTab">Create account</button></div>
  <form id="authForm" class="form"></form><div id="authError" class="error"></div>
  <p class="hint">Demo: samra@example.com / Password123!</p>
 </section></main>`;
 const login=()=>{$("#loginTab").classList.add("active");$("#registerTab").classList.remove("active");$("#authForm").innerHTML=`<input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button class="btn primary">Log in</button>`;authSubmit(false)}
 const register=()=>{$("#registerTab").classList.add("active");$("#loginTab").classList.remove("active");$("#authForm").innerHTML=`<input name="name" placeholder="Full name" required><input name="username" placeholder="Username" required><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password (8+ characters)" required><input name="confirmPassword" type="password" placeholder="Confirm password" required><button class="btn primary">Create account</button>`;authSubmit(true)}
 const authSubmit=(reg)=>$("#authForm").onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target));try{const d=await api(reg?"/api/auth/register":"/api/auth/login",{method:"POST",body:JSON.stringify(body)});state.token=d.token;localStorage.setItem("nova_token",d.token);state.user=d.user;renderApp()}catch(err){$("#authError").textContent=err.message}}
 $("#loginTab").onclick=login;$("#registerTab").onclick=register;login();
}
const $=s=>document.querySelector(s);

async function renderApp(){
 if(!state.user)try{const d=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:"",password:""})});}catch{}
 if(!state.user){authView();return}
 $("#app").innerHTML=`<div class="shell"><header class="top"><div class="top-inner">
   <div class="logo"><span>Nova</span>Social</div>
   <div class="search-wrap"><input id="search" class="search" placeholder="Search people…"><div id="searchResults" class="search-results hidden"></div></div>
   <div class="top-right"><button class="icon-btn" id="theme" title="Theme">${icons.sun}</button><button class="icon-btn" data-page="notifications">${icons.bell}</button>${avatar(state.user)}</div>
 </div></header>
 <div class="layout"><aside class="sidebar"><div class="profile-mini">${avatar(state.user)}<div class="meta"><strong>@${esc(state.user.username)}</strong><small>${esc(state.user.name)}</small></div></div>
 <nav class="nav">${navButton("home","Home")}${navButton("explore","Explore")}${navButton("create","Create")}${navButton("saved","Saved")}${navButton("notifications","Notifications")}${navButton("profile","Profile")}${navButton("settings","Settings")}${navButton("logout","Log out")}</nav>
 <div class="footer-links">NovaSocial • CodeAlpha Task 2<br>Built with HTML, CSS, JS, Express & MongoDB</div></aside>
 <main id="main" class="feed"></main><aside class="rightbar" id="rightbar"></aside></div>
 <nav class="bottom-nav">${bottomButton("home","Home")}${bottomButton("explore","Explore")}${bottomButton("create","Create")}${bottomButton("notifications","Alerts")}${bottomButton("profile","Profile")}</nav></div>`;
 $("#theme").onclick=()=>{const d=document.body.classList.toggle("dark");localStorage.setItem("nova_theme",d?"dark":"light")};
 $("#search").oninput=()=>searchUsers($("#search").value);
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
 setTheme();navigate(state.page||"home");loadSuggestions();
}
function navButton(page,label){return `<button data-page="${page}" class="${state.page===page?"active":""}"><span class="ico">${icons[page==="notifications"?"bell":page==="logout"?"logout":page]}</span><span>${label}</span></button>`}
function bottomButton(page,label){return `<button data-page="${page}">${icons[page==="notifications"?"bell":page]}<small>${label}</small></button>`}
async function navigate(page){
 if(page==="logout"){localStorage.removeItem("nova_token");state.token=null;state.user=null;authView();return}
 state.page=page;document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 if(page==="home")return home();
 if(page==="explore")return explore();
 if(page==="saved")return saved();
 if(page==="notifications")return notifications();
 if(page==="profile")return profile(state.user.username);
 if(page==="settings")return settings();
 if(page==="create")return createModal();
}
async function home(){
 $("#main").innerHTML=`<div class="stories" id="stories"></div><div class="skeleton"></div>`;
 try{const posts=await api("/api/feed");renderStories();renderPosts(posts);loadSuggestions()}catch(e){errorView(e.message)}
}
function renderStories(){const people=[state.user,{username:"alex",name:"Alex",profileImage:"https://i.pravatar.cc/150?img=12"},{username:"mia",name:"Mia",profileImage:"https://i.pravatar.cc/150?img=47"},{username:"sarah",name:"Sarah",profileImage:"https://i.pravatar.cc/150?img=25"},{username:"daniel",name:"Daniel",profileImage:"https://i.pravatar.cc/150?img=5"},{username:"emma",name:"Emma",profileImage:"https://i.pravatar.cc/150?img=44"}];$("#stories").innerHTML=people.map(p=>`<div class="story">${`<div class="story-ring">${avatar(p,"")}</div>`}<small>@${esc(p.username)}</small></div>`).join("")}
function postCard(p){
 const own=String(p.author._id)===String(state.user._id);
 return `<article class="post" data-post="${p._id}">
 <header class="post-head">${avatar(p.author)}<div class="meta"><strong>@${esc(p.author.username)}</strong><small>${esc(p.location||"NovaSocial")} · ${timeAgo(p.createdAt)}</small></div><button class="more" onclick="postMenu('${p._id}',${own})">${icons.more}</button></header>
 <img class="post-image" src="${esc(p.image)}" alt="${esc(p.caption||"NovaSocial post")}">
 <div class="post-actions"><button class="${p.liked?"liked":""}" onclick="likePost('${p._id}',this)">${p.liked?icons.liked:icons.like}</button><button onclick="comments('${p._id}')">${icons.comment}</button><button onclick="sharePost('${p._id}')">${icons.share}</button><button class="save ${p.saved?"saved":""}" onclick="savePost('${p._id}',this)">${p.saved?icons.saved2:icons.save}</button></div>
 <div class="post-body"><div class="likes">${p.likesCount.toLocaleString()} likes</div><div class="caption"><b>@${esc(p.author.username)}</b>${esc(p.caption)}</div><a class="comments-link" onclick="comments('${p._id}')">View all ${p.commentsCount} comments</a>
 <form class="comment-row" onsubmit="addComment(event,'${p._id}')"><input name="text" placeholder="Add a comment…" maxlength="500"><button>Post</button></form></div></article>`
}
function renderPosts(posts){$("#main").innerHTML=posts.length?posts.map(postCard).join(""):`<div class="profile-card"><h2>Your feed is empty.</h2><p class="bio">Follow people or create your first post.</p><button class="btn primary" onclick="createModal()">Create your first post</button></div>`}
async function loadSuggestions(){
 try{const users=await api("/api/users/search?q=a");const list=users.filter(u=>u.username!==state.user.username).slice(0,5);$("#rightbar").innerHTML=`<div class="suggest-head"><b>Suggested for you</b><span>See all</span></div>${list.map(u=>`<div class="suggestion">${avatar(u)}<div class="meta"><strong>@${esc(u.username)}</strong><small>${esc(u.name)}</small></div><button class="follow" onclick="followUser('${u.username}',this)">Follow</button></div>`).join("")}<div class="footer-links">About · Help · Privacy · Terms<br>© 2026 NovaSocial</div>`}catch{}
}
async function likePost(id,btn){try{const d=await api(`/api/posts/${id}/like`,{method:"POST"});btn.classList.toggle("liked",d.liked);btn.innerHTML=d.liked?icons.liked:icons.like;const card=btn.closest(".post");card.querySelector(".likes").textContent=d.likesCount.toLocaleString()+" likes"}catch(e){toast(e.message)}}
async function savePost(id,btn){try{const d=await api(`/api/posts/${id}/save`,{method:"POST"});btn.classList.toggle("saved",d.saved);btn.innerHTML=d.saved?icons.saved2:icons.save;toast(d.saved?"Saved":"Removed from saved")}catch(e){toast(e.message)}}
async function addComment(e,id){e.preventDefault();const input=e.target.text;try{await api(`/api/posts/${id}/comments`,{method:"POST",body:JSON.stringify({text:input.value})});input.value="";toast("Comment added")}catch(err){toast(err.message)}}
async function comments(id){
 try{const list=await api(`/api/comments/${id}`);showModal(`<div class="modal-head"><h2>Comments</h2><button class="close" onclick="closeModal()">×</button></div><div class="comment-list">${list.length?list.map(c=>`<div class="comment">${avatar(c.author)}<p><b>@${esc(c.author.username)}</b> ${esc(c.text)}<small>${timeAgo(c.createdAt)}</small></p></div>`).join(""):"<p class='bio'>No comments yet.</p>"}</div><form class="comment-row" onsubmit="modalComment(event,'${id}')"><input name="text" placeholder="Add a comment…" required><button>Post</button></form>`)}catch(e){toast(e.message)}}
async function modalComment(e,id){e.preventDefault();const input=e.target.text;try{await api(`/api/comments/${id}`,{method:"POST",body:JSON.stringify({text:input.value})});comments(id)}catch(err){toast(err.message)}}
async function followUser(username,btn){try{const d=await api(`/api/users/${username}/follow`,{method:"POST"});btn.textContent=d.following?"Following":"Follow";toast(d.following?"Following @"+username:"Unfollowed")}catch(e){toast(e.message)}}
async function sharePost(id){await navigator.clipboard?.writeText(location.origin+"/?post="+id);toast("Post link copied")}
async function postMenu(id,own){if(own&&confirm("Delete this post?"))try{await api(`/api/posts/${id}`,{method:"DELETE"});navigate(state.page)}catch(e){toast(e.message)}else if(!own)toast("Post options: Save is available below the post")}
async function explore(){try{const posts=await api("/api/explore");$("#main").innerHTML=`<h1 class="page-title">Explore</h1><div class="explore-grid">${posts.map(p=>`<div class="explore-item" onclick="openPost('${p._id}')"><img src="${esc(p.image)}" alt=""><div class="explore-overlay">♥ ${p.likesCount} · ◯ ${p.commentsCount}</div></div>`).join("")}</div>`}catch(e){errorView(e.message)}}
async function saved(){try{const posts=await api("/api/saved");$("#main").innerHTML=`<h1 class="page-title">Saved posts</h1>`+(posts.length?posts.map(postCard).join(""):`<div class="profile-card"><h2>No saved posts</h2><p class="bio">Save posts you want to revisit later.</p></div>`)}catch(e){errorView(e.message)}}
async function notifications(){try{const ns=await api("/api/notifications");$("#main").innerHTML=`<div class="section-head"><h1 class="page-title">Notifications</h1></div>`+(ns.length?ns.map(n=>`<div class="notif ${n.read?"":"unread"}">${avatar(n.actor)}<div class="ntext"><b>@${esc(n.actor.username)}</b> ${n.type==="like"?"liked your post.":n.type==="comment"?"commented on your post.":"started following you."}<small>${timeAgo(n.createdAt)}</small></div>${n.post?.image?`<img class="avatar" src="${esc(n.post.image)}" alt="">`:""}${!n.read?'<i class="badge"></i>':""}</div>`).join(""):`<div class="profile-card"><h2>You're all caught up</h2><p class="bio">New activity will appear here.</p></div>`);await api("/api/notifications/read",{method:"POST"})}catch(e){errorView(e.message)}}
async function profile(username){
 try{const d=await api(`/api/users/${username}`);const u=d.user;$("#main").innerHTML=`<section class="profile-card"><div class="profile-top">${avatar(u,"profile-large")}<div class="profile-info"><div class="profile-name">@${esc(u.username)}</div><div class="stats"><span><b>${d.posts.length}</b><small>Posts</small></span><span><b>${u.followersCount}</b><small>Followers</small></span><span><b>${u.followingCount}</b><small>Following</small></span></div><b>${esc(u.name)}</b><div class="bio">${esc(u.bio)}</div>${u.website?`<a href="${esc(u.website)}" target="_blank">${esc(u.website)}</a>`:""}</div><div>${d.isSelf?`<button class="btn ghost" onclick="editProfile()">Edit Profile</button>`:`<button class="btn ${d.isFollowing?"ghost":"primary"}" onclick="profileFollow('${u.username}',this)">${d.isFollowing?"Following":"Follow"}</button>`}</div></div></section><div class="profile-grid">${d.posts.map(p=>`<img src="${esc(p.image)}" alt="" onclick="openPost('${p._id}')">`).join("")}</div>`}catch(e){errorView(e.message)}}
async function profileFollow(u,btn){const d=await api(`/api/users/${u}/follow`,{method:"POST"});btn.textContent=d.following?"Following":"Follow";btn.className="btn "+(d.following?"ghost":"primary");}
async function editProfile(){showModal(`<div class="modal-head"><h2>Edit profile</h2><button class="close" onclick="closeModal()">×</button></div><form class="form" onsubmit="saveProfile(event)"><input name="name" value="${esc(state.user.name)}" placeholder="Full name"><textarea name="bio" rows="4" placeholder="Bio">${esc(state.user.bio||"")}</textarea><input name="website" value="${esc(state.user.website||"")}" placeholder="Website"><label class="drop">Profile picture <input type="file" name="image" accept="image/*"></label><button class="btn primary">Save changes</button></form>`)}
async function saveProfile(e){e.preventDefault();const fd=new FormData(e.target);const image=fd.get("image");try{const d=await api("/api/users/me",{method:"PUT",body:JSON.stringify({name:fd.get("name"),bio:fd.get("bio"),website:fd.get("website")})});state.user={...state.user,...d.user};if(image?.size){const f=new FormData();f.append("image",image);const a=await api("/api/users/me/avatar",{method:"POST",body:f});state.user={...state.user,...a.user}}closeModal();renderApp()}catch(err){toast(err.message)}}
function settings(){$("#main").innerHTML=`<h1 class="page-title">Settings</h1><div class="profile-card"><h3>Appearance</h3><p class="bio">Choose the interface theme. Your preference is saved on this device.</p><button class="btn ghost" onclick="toggleTheme()">Toggle dark mode</button></div><div class="profile-card"><h3>Account</h3><p class="bio">Logged in as @${esc(state.user.username)}. Passwords are securely hashed on the server.</p></div>`}
function toggleTheme(){const d=document.body.classList.toggle("dark");localStorage.setItem("nova_theme",d?"dark":"light")}
function createModal(){showModal(`<div class="modal-head"><h2>Create post</h2><button class="close" onclick="closeModal()">×</button></div><form id="createForm" class="form"><label class="drop">Choose an image<input id="postImage" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required></label><img id="preview" class="upload-preview hidden" alt="Preview"><textarea name="caption" rows="4" placeholder="Write a caption…"></textarea><input name="location" placeholder="Add location"><button class="btn primary">Share post</button></form>`);$("#postImage").onchange=e=>{const f=e.target.files[0];if(f){if(f.size>8*1024*1024){toast("Image must be under 8MB");e.target.value="";return}$("#preview").src=URL.createObjectURL(f);$("#preview").classList.remove("hidden")}};$("#createForm").onsubmit=createSubmit}
async function createSubmit(e){e.preventDefault();const fd=new FormData(e.target);try{await api("/api/posts",{method:"POST",body:fd});closeModal();toast("Post shared");navigate("home")}catch(err){toast(err.message)}}
async function openPost(id){try{const p=await api(`/api/posts/${id}`);showModal(postCard(p))}catch(e){toast(e.message)}}
function showModal(html){const m=document.createElement("div");m.id="modal";m.className="modal";m.innerHTML=`<div class="modal-card">${html}</div>`;m.onclick=e=>{if(e.target===m)closeModal()};document.body.appendChild(m)}
function closeModal(){$("#modal")?.remove()}
function errorView(msg){$("#main").innerHTML=`<div class="profile-card"><h2>Something went wrong.</h2><p class="bio">${esc(msg)}</p><button class="btn primary" onclick="navigate('${state.page}')">Try again</button></div>`}
async function searchUsers(q){clearTimeout(state.searchTimer);if(!q.trim())return $("#searchResults").classList.add("hidden");state.searchTimer=setTimeout(async()=>{try{const us=await api("/api/users/search?q="+encodeURIComponent(q));$("#searchResults").innerHTML=us.length?us.map(u=>`<div class="result" onclick="navigateProfile('${u.username}')">${avatar(u)}<div class="meta"><b>@${esc(u.username)}</b><div>${esc(u.name)}</div></div></div>`).join(""):`<div class="result">No users found.</div>`;$("#searchResults").classList.remove("hidden")}catch{}},250)}
function navigateProfile(u){$("#searchResults").classList.add("hidden");$("#search").value="";profile(u)}
async function init(){setTheme();if(!state.token)return authView();try{const d=await api("/api/users/me");state.user=d.user;renderApp()}catch{localStorage.removeItem("nova_token");state.token=null;authView()}}
function decodeJwt(t){try{return JSON.parse(atob(t.split(".")[1])).id}catch{return""}}
window.likePost=likePost;window.savePost=savePost;window.addComment=addComment;window.comments=comments;window.modalComment=modalComment;window.followUser=followUser;window.sharePost=sharePost;window.postMenu=postMenu;window.closeModal=closeModal;window.createModal=createModal;window.editProfile=editProfile;window.profileFollow=profileFollow;window.openPost=openPost;window.navigateProfile=navigateProfile;window.toggleTheme=toggleTheme;window.navigate=navigate;
init();
