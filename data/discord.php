<?php
if(isset($_POST['submit'])) {
  setcookie("discord_webhook", $_POST["webhook"]);
}
?>

<!DOCTYPE html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare</title>
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
          <div class="panel-title">Discord Settings</div>
          <div class="body">
              <p>ImageShare can automatically send all new images to a Discord channel using webhooks, for easier access on desktops or other devices without easy QR code scanning.</p>
              <p>To stop using webhooks, clear the text field and click Save.</p>
              <!-- Main upload form -->
              <form action="discord.php" id="upload-form" enctype="multipart/form-data" method="POST" autocomplete="off">
                <p><label for="webhook">Webhook URL:</label></p>
                <?php
                  if (isset($_POST["webhook"])) {
                    $webhook = $_POST["webhook"];
                  } else if (isset($_COOKIE["discord_webhook"])) {
                    $webhook = $_COOKIE["discord_webhook"];
                  } else {
                    $webhook = "";
                  }
                  echo '<p><input type="text" id="webhook" name="webhook" value="'.$webhook.'"></p>';
                ?>
                <p><input name="submit" type="submit" value="Save" /></p>
              </form>
              <p>How to use webhooks: <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank">https://tinyurl.com/diswebhook</a></p>
              <p><a href="/">Go back home</a></p>
          </div>
      </div>
        
    </div>

</body>
</html>