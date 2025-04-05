<?php
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
  http_response_code(400);
  echo "Dữ liệu không hợp lệ";
  exit;
}

$file = 'videos.json';
$videos = [];

if (file_exists($file)) {
  $videos = json_decode(file_get_contents($file), true);
}

array_unshift($videos, $data);
file_put_contents($file, json_encode($videos, JSON_PRETTY_PRINT));
echo "Đã lưu thành công!";
?>
