import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
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
const videosCollection = collection(db, "videos");

let videosData = [];

async function fetchVideosFromFirebase() {
  const snapshot = await getDocs(videosCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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

function requestDelete(id) {
  $('#deleteVideoIndex').val(id);
  $('#deletePasswordInput').val('');
  $('#deletePasswordError').addClass('d-none');
  const modal = new bootstrap.Modal(document.getElementById('deletePasswordModal'));
  modal.show();
}

async function loadVideos() {
  videosData = await fetchVideosFromFirebase();

  const grouped = {};
  videosData.forEach((video) => {
    if (!video.link) return;
    if (!grouped[video.group]) grouped[video.group] = [];
    grouped[video.group].push(video);
  });

  const sortedGroups = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
  let html = '';
  for (const group of sortedGroups) {
    html += `<div class="mb-5">
               <h3 class="text-center">Đợt Live ${group}</h3>
               <div class="video-slider">`;
    grouped[group].sort((a, b) => a.name.localeCompare(b.name));
    grouped[group].forEach(video => {
      html += `
        <div class="video-card">
          <div class="card h-100">
            ${getEmbedHtml(video.link)}
            <div class="card-body text-center">
              <p class="card-text">${video.name}</p>
              <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-sm btn-outline-warning" onclick="openEditModal('${video.id}')">✏️ Sửa</button>
                <button class="btn-delete" onclick="requestDelete('${video.id}')">🗑 Xoá</button>
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

window.openEditModal = function (id) {
  const video = videosData.find(v => v.id === id);
  if (!video) return;
  $('#editVideoIndex').val(video.id);
  $('#editVideoGroup').val(video.group);
  $('#editVideoName').val(video.name);
  $('#editVideoLink').val(video.link);
  const editModal = new bootstrap.Modal(document.getElementById('editVideoModal'));
  editModal.show();
};

window.saveVideoChanges = async function () {
  const id = $('#editVideoIndex').val();
  const newGroup = $('#editVideoGroup').val().trim();
  const newName = $('#editVideoName').val().trim();

  if (!newGroup || !newName) {
    alert("Bạn chưa nhập đầy đủ thông tin!");
    return;
  }

  await updateDoc(doc(db, "videos", id), {
    group: newGroup,
    name: newName
  });

  await loadVideos();
  const editModal = bootstrap.Modal.getInstance(document.getElementById('editVideoModal'));
  editModal.hide();
};

$(document).ready(function () {
  loadVideos();

  const PASSWORD = "nhi123";

  const now = new Date();
  if (now.getHours() >= 18) document.body.classList.add('eye-protection');

  let inactivityTimer;
  const INACTIVITY_LIMIT = 30 * 1000;

  function startInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      $('#addVideoWrapper').slideUp(200);
      $('#toggleFormBtn').html('➕ Hiển thị Form Thêm Video');
    }, INACTIVITY_LIMIT);
  }

  $('#toggleFormBtn').on('click', function () {
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
    if (newState) startInactivityTimer();
  });

  $('#confirmPasswordBtn').on('click', function () {
    const inputVal = $('#passwordInput').val();
    const modal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
    const modalContent = document.querySelector('#passwordModal .modal-content');
    if (inputVal !== PASSWORD) {
      $('#passwordError').removeClass('d-none');
      modalContent.classList.add('shake');
      setTimeout(() => modalContent.classList.remove('shake'), 500);
      return;
    }
    window.formAllowed = true;
    $('#toggleFormBtn').html('➖ Ẩn Form Thêm Video');
    $('#addVideoWrapper').slideDown(200);
    modal.hide();
    startInactivityTimer();
  });

  $('#confirmDeleteBtn').on('click', async function () {
    const inputVal = $('#deletePasswordInput').val();
    const modal = bootstrap.Modal.getInstance(document.getElementById('deletePasswordModal'));
    if (inputVal !== PASSWORD) {
      $('#deletePasswordError').removeClass('d-none');
      document.querySelector('#deletePasswordModal .modal-content').classList.add('shake');
      setTimeout(() => {
        document.querySelector('#deletePasswordModal .modal-content').classList.remove('shake');
      }, 500);
      return;
    }
    const id = $('#deleteVideoIndex').val();
    await deleteDoc(doc(db, "videos", id));
    await loadVideos();
    modal.hide();
  });

  $('#addVideoForm input').on('input', function () {
    startInactivityTimer();
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

    await addDoc(videosCollection, { name, link, group });
    $('#videoName').val('');
    $('#videoLink').val('');
    $('#videoGroup').val('');
    await loadVideos();
    startInactivityTimer();
  });

  $('#exportBtn').on('click', async function () {
    const data = await fetchVideosFromFirebase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "danhsach_video.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});
