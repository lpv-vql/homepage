const GAS_URL = "https://script.google.com/macros/s/AKfycbx-2_mFVREerctbt43cyvvWJvYpTJBBRTrH33jOIGS52T4nyRthFNn62VoUrUVT7pwd/exec";

  let allComments = [];
  let visibleCount = 5;

  // ページ読み込み時の処理
  document.addEventListener("DOMContentLoaded", () => {
    fetchComments();
    
    // ★LocalStorageから保存された名前とパスワードを読み込んで、親フォームに自動入力
    const savedName = localStorage.getItem('comment_saved_name');
    const savedPass = localStorage.getItem('comment_saved_pass');
    
    if (savedName) document.getElementById('commentName').value = savedName;
    if (savedPass) document.getElementById('commentPass').value = savedPass;
  });

  async function fetchComments() {
    try {
      const response = await fetch(GAS_URL);
      allComments = await response.json();
      renderComments(allComments);
    } catch (error) {
      document.getElementById('commentContainer').innerText = "コメントの読み込みに失敗しました。";
      console.error(error);
    }
  }

  // 親コメントの送信処理
async function submitParentComment(e) {
  e.preventDefault();
  
  // reCAPTCHAから認証トークンを取得
  const token = grecaptcha.getResponse();
  
  if (!token) {
    alert("上の「私はロボットではありません」にチェックを入れてください。");
    return;
  }

  const submitBtn = document.getElementById('commentSubmitBtn');
  submitBtn.disabled = true;

  const name = document.getElementById('commentName').value;
  const password = document.getElementById('commentPass').value;
  const content = document.getElementById('commentText').value;

  localStorage.setItem('comment_saved_name', name);
  localStorage.setItem('comment_saved_pass', password);

  // トークンをデータに混ぜてGASに送る
  const data = { name, password, content, parentId: '', recaptchaToken: token };

  await sendComment(data);
  
  document.getElementById('commentForm').reset();
  document.getElementById('commentName').value = name;
  document.getElementById('commentPass').value = password;
  
  // ★送信が成功したらチェックボックスをまっさらにリセットする
  grecaptcha.reset();
  
  submitBtn.disabled = false;
}

  // 返信コメントの送信処理
async function submitReply(button, parentId) {
  const wrapper = button.parentElement;
  const name = wrapper.querySelector('.reply-name').value;
  const password = wrapper.querySelector('.reply-pass').value;
  const content = wrapper.querySelector('.reply-text').value;
  
  if(!name || !password || !content) return alert('全ての項目を入力してください。');
  
  // ★1. 画面中央の共通reCAPTCHAから認証トークンを取得
  const token = grecaptcha.getResponse();
  
  if (!token) {
    alert("「私はロボットではありません」にチェックを入れてください。");
    return;
  }
  
  // LocalStorageに入力内容を保存（同期）
  localStorage.setItem('comment_saved_name', name);
  localStorage.setItem('comment_saved_pass', password);
  
  // 親フォーム側の表示も同期させる
  document.getElementById('commentName').value = name;
  document.getElementById('commentPass').value = password;

  button.disabled = true;

  // ★2. 送信データに「recaptchaToken」を含める（GAS側のdoPostで自動的に検証されます）
  const data = { 
    name, 
    password, 
    content, 
    parentId, 
    recaptchaToken: token 
  };

  await sendComment(data);
  
  // ★3. 送信が成功したら、チェックボックスをまっさらにリセットする
  grecaptcha.reset();
}
  async function sendComment(data) {
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if(result.status === 'success') {
        allComments = result.data;
        renderComments(allComments);
      } else {
        alert("エラーが発生しました: " + result.message);
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
      console.error(error);
    }
  }

  // ★返信フォームの開閉切り替え（開いた瞬間に自動入力する処理を追加）
  function toggleReplyForm(button) {
    const form = button.nextElementSibling;
    const isHidden = form.style.display === 'none';
    
    if (isHidden) {
      form.style.display = 'block';
      button.textContent = 'キャンセル';
      
      // ★開いた瞬間にLocalStorageから名前とパスワードを自動セットする
      const savedName = localStorage.getItem('comment_saved_name') || '';
      const savedPass = localStorage.getItem('comment_saved_pass') || '';
      form.querySelector('.reply-name').value = savedName;
      form.querySelector('.reply-pass').value = savedPass;
    } else {
      form.style.display = 'none';
      button.textContent = '返信する';
    }
  }

  function toggleMoreComments() {
    visibleCount += 5;
    renderComments(allComments);
  }

