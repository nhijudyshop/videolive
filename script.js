// Mảng dữ liệu video - cập nhật theo yêu cầu của bạn
const videosData = [
    { name: "D4 250308", link: "https://youtu.be/ZNO-xlr6ylo" },
    { name: "D4 250309", link: "https://youtu.be/BXpOHiEV5sc" },
    { name: "D4 250310", link: "https://youtu.be/wwlpvdVKeco" },
    { name: "D5 250312", link: "https://youtu.be/qnyLkJBEEGk" },
    { name: "D5 250313", link: "https://youtu.be/Z5Ws3JQYWBI" },
    { name: "D5 250314", link: "https://youtu.be/Cgr-TUGaWFk" },
    { name: "D6 250316", link: "https://youtu.be/XdgaGvfbiKE" },
    { name: "D6 250317", link: "https://youtu.be/kNqOZZmirhg" },
    { name: "D6 250318", link: "https://youtu.be/guaLPeXH_XA" },
    { name: "D7 250320", link: "https://youtu.be/gDdQwhBmmyw" },
    { name: "D7 250321", link: "https://youtu.be/5hs75A6NNKk" },
    { name: "D7 250322", link: "https://youtu.be/9DS0wVWukL4" },
    { name: "D8 250324", link: "https://youtu.be/EHGRZwbTwso" },
    { name: "D8 250325", link: "https://youtu.be/a2Vh3fHxAtE" },
    { name: "D8 250326", link: "https://youtu.be/RYRIS92a6SQ" },
    { name: "D9 250331", link: "https://youtu.be/HnXZ6HjfQsQ" },
    { name: "", link: "" },
    { name: "D9 250401", link: "https://youtu.be/zTFJ3KeDaaU" },
    // { name: "", link: "" },
  ];
  
  // Hàm chia mảng thành các nhóm nhỏ (batch)
  function groupArray(arr, groupSize) {
    let groups = [];
    for (let i = 0; i < arr.length; i += groupSize) {
      groups.push(arr.slice(i, i + groupSize));
    }
    return groups;
  }
  
  // Hàm chuyển đổi link thành embed HTML
  function getEmbedHtml(link) {
    // Nếu link chứa đoạn mã iframe, trả về nó trực tiếp được bọc trong container
    if (link.toLowerCase().includes("<iframe")) {
      return `<div class="video-iframe-container">${link}</div>`;
    }
    
    // Nếu link chứa youtube, chuyển sang dạng iframe embed
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      let embedUrl = "";
      if(link.includes("watch?v=")) {
        embedUrl = link.replace("watch?v=", "embed/");
      } else if(link.includes("youtu.be")) {
        let id = link.split("/").pop();
        embedUrl = "https://www.youtube.com/embed/" + id;
      } else {
        embedUrl = link;
      }
      return `<div class="video-iframe-container">
                <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>`;
    }
    
    // Giả sử link là trực tiếp đến file video
    return `<div class="video-container">
              <video controls>
                <source src="${link}" type="video/mp4">
                Trình duyệt không hỗ trợ video.
              </video>
            </div>`;
  }
  
  // Hàm hiển thị video theo batch
  function loadVideos() {
    let html = '';
    if (videosData.length === 0) {
      html = '<p>Chưa có video nào được cập nhật.</p>';
    } else {
      // Mỗi batch chứa 4 video (bạn có thể thay đổi số này)
      const groups = groupArray(videosData, 3);
      groups.forEach(function(group, index) {
        html += `<div class="mb-5">
                    <h3>Đợt Live ${index + 4}</h3>
                    <div class="row">`;
        group.forEach(function(video) {
          html += `
            <div class="col-md-3 mb-3">
              <div class="card">
                ${getEmbedHtml(video.link)}
                <div class="card-body">
                  <p class="card-text">${video.name}</p>
                </div>
              </div>
            </div>
          `;
        });
        html += `   </div>
                 </div>`;
      });
    }
    $('#videoSections').html(html);
  }
  
  // Khi trang được tải, hiển thị video
  $(document).ready(function() {
    loadVideos();
  });
  

  // Sử dụng bộ chọn cho các thuộc tính quan trọng trong style
var divToRemove = document.querySelector(
    'div[style*="text-align: right"][style*="position: fixed"][style*="z-index:9999999"][style*="bottom: 0"][style*="right: 1%"][style*="cursor: pointer"]'
  );
  
  if (divToRemove) {
      divToRemove.remove();
  }