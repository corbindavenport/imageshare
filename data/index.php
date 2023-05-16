<!DOCTYPE html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare</title>
    <link rel="stylesheet" type="text/css" href="styles.css">
    <meta name="description" content="ImageShare is a lightweight web app for uploading images, created for the Nintendo 3DS and other legacy web browsers.">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <!-- Viewport size and analytics -->
    <?php
    // Viewport size
    $is3DS = strpos($_SERVER['HTTP_USER_AGENT'], 'Nintendo 3DS');
    $isNew3DS = strpos($_SERVER['HTTP_USER_AGENT'], 'New Nintendo 3DS');
    if ($is3DS && !($isNew3DS)) {
      // This is required for proper viewport size on old 3DS web browser
      echo '<meta name="viewport" content="width=320" />'.PHP_EOL;
    } else {
      // Normal mobile scaling for New 3DS Browser and everything else
      echo '<meta name="viewport" content="initial-scale=1">'.PHP_EOL;
    }
    // Send Plausible analytics data for pageview
    if (str_contains($_SERVER['HTTP_HOST'], 'theimageshare.com')) {
      $data = array(
        'name' => 'pageview',
        'url' => 'https://theimageshare.com/',
        'domain' => 'theimageshare.com',
      );
      $post_data = json_encode($data);
      // Prepare new cURL resource
      $crl = curl_init('https://plausible.io/api/event');
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
    }
    ?>
    <!-- Icons -->
    <?php
    // Use a 16x16 favicon for the 3DS and Wii, larger icons in multiple sizes for other browsers
    if (str_contains($_SERVER['HTTP_USER_AGENT'], 'Nintendo')) {
      echo '<link rel="icon" href="favicon.ico" type="image/x-icon">'.PHP_EOL;
    } else {
      echo '<link rel="apple-touch-icon" sizes="192x192" href="img/maskable_icon_x192.png">'.PHP_EOL;
      echo '    <link rel="icon" type="image/png" sizes="16x16" href="img/favicon_x16.png">'.PHP_EOL;
      echo '    <link rel="icon" type="image/png" sizes="24x24" href="img/favicon_x24.png">'.PHP_EOL;
    }
    ?>
    <!-- Twitter card -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:creator" content="@corbindavenport" />
    <meta name="twitter:title" content="ImageShare" />
    <meta name="twitter:description" content="ImageShare is a lightweight web app for uploading images, created for the Nintendo 3DS and other legacy web browsers." />
    <meta name="twitter:image" content="https://theimageshare.com/img/maskable_icon_x512.png" />
    <meta name="twitter:image:alt" content="ImageShare app icon" />
</head>