// コメントのHTML描画処理
function renderComments(comments) {
  const container = document.getElementById('commentContainer');
  container.innerHTML = '';
  
  const parents = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);
  
  if(parents.length === 0) {
    container.innerHTML = '<p>まだ投稿はありません。</p>';
    return;
  }

  const reversedParents = [...parents].reverse();
  const displayedParents = reversedParents.slice(0, visibleCount);
  
  const btn = document.getElementById('toggleCommentsBtn');
  if (reversedParents.length > visibleCount) {
    btn.style.display = 'block';
    btn.textContent = `さらに読み込む (残り ${reversedParents.length - visibleCount} 件)`;
  } else {
    btn.style.display = 'none';
  }

  displayedParents.forEach(parent => {
    const thread = document.createElement('div');
    thread.className = 'comment-thread';
    
    // ★親コメントの見出し部分で「formatDate(parent.timestamp)」を使用
    thread.innerHTML = `
      <div class="comment-box parent-comment">
        <div class="comment-header">
          <strong>${escapeHtml(parent.name)}</strong>
          <span class="hash-tag">#${parent.passwordHash}</span>
          <span class="comment-date">${formatDate(parent.timestamp)}</span>
        </div>
        <p class="comment-content">${escapeHtml(parent.content)}</p>
        <button class="reply-trigger" onclick="toggleReplyForm(this)">返信する</button>
        <div class="reply-form-wrapper" style="display: none;">
          <div class="comment-form-grid" style="margin-bottom:8px;">
            <input type="text" placeholder="名前" class="reply-name" style="width:50%; padding:5px;" required>
            <input type="password" placeholder="パスワード" class="reply-pass" style="width:50%; padding:5px;" required>
          </div>
          <textarea placeholder="返信を入力..." rows="2" class="reply-text" style="width:100%; padding:5px; box-sizing:border-box;" required></textarea>
          <button onclick="submitReply(this, '${parent.id}')">返信を送信</button>
        </div>
      </div>
    `;

    const childComments = replies.filter(r => r.parentId === parent.id);
    if(childComments.length > 0) {
      const repliesGroup = document.createElement('div');
      repliesGroup.className = 'replies-group';
      
      childComments.forEach(child => {
        // ★返信コメントの見出し部分でも「formatDate(child.timestamp)」を使用
        repliesGroup.innerHTML += `
          <div class="comment-box reply-comment">
            <div class="comment-header">
              <strong>${escapeHtml(child.name)}</strong>
              <span class="hash-tag">#${child.passwordHash}</span>
              <span class="comment-date">${formatDate(child.timestamp)}</span>
            </div>
            <p class="comment-content">${escapeHtml(child.content)}</p>
          </div>
        `;
      });
      thread.appendChild(repliesGroup);
    }
    container.appendChild(thread);
  });
}

  function escapeHtml(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  // 日時を「yyyy/M/d H:mm」形式（日本時間）に変換する関数
  function formatDate(val) {
    if (!val) return '';
  
    const date = new Date(val);
  
    // 有効な日付データでない場合はそのまま返す
    if (isNaN(date.getTime())) return val;
  
    // 日本時間（JST）のタイムゾーンで各要素を抽出
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  
    // パーツごとに分解して組み立て直す
    const parts = formatter.formatToParts(date);
    const hash = {};
    parts.forEach(p => hash[p.type] = p.value);
  
    return `${hash.year}/${hash.month}/${hash.day} ${hash.hour}:${hash.minute}`;
  }
