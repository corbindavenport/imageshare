<?php
if (isset($_POST['submit'])) {
  // Set the expiration time for 1 year from now
  $expire = time() + 365 * 24 * 60 * 60; // 1 year
  setcookie("imgbb_key", $_POST["imgbb_key"], $expire);

}
?>

<!DOCTYPE html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare - Settings</title>
    <meta name="robots" content="noindex">
    <link rel="stylesheet" type="text/css" href="styles.css">
    <link href="favicon.ico" rel="icon" type="image/x-icon">
    <?php
    // Set viewport size
    $is3DS = strpos($_SERVER['HTTP_USER_AGENT'], 'Nintendo 3DS');
    $isNew3DS = strpos($_SERVER['HTTP_USER_AGENT'], 'New Nintendo 3DS');
    if ($is3DS && !($isNew3DS)) {
      // This is required for proper viewport size on old 3DS web browser
      echo '<meta name="viewport" content="width=320" />'.PHP_EOL;
    } else {
      // Normal mobile scaling for New 3DS Browser and everything else
      echo '<meta name="viewport" content="initial-scale=1">'.PHP_EOL;
    }
    // Set icon size
    // Use a 16x16 favicon for the 3DS and Wii, larger icons in multiple sizes for other browsers
    if (str_contains($_SERVER['HTTP_USER_AGENT'], 'Nintendo')) {
      echo '<link rel="icon" href="favicon.ico" type="image/x-icon">'.PHP_EOL;
    } else {
      echo '<link rel="apple-touch-icon" sizes="192x192" href="img/maskable_icon_x192.png">'.PHP_EOL;
      echo '    <link rel="icon" type="image/png" sizes="16x16" href="img/favicon_x16.png">'.PHP_EOL;
      echo '    <link rel="icon" type="image/png" sizes="24x24" href="img/favicon_x24.png">'.PHP_EOL;
    }
    ?>
</head>

<body>

    <div class="header">ImageShare</div>

    <div class="container">

      <div class="panel">
          <div class="panel-title">ImageShare Settings</div>
          <div class="body">
              <p>You can enter API keys here to enable new upload options.</p>
              <p>More information: <a href="https://github.com/corbindavenport/imageshare/blob/main/SETUP.md" target="_blank">tinyurl.com/imgsharesetup</a></p>
              <hr>
              <!-- Main upload form -->
              <form action="settings.php" id="upload-form" enctype="multipart/form-data" method="POST" autocomplete="off">
                <p><b>ImgBB.com</b></p>
                <p><label for="webhook">API key:</label></p>
                <?php
                  if (isset($_POST['imgbb_key'])) {
                    $imgbb_key = $_POST["imgbb_key"];
                  } else if (isset($_COOKIE["imgbb_key"])) {
                    $imgbb_key = $_COOKIE["imgbb_key"];
                  } else {
                    $imgbb_key = "";
                  }
                  echo '<p><input type="text" id="imgbb_key" name="imgbb_key" value="'.$imgbb_key.'"></p>';
                ?>
                <p>Images uploaded with an ImgBB API will be saved to your ImgBB account with no expiry.</p>
                <hr>
                <p><input name="submit" type="submit" value="Save" /></p>
              </form>
              <p style="text-align: center"><a href="/" style="color: #0000ff;">Go back home</a></p>
          </div>
      </div>
        
    </div>

</body>
</html>