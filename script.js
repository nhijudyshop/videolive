let videosData = [];

if (localStorage.getItem('videosData')) {
  videosData = JSON.parse(localStorage.getItem('videosData'));
} else {
  videosData = [];
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
      let id = link.split("/").pop();
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

function deleteVideo(index) {
  if (confirm("Bạn có chắc muốn xóa video này không?")) {
    videosData.splice(index, 1);
    saveToLocalStorage();
    loadVideos();
  }
}

function loadVideos() {
  const grouped = {};

  videosData.forEach((video, index) => {
    if (!video.link) return;
    if (!grouped[video.group]) grouped[video.group] = [];
    grouped[video.group].push({ ...video, _index: index });
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
            <div class="card-body">
              <p class="card-text">${video.name}</p>
              <button class="btn-delete" onclick="deleteVideo(${video._index})">🗑 Xoá</button>

            </div>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  }

  $('#videoSections').html(html);
}


$(document).ready(function () {
  loadVideos();

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
    saveToLocalStorage();
    $('#videoName').val('');
    $('#videoLink').val('');
    $('#videoGroup').val('');
    loadVideos();
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
});