<body>

    <div class="header">ImageShare</div>

    <div class="container">

        <?php
        // Turn off all error reporting
        error_reporting(0);

        if(isset($_POST['submit'])){

          // Set initial info
          $software = 'ImageShare Upload';
          $description = 'Uploaded with ImageShare: https://github.com/corbindavenport/imageshare';
          
          // Open image
          $img = $_FILES['img'];
          $filename = $img['tmp_name'];
          $handle = fopen($filename, "r");
          $data = fread($handle, filesize($filename));

          // Get EXIF data
          $exif = exif_read_data($handle);
          if (is_array($exif) && array_key_exists('Model', $exif)) {

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
              'image' => $data,
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

          // Parse result
          $pms = json_decode($output,true);
          $id = $pms['data']['id'];
          $imgurl = $pms['data']['link'];
          $delete_hash = $pms['data']['deletehash'];
          // For debugging: var_dump($pms);

          // Send to Discord if enabled
          if (isset($_COOKIE["discord_webhook"])) {
            $webhook_curl = curl_init();
            curl_setopt_array($webhook_curl, array(
              CURLOPT_URL => $_COOKIE["discord_webhook"],
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS => '{
                "content": null,
                "embeds": [
                  {
                    "title": "'.$software.'",
                    "url": "https://imgur.com/'.$id.'",
                    "color": null,
                    "footer": {
                      "text": "Uploader: '.$_SERVER["HTTP_USER_AGENT"].'"
                    },
                    "image": {
                      "url": "'.$imgurl.'"
                    }
                  },
                  {
                    "color": null,
                    "author": {
                      "name": "Donate via PayPal",
                      "url": "https://paypal.me/corbindav",
                      "icon_url": "https://i.imgur.com/QLhiS7y.png"
                    }
                  },
                  {
                    "color": null,
                    "author": {
                      "name": "Donate via Cash App",
                      "url": "https://cash.app/$corbdav",
                      "icon_url": "https://i.imgur.com/Bx4gHCP.png"
                    }
                  }
                ],
                "username": "ImageShare",
                "avatar_url": "https://i.imgur.com/bmjhpX4.png",
                "attachments": []
              }',
              CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
              ),
            ));
            $discord_output = curl_exec($webhook_curl);
            curl_close($webhook_curl);
          }

          // Display result
          $out = '
            <div class="panel qr-panel">
              <div class="panel-title">'.$software.'</div>
              <div class="body">
                <center>
                  <a href="https://imgur.com/'.$id.'" target="_blank">
                    <img alt="QR code (click to open page in new window)" src="//chart.googleapis.com/chart?chs=300x300&cht=qr&chld=L|0&chl=https://imgur.com/'.$id.'">
                  </a>
                  <form action="delete.php" id="upload-form" enctype="multipart/form-data" method="POST">
                    <p><input name="submit" type="submit" value="Delete image" /></p>
                    <input type="hidden" name="id" value="'.$delete_hash.'" />
                  </form>
                </center>
              </div>
            </div>';
          echo $out;

          // Send analytics for upload
          if (str_contains($_SERVER['HTTP_HOST'], 'theimageshare.com')) {
            $data = array(
              'name' => 'Upload',
              'url' => 'https://theimageshare.com/',
              'domain' => 'theimageshare.com',
            );
            $post_data = json_encode($data);
            // Prepare new cURL resource
            $crl = curl_init('https://plausible.io/api/event');
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
          }
          
        }
  ?>

  <div class="panel upload-panel">
        <div class="panel-title">Upload Image</div>
        <div class="body">
          <?php
          // HTTP warning: https://github.com/corbindavenport/imageshare/issues/14
          if (str_contains($_SERVER['HTTP_USER_AGENT'], 'Nintendo')) {
            // Do nothing
          } else {
            echo '<p><b>If you can no longer connect to ImageShare on the 3DS, Wii U, or other legacy browser/device, replace HTTPS in the bookmark with HTTP.</b></p>';
          }
          ?>
          <!-- Main upload form -->
          <form action="index.php" id="upload-form" enctype="multipart/form-data" method="POST">
            <p><input name="img" id="img-btn" type="file" /></p>
            <p><input name="submit" type="submit" value="Upload" /></p>
          </form>
          <!-- Discord integration (doesn't work on Nintendo browsers yet) -->
          <?php
          if (str_contains($_SERVER['HTTP_USER_AGENT'], 'Nintendo')) {
            // Do nothing
          } else {
            echo '<p><a href="/discord.php">Open Discord settings</a></p>';
          }
          ?>
          <!-- Description -->
          <p>ImageShare is a lightweight web app for uploading images with QR codes, created for the Nintendo 3DS and other legacy web browsers. See <a href="https://github.com/corbindavenport/imageshare" target="_blank">tinyurl.com/imgsharegit</a> for more information.</p>
          <p>If you find ImageShare useful, please consider donating to support development and server costs!</p>
          <p style="text-align: center;"><b><a href="https://cash.app/$corbdav" target="_blank">cash.app/$corbdav</a> • <a href="https://paypal.me/corbindav" target="_blank">paypal.me/corbindav</a></b></p>
          <hr />
          <p>Join Discord server: <a href="https://discord.gg/tqJDRsmQVn" target="_blank">discord.gg/tqJDRsmQVn</a></p>
          <p>Follow on Mastodon: <a href="https://toot.community/@corbin" target="_blank">@corbin@toot.community</a>
        </div>
    </div>
        
  </div>

</body>
</html>
