<!DOCTYPE html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare</title>
    <meta name="robots" content="noindex">
    <meta name="viewport" content="initial-scale=1">
    <link rel="stylesheet" type="text/css" href="styles.css">
    <link href="favicon.ico" rel="icon" type="image/x-icon">
</head>

<body>

    <div class="header">ImageShare</div>

    <div class="container">

    <?php

    if(isset($_POST['submit'])){
        // Set curl info
        $delete_hash = $_POST['id'];
        $curl = curl_init();
        $client = getenv('API_KEY');
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