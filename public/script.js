$(document).ready(function() {
    // Xử lý form upload video
    $('#uploadForm').on('submit', function(e) {
        e.preventDefault();
        var formData = new FormData(this);
        $.ajax({
            url: '/upload', // Gọi endpoint backend
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if(response.success) {
                    $('#uploadMessage').html('<div class="alert alert-success">Upload thành công!</div>');
                    loadVideos();
                } else {
                    $('#uploadMessage').html('<div class="alert alert-danger">' + response.message + '</div>');
                }
            },
            error: function(error) {
                $('#uploadMessage').html('<div class="alert alert-danger">Lỗi upload: ' + error.responseJSON.message + '</div>');
            }
        });
    });

    // Hàm tải danh sách video từ backend (lấy từ GitHub)
    function loadVideos() {
        $.ajax({
            url: '/videos',
            type: 'GET',
            success: function(videos) {
                let html = '';
                if(videos.length === 0) {
                    html = '<p>Chưa có video nào được upload.</p>';
                } else {
                    videos.forEach(function(video) {
                        html += `
                            <div class="col-md-4 mb-4">
                                <div class="card">
                                    <video class="card-img-top" controls style="height:200px; object-fit:cover;">
                                        <source src="${video.download_url}" type="video/mp4">
                                        Trình duyệt không hỗ trợ video.
                                    </video>
                                    <div class="card-body">
                                        <p class="card-text">${video.name}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
                $('#videoList').html(html);
            },
            error: function() {
                $('#videoList').html('<p>Có lỗi khi tải danh sách video.</p>');
            }
        });
    }

    // Tải danh sách video khi trang được tải
    loadVideos();
});
