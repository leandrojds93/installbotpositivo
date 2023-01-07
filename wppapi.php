<?php
ini_set('display_errors', 0 );
$id = $_GET['id'];
$origem = $_GET['numero'];
$mensagem = $_GET['mensagem'];
$prefixo = substr($origem, 0, 2);
$prefixo_primeiro = substr($origem, 0, 1); 

if($prefixo_primeiro === '5') {
$ddd = substr($origem, 2, 2); 
$ddd_primeiro = substr($ddd, 0, 1); 

if(($ddd_primeiro === '4') or ($ddd_primeiro === '5')) {
    $fone = substr($origem, -8);
    $destino = $ddd . $fone;
}else {
    $fone = substr($origem, -8); //-8 remove o 9 digito do numero // padrao -9
    $destino = $ddd . $fone;
}
}elseif($prefixo_primeiro === '0') {
$ddd = substr($origem, 1, 2); 
$ddd_primeiro = substr($ddd, 0, 1); 

if(($ddd_primeiro === '4') or ($ddd_primeiro === '5')) {
    $fone = substr($origem, -8);
    $destino = $ddd . $fone;
}else {
    $fone = substr($origem, -8); //-8 remove o 9 digito do numero // padrao -9
    $destino = $ddd . $fone;
}
}
// IMPRIME DESTINO
$fonedest = $destino;
$tamanho = strlen($fonedest);
if (isset($destino)) {
    $fonefinal = $destino;
}else {
    $prefixo = substr($origem, 0, 2);
    $prefixo_primeiro = substr($origem, 0, 1);
    $ddd = substr($origem, 0, 2); 
    if(($prefixo_primeiro === '4') or ($prefixo_primeiro === '5')) {
    $fone = substr($origem, -8);
    $fonefinal = $ddd . $fone;
}else {
    $ddd = substr($origem, 0, 2); 
    $fone = substr($origem, -8); //-8 remove o 9 digito do numero // padrao -9
    $fonefinal = $ddd . $fone;
}
}
// FIXO OU MOVEL

$inicio = substr($fone, 0, 1);

if($inicio < '5') {
    $ddd = substr($fonefinal, 0 , 2);
    $telefone = substr($fonefinal, -8);
    $tratado = $ddd . $telefone;
}else {
    $tratado = $fonefinal;
}

## RETORNA FONE TRATADO
$whatsapp = "55" . $tratado;
if (!empty($id) && !empty($whatsapp) && !empty($mensagem) && strlen($whatsapp) == 12) {
    ## INICIA INTEGRAÇÃO WHATICKET
    ## AQUI INSERE A URL DA API
    $url = 'http://localhost:8000/send-message';
    $data = array(
        "sender" => $id,
        "number" => $whatsapp,
        "message" => $mensagem,
      );
      $postdata = json_encode($data);

      $ch = curl_init($url); 
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
      curl_setopt($ch, CURLOPT_HTTPHEADER, array("Accept: application/json",
                "Content-Type: application/json",));
      $result = curl_exec($ch);
      curl_close($ch);
      print_r ($result);
} else {
    exit;
}
  ?>
