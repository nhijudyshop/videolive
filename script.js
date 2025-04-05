let videosData = [];

if (localStorage.getItem('videosData')) {
  videosData = JSON.parse(localStorage.getItem('videosData'));
}

function saveToLocalStorage() {
  localStorage.setItem('videosData', JSON.stringify(videosData));
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

function requestDelete(index) {
  $('#deleteVideoIndex').val(index);
  $('#deletePasswordInput').val('');
  $('#deletePasswordError').addClass('d-none');
  const modal = new bootstrap.Modal(document.getElementById('deletePasswordModal'));
  modal.show();
}

async function loadVideos() {
  try {
    const res = await fetch('videos.json');
    const videos = await res.json();

    // Sắp xếp & hiển thị như trước
    const grouped = {};
    videos.forEach((video, index) => {
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
      grouped[group].forEach(video => {
        html += `
          <div class="video-card">
            <div class="card h-100">
              ${getEmbedHtml(video.link)}
              <div class="card-body text-center">
                <p class="card-text">${video.name}</p>
              </div>
            </div>
          </div>`;
      });
      html += `</div></div>`;
    }

    $('#videoSections').html(html);
  } catch (err) {
    console.error("❌ Không thể tải video:", err);
  }
}


$(document).ready(function () {
  loadVideos();

  const PASSWORD = "nhi123";
  const savedFormState = localStorage.getItem('formVisible');
  const formAllowed = localStorage.getItem('formAllowed') === 'true';

  const now = new Date();
  if (now.getHours() >= 18) document.body.classList.add('eye-protection');

  let inactivityTimer;
  const INACTIVITY_LIMIT = 30 * 1000;

  function startInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      $('#addVideoWrapper').slideUp(200);
      $('#toggleFormBtn').html('➕ Hiển thị Form Thêm Video');
      localStorage.removeItem('formAllowed');
      localStorage.setItem('formVisible', false);
    }, INACTIVITY_LIMIT);
  }

  if (formAllowed && savedFormState === 'true') {
    $('#addVideoWrapper').show();
    $('#toggleFormBtn').html('➖ Ẩn Form Thêm Video');
    startInactivityTimer();
  }

  $('#toggleFormBtn').on('click', function () {
    const isVisible = $('#addVideoWrapper').is(':visible');
    const allowed = localStorage.getItem('formAllowed') === 'true';
    if (!allowed) {
      const modal = new bootstrap.Modal(document.getElementById('passwordModal'));
      $('#passwordInput').val('');
      $('#passwordError').addClass('d-none');
      modal.show();
      return;
    }
    const newState = !isVisible;
    $('#addVideoWrapper').slideToggle(200);
    $(this).html(newState ? '➖ Ẩn Form Thêm Video' : '➕ Hiển thị Form Thêm Video');
    localStorage.setItem('formVisible', newState);
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
    localStorage.setItem('formAllowed', true);
    localStorage.setItem('formVisible', true);
    $('#toggleFormBtn').html('➖ Ẩn Form Thêm Video');
    $('#addVideoWrapper').slideDown(200);
    modal.hide();
    startInactivityTimer();
  });

  $('#confirmDeleteBtn').on('click', function () {
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
    const index = $('#deleteVideoIndex').val();
    videosData.splice(index, 1);
    saveToLocalStorage();
    loadVideos();
    modal.hide();
  });

  $('#passwordInput').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#confirmPasswordBtn').click();
    }
  });

  $('#addVideoForm input').on('input', function () {
    startInactivityTimer();
  });

  $('#addVideoForm').on('submit', function (e) {
    e.preventDefault();
    const name = $('#videoName').val().trim();
    const link = $('#videoLink').val().trim();
    const group = $('#videoGroup').val().trim();
    if (!link || !group) {
      alert("Bạn chưa nhập đầy đủ thông tin!");
      return;
    }
    videosData.unshift({ name, link, group });
    // Gửi dữ liệu đến PHP để lưu vào videos.json
    fetch('save_video.php', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, link, group })
    }).then(res => res.text()).then(text => {
      console.log("PHP response:", text);
    }).catch(err => {
      console.error("❌ Lỗi gửi PHP:", err);
    });
    saveToLocalStorage();
    $('#videoName').val('');
    $('#videoLink').val('');
    $('#videoGroup').val('');
    loadVideos();
    startInactivityTimer();
  });

  $('#exportBtn').on('click', function () {
    const blob = new Blob([JSON.stringify(videosData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "danhsach_video.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      localStorage.removeItem('formAllowed');
      localStorage.setItem('formVisible', false);
    }
  });
});

// Mở Modal Sửa
function openEditModal(index) {
  const video = videosData[index];
  $('#editVideoIndex').val(index);
  $('#editVideoGroup').val(video.group);
  $('#editVideoName').val(video.name);
  $('#editVideoLink').val(video.link);
  const editModal = new bootstrap.Modal(document.getElementById('editVideoModal'));
  editModal.show();
}

// Lưu chỉnh sửa
function saveVideoChanges() {
  const index = $('#editVideoIndex').val();
  const newGroup = $('#editVideoGroup').val().trim();
  const newName = $('#editVideoName').val().trim();

  if (!newGroup || !newName) {
    alert("Bạn chưa nhập đầy đủ thông tin!");
    return;
  }

  videosData[index].group = newGroup;
  videosData[index].name = newName;
  saveToLocalStorage();
  loadVideos();

  const editModal = bootstrap.Modal.getInstance(document.getElementById('editVideoModal'));
  editModal.hide();
}
