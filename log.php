<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $amount = $_POST['amount'] ?? '';
    $tier = $_POST['tier'] ?? '';
    $network = $_POST['network'] ?? '';
    $txhash = $_POST['txhash'] ?? '';
    $timestamp = date('Y-m-d H:i:s');

    $csvLine = [$timestamp, $name, $email, $amount, $tier, $network, $txhash];
    
    $file = fopen('donations.csv', 'a');
    fputcsv($csvLine, $file);
    fclose($file);
    
    echo 'ok';
}
?>