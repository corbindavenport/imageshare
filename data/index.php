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
      echo '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">'.PHP_EOL;
    }
    // Send Plausible analytics data for pageview if configured
    if (getenv('PLAUSIBLE_DOMAIN')) {
      $data = array(
        'name' => 'pageview',
        'url' => '/',
        'domain' => getenv('PLAUSIBLE_DOMAIN'),
      );
      $crl = curl_init('https://plausible.io/api/event');
      curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($crl, CURLINFO_HEADER_OUT, true);
      curl_setopt($crl, CURLOPT_POST, true);
      curl_setopt($crl, CURLOPT_POSTFIELDS, json_encode($data));
      curl_setopt($crl, CURLOPT_HTTPHEADER, array(
        'User-Agent: ' . $_SERVER['HTTP_USER_AGENT'],
        'X-Forwarded-For: ' . $_SERVER['REMOTE_ADDR'],
        'Content-Type: application/json')
      );
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
    <!-- Web app manifest and Windows tile -->
    <!-- Documentation for Windows tile: https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024(v=vs.85) -->
    <link rel="manifest" href="manifest.json">
    <meta name="application-name" content="ImageShare">
    <meta name="msapplication-TileColor" content="#7e57c2">
    <meta name="msapplication-square150x150logo" content="img/maskable_icon_x192.png">
    <!-- Open Graph card -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="ImageShare" />
    <meta property="og:description" content="ImageShare is a lightweight web app for uploading images, created for the Nintendo 3DS and other legacy web browsers." />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <?php
      $domain = getenv('DOMAIN');
      echo '<meta property="og:url" content="https://'.$domain.'" />'.PHP_EOL;
      echo '    <meta property="og:image" content="https://'.$domain.'/img/maskable_icon_x512.png" />'.PHP_EOL;
    ?>
    <meta name="og:image:alt" content="ImageShare app icon" />
    <meta name="twitter:card" content="summary" />
</head>

<body>

    <div class="header">ImageShare</div>

    <div class="container">

        <?php
        // Turn off all error reporting
        //error_reporting(0);

        if(isset($_POST['submit'])){

          // Set initial info
          $software_label = 'ImageShare Upload';
          $description = 'Uploaded with ImageShare: https://github.com/corbindavenport/imageshare';
          
          // Open image
          // For testing: var_dump($_FILES['img']);
          $img = $_FILES['img'];
          $filename = $img['tmp_name'];
          $handle = fopen($filename, "r"); // We need to catch that.
          $data = fread($handle, filesize($filename));

          // Only read EXIF data from JPEG images
          if ($img['type'] === 'image/jpeg') {
            // Get EXIF data
            $exif = exif_read_data($handle);
            if (is_array($exif) && array_key_exists('Model', $exif)) {
              // Read software string in 3DS screenshots
                // Read software string in 3DS screenshots
                if ($exif['Model'] === 'Nintendo 3DS') {
                  // All the regions from the titlelist
                  // GB = EUR/PAL
                  // KR AND TW are Korea and Taiwan
                  // filenames are titlelist_$region.json
                  // files from hax0kartik/3dsdb(values retrived from eshop directly)
                      
                          /*
                EACH GAME IN THE JSON IS MADE LIKE THIS:
                {
                  "Name": "Shovel Software Insurance Claim",
                  "UID": "50010000049535",
                  "TitleID": "000400000F715C00",
                  "Version": "N/A",
                  "Size": "25.7 MB [206 blocks]",
                  "Product Code": "KTR-N-CF6P",
                  "Publisher": "Batafurai"
                },
    
                BUNCH OF STUFF FOR RATING BUT IT ISN'T WHAT WE SEARCH.(only need names and title id)
    
                  */
                  // DEFAULT IMAGE NAME FOR 3DS TITLES SO ITS NOT UGLY
                  $software_label = "An ImageShare Image from a Nintendo 3DS Game.";
                  $software = array(); // stores all the matching software.
                  $regions = ["GB", "JP", "KR", "TW", "US"]; // GB = PAL(Europe & Australia & africa), JP = japan only, KR = Korea, TW = Taiwan/Hong Kong, US = NTSC-U
                  // Match ID with game title if possible
                  $id = strtoupper($exif['Software']);
                  foreach($regions as $region) { // FOR EACH REGION!!
                    $json=json_decode(file_get_contents('titlelist/list_'.$region.'.json'));
                    foreach($json as $game) {
                      
                      // IDS STARTING WITH 000400000 ARE GAMES
                      if ($game->TitleID == '000400000'.$id.'00') {
                        // Update software name
                        array_push($software, $game); // Push element to the end of the array(similar to .append in python)
                      }
                      // IDS STARTING WITH 0004000E0 ARE UPDATES(needed to fix animal crossing as the title id used is for the welcome amiibo update... maybe other games idk)
                      elseif($game->TitleID == '0004000E0'.$id.'00'){
                        array_push($software, $game); // Push element to the end of the array
                      }
                    }
                  }
              // OK that's ugly mess but: 
              // Usually there's only one game that matches the software EXIF TAG
              // BUT sometimes(quite a lot of times actually.) there are updates that use the same EXIF TAG(Pokémon Sun/X are examples where both the game and their updates are matching...)
              // I still need to check for updates in case(for example to fix animal crossing, somehow) but i want priority on the games themselves
              // Since Games titleId are the same length as updates titleids and that E is after 0(000400000 vs 0004000E0)
              // i can sort the titleId string then and pretty much garantee that the game will be first.
              //i'm using usort() which is a function that sorts arrays using inputted user function.
              // I think it's pretty much guaranteed that the game will be before the updates and i don't think there will be more than 2 entries(i checked on a few games(Pokémon X/Sun, Smash bros, Mario vs Donkey Kong) all of them had one entry for their game and one for their update.)
              // so i can just pick the first element of the array and afterwards discard the array.
              
              if(!empty($software)){
                usort($software, function ($a, $b){return strcmp($a->TitleID, $b->TitleID);});
                $software_label = $software[0]->Name; // We take the name of the game.
              } 
              unset($software);// We destroy the array.
              }

        
            }
          }

          // Set up image upload with selected service
          $curl = curl_init();
          if ($_POST["upload_method"] === 'imgur_anonymous') {
            // Imgur anonymous upload
            $client = getenv('IMGUR_KEY');
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
                'type' => 'file',
                'title' => $software_label,
                'description' => $description
              ),
              CURLOPT_HTTPHEADER => array(
                'Authorization: Client-ID '.$client
              ),
            ));
          } else if ($_POST["upload_method"] === 'imgbb_anonymous') {
            // Anonymous ImgBB upload
            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://api.imgbb.com/1/upload',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS => array(
                'key' => getenv('IMGBB_KEY'),
                'image' => base64_encode($data),
                'expiration' => 120
              )
            ));
          } else if ($_POST["upload_method"] === 'imgbb_registered') {
            // Registered ImgBB upload
            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://api.imgbb.com/1/upload',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS => array(
                'key' => $_COOKIE["imgbb_key"],
                'name' => $software_label,
                'image' => base64_encode($data)
              )
            ));
          }

          // Upload image
          $output = curl_exec($curl);
          $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
          curl_close($curl);
          
          // Parse result
          if ($status == 200) {
            // Image URL
            if ($_POST["upload_method"] === 'imgur_anonymous') {
              $pms = json_decode($output,true);
              $img_url = 'https://imgur.com/'.$pms['data']['id'];
              $delete_hash = $pms['data']['deletehash'];
            } else if (($_POST["upload_method"] === 'imgbb_anonymous') || ($_POST["upload_method"] === 'imgbb_registered')) {
              $pms = json_decode($output,true);
              $img_url = $pms['data']['url'];
            }
          } else {
            // Show error message
            echo '<meta http-equiv="refresh" content="0;url=error.php">';
            exit();
          }

          // Display result
          if ($_POST["upload_method"] === 'imgur_anonymous') {
            $host_options = '
            <form action="delete.php" id="upload-form" enctype="multipart/form-data" method="POST">
              <p><input name="submit" type="submit" value="Delete image" /></p>
              <input type="hidden" name="id" value="'.$delete_hash.'" />
            </form>
            ';
          } else if ($_POST["upload_method"] === 'imgbb_anonymous') {
            $host_options = '<p>You have two minutes to save your image before it is deleted. You can save your images permanently by entering an ImgBB API key in the settings.</p>';
          } else if ($_POST["upload_method"] === 'imgbb_registered') {
            $host_options = '<p>This image is also available from your ImgBB profile.</p>';
          }
          $out = '
            <div class="panel qr-panel">
              <div class="panel-title">'.$software_label.'</div>
              <div class="body">
                <center>
                  <a href="'.$img_url.'" target="_blank">
                    <img alt="QR code (click to open page in new window)" src="//api.qrserver.com/v1/create-qr-code/?size=300x300&data='.$img_url.'">
                  </a>
                  '.$host_options.'
                </center>
              </div>
            </div>';
          echo $out;

          // Send analytics for upload if configured
          if (getenv('PLAUSIBLE_DOMAIN')) {
            $data = array(
              'name' => 'Upload',
              'props' => '{"Upload Mode":"'.$_POST["upload_method"].'"}',
              'url' => '/',
              'domain' => getenv('PLAUSIBLE_DOMAIN'),
            );
            $crl = curl_init('https://plausible.io/api/event');
            curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($crl, CURLINFO_HEADER_OUT, true);
            curl_setopt($crl, CURLOPT_POST, true);
            curl_setopt($crl, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($crl, CURLOPT_HTTPHEADER, array(
              'User-Agent: ' . $_SERVER['HTTP_USER_AGENT'],
              'X-Forwarded-For: ' . $_SERVER['REMOTE_ADDR'],
              'Content-Type: application/json')
            );
            $result = curl_exec($crl);
            curl_close($crl);
          }
          
        }
  ?>

  <div class="panel upload-panel">
        <div class="panel-title">Upload Image</div>
        <div class="body">
          <!-- Main upload form -->
          <form action="index.php" id="upload-form" enctype="multipart/form-data" method="POST">
            <p><input name="img" id="img-btn" type="file" accept="image/*" /></p>
            <p><input name="submit" type="submit" value="Upload" /></p>
            <!-- Add upload options based on server-side and local cookie settings -->
            <?php
              // Check available upload options
              $imgur_anonymous_status = 'disabled="true"';
              $imgbb_anonymous_status = 'disabled="true"';
              $imgbb_registered_status = 'disabled="true"';
              if (getenv('IMGUR_KEY')) {
                $imgur_anonymous_status = '';
              }
              if (getenv('IMGBB_KEY')) {
                $imgbb_anonymous_status = '';
              }
              if (isset($_COOKIE["imgbb_key"])) {
                $imgbb_registered_status = '';
              }
              // Set the default upload option
              $imgur_anonymous_checked = '';
              $imgbb_anonymous_checked = '';
              $imgbb_registered_checked = '';
              if (isset($_COOKIE["imgbb_key"])) {
                // If there is an ImgBB API key, set it as the default
                $imgbb_registered_checked = 'checked="checked"';
              } else if (getenv('IMGBB_KEY')) {
                // Use ImgBB anonymous as secondary option if available
                $imgbb_anonymous_checked = 'checked="checked"';
              } else if (getenv('IMGUR_KEY')) {
                // Use Imgur API anonymouse as secondary option if available
                $imgur_anonymous_checked = 'checked="checked"';
              }
              // Display upload options
              echo '
                <p>
                  <input required type="radio" id="imgbb_anonymous" name="upload_method" '.$imgbb_anonymous_status.' value="imgbb_anonymous" '.$imgbb_anonymous_checked.' />
                  <label for="imgbb_anonymous">ImgBB (anonymous)</label>
                </p>
                <p>
                  <input type="radio" id="registered" name="upload_method" '.$imgbb_registered_status.' value="imgbb_registered" '.$imgbb_registered_checked.' />
                  <label for="imgbb_registered">ImgBB with API key</label>
                </p>
                <p>
                  <input type="radio" id="imgur_anonymous" name="upload_method" '.$imgur_anonymous_status.' value="imgur_anonymous" />
                  <label for="imgur_anonymous" '.$imgur_anonymous_checked.' >Imgur (anonymous)</label>
                </p>
              ';
            ?>
          </form>
          <p><a href="/settings.php">Open Settings (API keys)</a></p>
          <hr>
          <!-- Description -->
          <p>ImageShare is a lightweight web app for uploading images with QR codes, created for the Nintendo 3DS and other legacy web browsers. See <a href="https://github.com/corbindavenport/imageshare" target="_blank">tinyurl.com/imgsharegit</a> for more information.</p>
          <p>If you find ImageShare useful, please consider donating to support development and server costs!</p>
          <p style="text-align: center; font-weight: bold;"><a href="https://www.patreon.com/corbindavenport" target="_blank">patreon.com/corbindavenport</a></p>
          <p style="text-align: center; font-weight: bold;"><a href="https://cash.app/$corbdav" target="_blank">cash.app/$corbdav</a> • <a href="https://paypal.me/corbindav" target="_blank">paypal.me/corbindav</a></p>
          <hr />
          <p>Join Discord server: <a href="https://discord.gg/tqJDRsmQVn" target="_blank">discord.gg/tqJDRsmQVn</a></p>
          <p>Follow on Mastodon: <a href="https://toot.community/@corbin" target="_blank">@corbin@toot.community</a>
          <hr />
          <p>ImageShare v24.06</p>
        </div>
    </div>
        
  </div>

</body>
</html>
