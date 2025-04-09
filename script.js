import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBK16HYueTw9dPDZd_v5dy7feIjS7O3ZGI",
  authDomain: "videolive-8b601.firebaseapp.com",
  projectId: "videolive-8b601",
  storageBucket: "videolive-8b601.appspot.com",
  messagingSenderId: "1049405068932",
  appId: "1:1049405068932:web:95835c5720d486fd8154d1",
  measurementId: "G-5SYF46SZWR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const videosDocRef = doc(db, "videos", "videos");
const passwordDocRef = doc(db, "settings", "security");

let videosData = [];

async function fetchVideos() {
  const snap = await getDoc(videosDocRef);
  return snap.exists() ? snap.data().data || [] : [];
}

async function saveVideos(data) {
  await setDoc(videosDocRef, { data });
}

async function getPassword() {
  const snap = await getDoc(passwordDocRef);
  return snap.exists() ? snap.data().password : null;
}

function showToast(message, type = 'success') {
  const toastEl = document.getElementById('toast');
  toastEl.classList.remove('text-bg-success', 'text-bg-danger');
  toastEl.classList.add(`text-bg-${type}`);
  document.getElementById('toastBody').textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

function getEmbedHtml(link) {
  if (link.toLowerCase().includes("<iframe")) {
    return `<div class="video-iframe-container">${link}</div>`;
  }
  if (link.includes("youtube.com") || link.includes("youtu.be")) {
    let embedUrl = "";
    if (link.includes("watch?v=")) {
      embedUrl = link.replace("watch?v=", "embed/");
    } else if (link.includes("youtu.be")) {
      const id = link.split("/").pop();
      embedUrl = "https://www.youtube.com/embed/" + id;
    } else {
      embedUrl = link;
    }
    return `<div class="video-iframe-container">
              <iframe src="${embedUrl}" allowfullscreen></iframe>
            </div>`;
  }
  return `<div class="video-container">
            <video controls>
              <source src="${link}" type="video/mp4">
              Trình duyệt không hỗ trợ video.
            </video>
          </div>`;
}

function loadVideosToDOM() {
  const grouped = {};
  videosData.forEach((video, index) => {
    if (!grouped[video.group]) grouped[video.group] = [];
    grouped[video.group].push({ ...video, _index: index });
  });

  if (videosData.length === 0) {
    $('#videoSections').html('<div class="text-center text-muted mt-4">🚫 Chưa có video nào!</div>');
    return;
  }

  const sortedGroups = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
  let html = '';
  for (const group of sortedGroups) {
    html += `<div class="mb-5"><h3 class="text-center">Đợt Live ${group}</h3><div class="video-slider">`;
    grouped[group].sort((a, b) => a.name.localeCompare(b.name));
    grouped[group].forEach(video => {
      html += `
        <div class="video-card">
          <div class="card h-100">
            ${getEmbedHtml(video.link)}
            <div class="card-body text-center">
              <p class="card-text">${video.name}</p>
              <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-sm btn-outline-warning" onclick="openEditModal(${video._index})">✏️ Sửa</button>
                <button class="btn-delete" onclick="requestDelete(${video._index})">🗑 Xoá</button>
              </div>
            </div>
          </div>
        </div>`;
    });
    html += `</div></div>`;
  }

  $('#videoSections').html(html);

  setTimeout(() => {
    document.querySelectorAll('.video-container video').forEach(video => {
      video.addEventListener('mouseenter', () => video.play());
      video.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });
  }, 100);
}

window.openEditModal = function (index) {
  const video = videosData[index];
  $('#editVideoIndex').val(index);
  $('#editVideoGroup').val(video.group);
  $('#editVideoName').val(video.name);
  $('#editVideoLink').val(video.link);
  const editModal = new bootstrap.Modal(document.getElementById('editVideoModal'));
  editModal.show();
};

window.saveVideoChanges = async function () {
  const index = $('#editVideoIndex').val();
  const newGroup = $('#editVideoGroup').val().trim();
  const newName = $('#editVideoName').val().trim();

  if (!newGroup || !newName) {
    alert("Bạn chưa nhập đầy đủ thông tin!");
    return;
  }

  videosData[index].group = newGroup;
  videosData[index].name = newName;
  await saveVideos(videosData);
  loadVideosToDOM();
  showToast("💾 Đã lưu thay đổi!");

  const editModal = bootstrap.Modal.getInstance(document.getElementById('editVideoModal'));
  editModal.hide();
};

window.requestDelete = function (index) {
  $('#deleteVideoIndex').val(index);
  $('#deletePasswordInput').val('');
  $('#deletePasswordError').addClass('d-none');
  const modal = new bootstrap.Modal(document.getElementById('deletePasswordModal'));
  modal.show();
};


// ⏱ DARK MODE TỰ ĐỘNG
// 🌅 Nền chuyển màu theo giờ trong ngày
function applyAutoDarkMode() {
  const hour = new Date().getHours();
  let bgColor = '#ffffff'; // default sáng

  if (hour >= 5 && hour < 8) bgColor = '#FFF9C4';      // sáng sớm
  else if (hour >= 8 && hour < 17) bgColor = '#ffffff'; // ban ngày
  else if (hour >= 17 && hour < 19) bgColor = '#FFE0B2'; // hoàng hôn
  else if (hour >= 19 && hour < 22) bgColor = '#263238'; // tối nhẹ
  else bgColor = '#1c1c2a';                              // đêm khuya

  document.body.style.backgroundColor = bgColor;
}
applyAutoDarkMode();
setInterval(applyAutoDarkMode, 60 * 1000); // mỗi phút cập nhật 1 lần

$(document).ready(async function () {
  let inactivityTimer;
  videosData = await fetchVideos();
  loadVideosToDOM();

  $('#toggleFormBtn').on('click', async function () {
    const isVisible = $('#addVideoWrapper').is(':visible');
    if (!window.formAllowed) {
      const modal = new bootstrap.Modal(document.getElementById('passwordModal'));
      $('#passwordInput').val('');
      $('#passwordError').addClass('d-none');
      modal.show();
      return;
    }
    const newState = !isVisible;
    $('#addVideoWrapper').slideToggle(200);
    $(this).html(newState ? '➖ Ẩn Form Thêm Video' : '➕ Hiển thị Form Thêm Video');
    if (newState) resetInactivityTimer();
  });

  $('#confirmPasswordBtn').on('click', async function () {
    const inputVal = $('#passwordInput').val();
    const modal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
    const modalContent = document.querySelector('#passwordModal .modal-content');

    const truePassword = await getPassword();
    if (inputVal !== truePassword) {
      $('#passwordError').removeClass('d-none');
      modalContent.classList.add('shake');
      setTimeout(() => modalContent.classList.remove('shake'), 500);
      return;
    }

    window.formAllowed = true;
    $('#toggleFormBtn').html('➖ Ẩn Form Thêm Video');
    $('#addVideoWrapper').slideDown(200);
    modal.hide();
    resetInactivityTimer();
  });

  $('#confirmDeleteBtn').on('click', async function () {
    const inputVal = $('#deletePasswordInput').val();
    const modal = bootstrap.Modal.getInstance(document.getElementById('deletePasswordModal'));

    const truePassword = await getPassword();
    if (inputVal !== truePassword) {
      $('#deletePasswordError').removeClass('d-none');
      document.querySelector('#deletePasswordModal .modal-content').classList.add('shake');
      setTimeout(() => {
        document.querySelector('#deletePasswordModal .modal-content').classList.remove('shake');
      }, 500);
      return;
    }

    const index = parseInt($('#deleteVideoIndex').val());
    if (!isNaN(index) && index >= 0 && index < videosData.length) {
      videosData.splice(index, 1);
      await saveVideos(videosData);
      loadVideosToDOM();
      showToast("🗑 Đã xoá video!", 'danger');
    }

    modal.hide();
  });

  $('#addVideoForm input').on('input', function () {
    resetInactivityTimer();
  });

  $('#addVideoForm').on('submit', async function (e) {
    e.preventDefault();
    const name = $('#videoName').val().trim();
    const link = $('#videoLink').val().trim();
    const group = $('#videoGroup').val().trim();
    if (!link || !group || !name) {
      alert("Bạn chưa nhập đầy đủ thông tin!");
      return;
    }

    videosData.unshift({ name, link, group });
    await saveVideos(videosData);
    $('#videoName').val('');
    $('#videoLink').val('');
    $('#videoGroup').val('');
    loadVideosToDOM();
    showToast("✅ Video đã được thêm!");
    resetInactivityTimer();
  });

  $('#exportBtn').on('click', async function () {
    const blob = new Blob([JSON.stringify(videosData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "danhsach_video.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  $('#passwordInput').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#confirmPasswordBtn').click();
    }
  });

  $('#deletePasswordInput').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#confirmDeleteBtn').click();
    }
  });

  $('#passwordModal').on('shown.bs.modal', function () {
    $('#passwordInput').focus();
  });

  const INACTIVITY_LIMIT = 90 * 1000;
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      $('#addVideoWrapper').slideUp(200);
      $('#toggleFormBtn').html('➕ Hiển thị Form Thêm Video');
      window.formAllowed = false;
    }, INACTIVITY_LIMIT);
  }

  $(document).on('mousemove keydown click scroll', () => {
    if ($('#addVideoWrapper').is(':visible') && window.formAllowed) {
      resetInactivityTimer();
    }
  });
});

function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  const timeStr = `${h}:${m}:${s}`;
  document.getElementById("liveClock").textContent = timeStr;
}

updateClock(); // gọi ngay để không trễ 1 giây
setInterval(updateClock, 1000); // cập nhật mỗi giây