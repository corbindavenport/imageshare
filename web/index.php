<!DOCTYPE html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare</title>
    <meta name="robots" content="noindex">
    <meta name="viewport" content="initial-scale=1">
    <link rel="stylesheet" type="text/css" href="styles.css">
    <link href="favicon.ico" rel="icon" type="image/x-icon">
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-59452245-7"></script>
    <script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());

    gtag('config', 'UA-59452245-7');
    </script>
</head>

<body>

    <div class="header">ImageShare</div>

    <div class="container">

        <div class="panel upload-panel">
            <div class="panel-title">Upload image</div>
            <div class="body">
                <form action="index.php" id="upload-form" enctype="multipart/form-data" method="POST">
                    <p>ImageShare allows easy transfer of images using QR codes. See <a href="//imgshare.corbin.io/" target="_blank">imgshare.corbin.io</a> for more information. Bookmark this page for easy access!</p>
                    <p><input name="img" id="img-btn" type="file" /></p>
                    <p><input name="submit" type="submit" value="Upload" /></p>
                </form>
            </div>
        </div>
        <?php
        if(isset($_POST['submit'])){

          // Set software string
          $software = '';
          
          // Convert image to base64
          $img = $_FILES['img'];
          $filename = $img['tmp_name'];
          $handle = fopen($filename, "r");
          $data = fread($handle, filesize($filename));
          $base64 = base64_encode($data);

          // Get EXIF data
          $exif = exif_read_data($handle);
          if (is_array($exif)) {
            // Read software string in 3DS screenshots
            if ($exif['Model'] === 'Nintendo 3DS') {
              $software = $exif['Software'];
            }
          }

          // Set post fields
          $post = [
            'key' => getenv('API_KEY'),
            'image' => $base64,
          ];
          $ch = curl_init('https://api.imgbb.com/1/upload');
          curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
          curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

          // Upload image
          $output = curl_exec($ch);
          curl_close($ch);

          // Print QR code
          $pms = json_decode($output,true);
          $imgurl = $pms['data']['url'];
          $img = '
            <div class="panel qr-panel">
              <div class="body" align="center">
                <img title="'.$software.'" src="//chart.googleapis.com/chart?chs=300x300&cht=qr&chld=L|0&chl='.$imgurl.'">
              </div>
            </div>';
          echo $img;
          
        }
    ?>
    </div>

    <script>
    // Scroll to bottom of page (for dual-screen devices)
    window.scrollTo(0, document.body.scrollHeight);
    </script>

</body>