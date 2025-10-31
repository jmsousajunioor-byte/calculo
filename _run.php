<?php
session_start();
$_SERVER['REQUEST_METHOD']='GET';
$_SERVER['HTTP_HOST']='127.0.0.1:8080';
$_SERVER['SCRIPT_NAME']='/index.php';
include 'public/index.php';
