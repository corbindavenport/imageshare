<!DOCTYPE html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare</title>
    <meta name="robots" content="noindex">
    <meta name="viewport" content="initial-scale=1">
    <link rel="stylesheet" type="text/css" href="styles.css">
    <link href="favicon.ico" rel="icon" type="image/x-icon">
    <!-- Use PHP for sending Plausible analytics data -->
    <?php
     $data = array(
         'name' => 'pageview',
         'url' => 'https://imgsharetool.herokuapp.com/',
         'domain' => 'imgsharetool.herokuapp.com',
     );
     $post_data = json_encode($data);
     // Prepare new cURL resource
     $crl = curl_init('httpps://plausible.io/api/event');
     curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
     curl_setopt($crl, CURLINFO_HEADER_OUT, true);
     curl_setopt($crl, CURLOPT_POST, true);
     curl_setopt($crl, CURLOPT_POSTFIELDS, $post_data);
     // Set HTTP Header for POST request 
     curl_setopt($crl, CURLOPT_HTTPHEADER, array(
        'User-Agent: ' . $_SERVER['HTTP_USER_AGENT'],
        'X-Forwarded-For: 127.0.0.1',
        'Content-Type: application/json')
     );
     // Submit the POST request
     $result = curl_exec($crl);
     curl_close($crl);
   ?>
</head>

<body>

    <div class="header">ImageShare</div>

    <div class="container">

        <?php
        if(isset($_POST['submit'])){

          // Set initial info
          $software = 'ImgShare Upload';
          $description = 'Uploaded with ImageShare - imgshare.corbin.io';
          
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
              // Match ID with game title if possible
              $id = strtoupper($exif['Software']);
              $xml=simplexml_load_file('3dsreleases.xml');
              foreach($xml->children() as $game) {
                if ($game->titleid == '000400000'.$id.'00') {
                  // Update software name
                  $software = $game->name;
                  break;
                }
              }
            }
          }

          // Upload image
          $curl = curl_init();
          $client = getenv('API_KEY');
          curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://api.imgur.com/3/image',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => array(
              'image' => $base64,
              'title' => $software,
              'description' => $description
            ),
            CURLOPT_HTTPHEADER => array(
              'Authorization: Client-ID '.$client
            ),
          ));

          // Upload image
          $output = curl_exec($curl);
          curl_close($curl);

          // Print QR code
          $pms = json_decode($output,true);

          $id = $pms['data']['id'];
          $delete_hash = $pms['data']['deletehash'];
          $img = '
            <div class="panel qr-panel">
              <div class="panel-title">'.$software.'</div>
              <div class="body">
                <center>
                  <a href="https://imgur.com/'.$id.'" target="_blank">
                    <img alt="QR code (click to open page in new window)" src="//chart.googleapis.com/chart?chs=300x300&cht=qr&chld=L|0&chl=https://imgur.com/'.$id.'">
                  </a>
                </center>
                <form action="delete.php" id="upload-form" enctype="multipart/form-data" method="POST">
                  <p><input name="submit" type="submit" value="Delete image" /></p>
                  <input type="hidden" name="id" value="'.$delete_hash.'" />
                </form>
              </div>
            </div>';
          echo $img;
          
        }
  ?>

  <div class="panel upload-panel">
        <div class="panel-title">Upload Image</div>
        <div class="body">
            <form action="index.php" id="upload-form" enctype="multipart/form-data" method="POST">
                <p><input name="img" id="img-btn" type="file" /></p>
                <p><input name="submit" type="submit" value="Upload" /></p>
                <p>ImageShare is a lightweight web app for uploading and sharing images using QR codes. See <a href="https://imgshare.corbin.io/" target="_blank">imgshare.corbin.io</a> for more information.</p>
            </form>
        </div>
    </div>
        
  </div>

</body>
</html>