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

    <?php

    if(isset($_POST['submit'])){
        // Set curl info
        $delete_hash = $_POST['id'];
        $curl = curl_init();
        $client = getenv('IMGUR_KEY');
        curl_setopt_array($curl, array(
          CURLOPT_URL => 'https://api.imgur.com/3/image/'.$delete_hash,
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_ENCODING => '',
          CURLOPT_MAXREDIRS => 10,
          CURLOPT_TIMEOUT => 0,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
          CURLOPT_CUSTOMREQUEST => 'DELETE',
          CURLOPT_HTTPHEADER => array(
            'Authorization: Client-ID '.$client
          ),
        ));
        // Delete the image
        $output = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        // Show output
        if ($status === 200) {
            $html = '
                <div class="panel">
                    <div class="panel-title">Image deleted</div>
                    <div class="body">
                        <p>Your image has been successfully deleted.</p>
                        <p><a href="/">Upload new image</a></p>
                    </div>
                </div>
            ';
            echo $html;
        } else {
            $html = '
                <div class="panel">
                    <div class="panel-title">Error</div>
                    <div class="body">
                        <p>There was an error with the API, your image was not deleted.</p>
                        <p><a href="/">Upload new image</a></p>
                    </div>
                </div>
            ';
            echo $html;
        }
    }

    ?>
        
    </div>

</body>
</html>