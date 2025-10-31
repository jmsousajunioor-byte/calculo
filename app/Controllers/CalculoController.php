<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Calculo;
use DateInterval;
use DateTimeImmutable;
use Dompdf\Dompdf;
use Dompdf\Options;

class CalculoController extends BaseController
{
    private Calculo $calculoModel;
    private const JUROS_MENSAL_PADRAO = 0.01; // 1% a.m.
    private ?string $lastInpcError = null;

    public function __construct()
    {
        $this->calculoModel = new Calculo();
    }

    public function showForm(): void
    {
        $this->requireAuth();

        $this->render('dashboard/gerar');
    }

    public function processForm(): void
    {
        $this->requireAuth();

        $titulo = trim((string) filter_input(INPUT_POST, 'titulo'));
        $valorBaseInput = str_replace(['.', ','], ['', '.'], (string) filter_input(INPUT_POST, 'valor_base'));
        $valorBase = (float) $valorBaseInput;
        $dataInicioInput = filter_input(INPUT_POST, 'data_inicio');
        $dataCitacaoInput = filter_input(INPUT_POST, 'data_citacao');
        $dataFinalInput = filter_input(INPUT_POST, 'data_final');
        $tipoCalculo = trim((string) filter_input(INPUT_POST, 'tipo_calculo'));
        $inpcOverride = filter_input(INPUT_POST, 'inpc_override', FILTER_VALIDATE_FLOAT);
        $jurosMensalPct = filter_input(INPUT_POST, 'juros_mensal', FILTER_VALIDATE_FLOAT);
        $inicioJurosForm = filter_input(INPUT_POST, 'inicio_juros');

        if ($valorBase <= 0 || !$dataInicioInput || !$dataCitacaoInput || !$dataFinalInput || empty($tipoCalculo)) {
            $this->setFlash('danger', 'Revise os dados do formulário. Valor base deve ser positivo e datas são obrigatórias.');
            redirect('gerar-calculo');
        }

        $dataInicio = new DateTimeImmutable($dataInicioInput);
        $dataCitacao = new DateTimeImmutable($dataCitacaoInput);
        $dataFinal = new DateTimeImmutable($dataFinalInput);

        if ($dataFinal < $dataInicio) {
            $this->setFlash('danger', 'A data final deve ser posterior à data de início.');
            redirect('gerar-calculo');
        }

        $acumuladoInpc = $this->buscarInpcAcumulado($dataInicio, $dataFinal);
        $utilizouFallback = false;

        if ($acumuladoInpc === null) {
            if ($inpcOverride !== false && $inpcOverride !== null) {
                $acumuladoInpc = ((float) $inpcOverride) / 100;
                $utilizouFallback = true;
            } else {
                $acumuladoInpc = 0.0;
                $utilizouFallback = true;
                $msg = 'Não foi possível consultar o INPC. O cálculo foi feito sem correção monetária. Informe um valor manual para ajustar.';
                if ((getenv('APP_DEBUG') ?: '0') === '1' && $this->lastInpcError) {
                    $msg .= ' Detalhe: ' . $this->lastInpcError;
                }
                $this->setFlash('warning', $msg);
            }
        }

        $valorCorrigido = $valorBase * (1 + $acumuladoInpc);

        $inicioJuros = $dataInicio < $dataCitacao ? $dataCitacao : $dataInicio->add(new DateInterval('P1D'));
        if (!empty($inicioJurosForm)) {
            try { $inicioJuros = new DateTimeImmutable($inicioJurosForm); } catch (\Throwable $e) {}
        }
        if ($inicioJuros > $dataFinal) {
            $inicioJuros = $dataFinal;
        }

        $jurosMensal = ($jurosMensalPct !== false && $jurosMensalPct !== null)
            ? ((float)$jurosMensalPct) / 100.0
            : self::JUROS_MENSAL_PADRAO;

        // Cálculo detalhado mês a mês
        $tabela = $this->montarTabelaMensal(
            $valorBase,
            $dataInicio,
            $inicioJuros,
            $dataFinal,
            $jurosMensal
        );
        $resultado = $tabela['valor_final'];
        $valorJuros = $tabela['total_juros'];
        $valorCorrigido = $tabela['valor_corrigido_inpc'];

        $userId = (int) $_SESSION['user_id'];
        $pdfPath = $this->gerarPdf([
            'titulo' => $titulo ?: 'Cálculo #' . date('YmdHis'),
            'valor_base' => $valorBase,
            'valor_corrigido' => $valorCorrigido,
            'valor_juros' => $valorJuros,
            'resultado' => $resultado,
            'data_inicio' => $dataInicio,
            'data_citacao' => $dataCitacao,
            'data_final' => $dataFinal,
            'tipo_calculo' => $tipoCalculo,
            'acumulado_inpc' => $acumuladoInpc,
            'utilizou_fallback' => $utilizouFallback,
            'tabela_mensal' => $tabela['linhas'],
            'juros_mensal' => $jurosMensal,
            'inicio_juros' => $inicioJuros,
        ], $userId);

        $calculoId = $this->calculoModel->create([
            'user_id' => $userId,
            'titulo' => $titulo,
            'valor_base' => $valorBase,
            'data_inicio' => $dataInicio->format('Y-m-d'),
            'data_citacao' => $dataCitacao->format('Y-m-d'),
            'data_final' => $dataFinal->format('Y-m-d'),
            'tipo_calculo' => $tipoCalculo,
            'resultado' => $resultado,
            'arquivo_pdf' => $pdfPath,
        ]);

        $this->setFlash('success', 'Cálculo gerado com sucesso! ID #' . $calculoId);
        redirect('meus-calculos');
    }

    public function list(): void
    {
        $this->requireAuth();

        $calculos = $this->calculoModel->listByUser((int) $_SESSION['user_id']);

        $this->render('dashboard/meus_calculos', [
            'calculos' => $calculos,
        ]);
    }

    public function download(): void
    {
        $this->requireAuth();

        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            http_response_code(400);
            exit('ID inválido.');
        }

        $calculo = $this->calculoModel->findByIdForUser($id, (int) $_SESSION['user_id']);
        if (!$calculo) {
            http_response_code(404);
            exit('Arquivo não encontrado.');
        }

        $path = $calculo['arquivo_pdf'];
        if (is_string($path) && strlen($path) > 0 && $path[0] === '/') {
            // caminho absoluto (ex.: /tmp em Vercel)
            $absolutePath = $path;
        } else {
            $absolutePath = BASE_PATH . '/' . ltrim((string)$path, '/');
        }

        if (!file_exists($absolutePath)) {
            http_response_code(404);
            exit('Arquivo não encontrado.');
        }

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . basename($absolutePath) . '"');
        readfile($absolutePath);
        exit;
    }

    private function buscarInpcAcumulado(DateTimeImmutable $inicio, DateTimeImmutable $fim): ?float
    {
        $periodoInicio = $inicio->format('Ym');
        $periodoFim = $fim->format('Ym');
        // Variável 44 = INPC - Variação mensal
        $url = sprintf(
            'https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/%s-%s/variaveis/44?localidades=%s',
            $periodoInicio,
            $periodoFim,
            rawurlencode('N1[all]')
        );

        $json = $this->httpGetJson($url);
        if (!is_array($json)) {
            // Tenta fallback no endpoint "values" (SIDRA)
            return $this->buscarInpcViaSidra($inicio, $fim);
        }

        // Navega de forma defensiva na estrutura retornada
        $serie = null;
        if (!empty($json[0]['resultados'][0]['series'][0]['serie'])) {
            $serie = $json[0]['resultados'][0]['series'][0]['serie'];
        } elseif (!empty($json[0]['resultados'][0]['series']) && is_array($json[0]['resultados'][0]['series'])) {
            foreach ($json[0]['resultados'][0]['series'] as $s) {
                if (!empty($s['serie'])) { $serie = $s['serie']; break; }
            }
        }

        if (!is_array($serie)) {
            return null;
        }

        $periodos = $this->listarPeriodosMensais($inicio, $fim);
        $fator = 1.0;

        foreach ($periodos as $periodo) {
            if (!isset($serie[$periodo])) {
                continue; // mês ainda não publicado → ignora
            }
            $mensal = (float) str_replace(',', '.', (string) $serie[$periodo]);
            $fator *= (1 + ($mensal / 100));
        }

        return $fator - 1;
    }

    private function httpGetJson(string $url, int $timeout = 12): ?array
    {
        // Preferir cURL (mais robusto); cair para file_get_contents se indisponível
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            $opts = [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
                CURLOPT_USERAGENT => 'CalculoJudiciario/1.0 (+https://127.0.0.1)'
            ];
            // Tente usar CA do php.ini/env
            $cainfo = ini_get('curl.cainfo');
            if (!$cainfo) { $cainfo = getenv('SSL_CERT_FILE') ?: getenv('CURL_CA_BUNDLE'); }
            if ($cainfo && file_exists($cainfo)) { $opts[CURLOPT_CAINFO] = $cainfo; }
            curl_setopt_array($ch, $opts);

            $response = curl_exec($ch);
            $errno = curl_errno($ch);
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = $errno ? curl_error($ch) : '';
            curl_close($ch);
            if ($errno !== 0 || $response === false || $httpCode >= 400) {
                $this->lastInpcError = sprintf('cURL(%s) HTTP %d: %s', $errno, $httpCode, $err ?: 'sem detalhes');
                // Em ambiente de desenvolvimento, tentar sem verificação SSL como último recurso
                if ($this->isInsecureAllowed() && $errno === 60) {
                    $ch = curl_init($url);
                    $opts[CURLOPT_SSL_VERIFYPEER] = false;
                    $opts[CURLOPT_SSL_VERIFYHOST] = 0;
                    curl_setopt_array($ch, $opts);
                    $response = curl_exec($ch);
                    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    if ($response !== false && $httpCode < 400) {
                        $data = json_decode($response, true);
                        return is_array($data) ? $data : null;
                    }
                }
                return null;
            }
            $data = json_decode($response, true);
            return is_array($data) ? $data : null;
        }

        if (!filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
            return null;
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => $timeout,
                'header' => "Accept: application/json\r\n",
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            $this->lastInpcError = 'file_get_contents falhou ao contatar ' . parse_url($url, PHP_URL_HOST);
            if ($this->isInsecureAllowed()) {
                $context2 = stream_context_create([
                    'http' => [ 'method' => 'GET', 'timeout' => $timeout, 'header' => "Accept: application/json\r\n" ],
                    'ssl'  => [ 'verify_peer' => false, 'verify_peer_name' => false ],
                ]);
                $response2 = @file_get_contents($url, false, $context2);
                if ($response2 !== false) {
                    $data = json_decode($response2, true);
                    return is_array($data) ? $data : null;
                }
            }
            return null;
        }
        $data = json_decode($response, true);
        return is_array($data) ? $data : null;
    }

    private function isInsecureAllowed(): bool
    {
        return ((getenv('ALLOW_INSECURE_IBGE') ?: '0') === '1') || ((getenv('APP_DEBUG') ?: '0') === '1');
    }

    private function buscarInpcViaSidra(DateTimeImmutable $inicio, DateTimeImmutable $fim): ?float
    {
        $periodoInicio = $inicio->format('Ym');
        $periodoFim = $fim->format('Ym');
        // values: t=1736 (INPC), v=44 (variação mensal), p=YYYYMM-YYYYMM, n1=Brasil
        $url = sprintf(
            'https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/44/p/%s-%s?formato=json',
            $periodoInicio,
            $periodoFim
        );

        $json = $this->httpGetJson($url);
        if (!is_array($json) || count($json) === 0) {
            return null;
        }

        // O primeiro item às vezes é metadado; filtramos linhas com D3C (período) e V (valor)
        $map = [];
        foreach ($json as $row) {
            if (!is_array($row)) { continue; }
            $cod = $row['D3C'] ?? $row['Mês (Código)'] ?? null; // nomes variam conforme idioma
            $valor = $row['V'] ?? $row['Valor'] ?? null;
            if ($cod && $valor !== null) {
                $map[(string)$cod] = (float) str_replace(',', '.', (string) $valor);
            }
        }

        if (empty($map)) {
            $this->lastInpcError = 'SIDRA retornou estrutura sem valores esperados.';
            return null;
        }

        $periodos = $this->listarPeriodosMensais($inicio, $fim);
        $fator = 1.0;
        foreach ($periodos as $p) {
            if (!isset($map[$p])) { continue; }
            $mensal = (float) $map[$p];
            $fator *= (1 + ($mensal / 100));
        }
        return $fator - 1;
    }

    private function listarPeriodosMensais(DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        $periodos = [];
        $cursor = new DateTimeImmutable($inicio->format('Y-m-01'));

        while ($cursor <= $fim) {
            $periodos[] = $cursor->format('Ym');
            $cursor = $cursor->add(new DateInterval('P1M'));
        }

        return $periodos;
    }

    private function gerarPdf(array $dados, int $userId): string
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->montarHtmlPdf($dados));
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = sprintf('calculo_%d_%s.pdf', $userId, date('YmdHis'));
        $isVercel = getenv('VERCEL') || getenv('VERCEL_URL');
        if ($isVercel) {
            $dir = '/tmp/pdfs';
            if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
            $absolutePath = rtrim($dir, '/') . '/' . $filename;
            file_put_contents($absolutePath, $dompdf->output());
            return $absolutePath; // salva o caminho absoluto para posterior download
        } else {
            $relativePath = 'storage/pdfs/' . $filename;
            $absolutePath = BASE_PATH . '/' . $relativePath;
            if (!is_dir(dirname($absolutePath))) {
                mkdir(dirname($absolutePath), 0775, true);
            }
            file_put_contents($absolutePath, $dompdf->output());
            return $relativePath;
        }
    }

    private function montarTabelaMensal(
        float $valorBase,
        DateTimeImmutable $dataInicio,
        DateTimeImmutable $inicioJuros,
        DateTimeImmutable $dataFinal,
        float $jurosMensal
    ): array {
        $linhas = [];
        $serieInpc = $this->obterSerieInpc($dataInicio, $dataFinal);
        $cursor = new DateTimeImmutable($dataInicio->format('Y-m-01'));
        $valorAposInpc = $valorBase;
        $valorFinal = $valorBase;
        $totalJuros = 0.0;

        while ($cursor <= $dataFinal) {
            $mesCodigo = $cursor->format('Ym');
            $mesLabel = $cursor->format('m/Y');
            $inpcPct = isset($serieInpc[$mesCodigo]) ? (float)$serieInpc[$mesCodigo] : 0.0;

            // Valor base exibido: constante (não muda mês a mês)
            $valorAntes = $valorBase;
            $valorAposInpc = $valorAposInpc * (1 + ($inpcPct / 100));

            $aplicaJuros = (new DateTimeImmutable($cursor->format('Y-m-t'))) >= $inicioJuros;
            $jurosPct = $aplicaJuros ? ($jurosMensal * 100.0) : 0.0;
            $valorAposJuros = $valorAposInpc;
            if ($aplicaJuros && $jurosMensal > 0) {
                $inc = $valorAposInpc * $jurosMensal;
                $totalJuros += $inc;
                $valorAposJuros += $inc;
            }

            $linhas[] = [
                'mes' => $mesLabel,
                'valor_base' => $valorAntes,
                'inpc_pct' => $inpcPct,
                'apos_inpc' => $valorAposInpc,
                'juros_pct' => $jurosPct,
                'apos_juros' => $valorAposJuros,
            ];

            $valorFinal = $valorAposJuros;
            $cursor = $cursor->add(new DateInterval('P1M'));
        }

        return [
            'linhas' => $linhas,
            'valor_final' => $valorFinal,
            'total_juros' => $totalJuros,
            'valor_corrigido_inpc' => $valorAposInpc,
        ];
    }

    private function obterSerieInpc(DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        $json = $this->httpGetJson(sprintf(
            'https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/%s-%s/variaveis/44?localidades=%s',
            $inicio->format('Ym'),
            $fim->format('Ym'),
            rawurlencode('N1[all]')
        ));
        $serie = [];
        if (is_array($json) && !empty($json[0]['resultados'][0]['series'][0]['serie'])) {
            $serie = $json[0]['resultados'][0]['series'][0]['serie'];
        } else {
            // tenta sidra
            $sidra = $this->httpGetJson(sprintf(
                'https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/44/p/%s-%s?formato=json',
                $inicio->format('Ym'),
                $fim->format('Ym')
            ));
            if (is_array($sidra)) {
                foreach ($sidra as $row) {
                    if (is_array($row) && isset($row['D3C'], $row['V'])) {
                        $serie[(string)$row['D3C']] = (float) str_replace(',', '.', (string)$row['V']);
                    }
                }
            }
        }
        return is_array($serie) ? $serie : [];
    }

    private function montarHtmlPdf(array $dados): string
    {
        $inpcPercentual = number_format($dados['acumulado_inpc'] * 100, 2, ',', '.');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{$this->sanitize($dados['titulo'])}</title>
    <style>
        :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --brand:#2563eb; --brand-2:#7c3aed; }
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: var(--ink); margin: 0; padding: 28px; background: linear-gradient(180deg,#f8fafc,#f1f5f9); }
        .card { background: #fff; border-radius: 20px; padding: 28px; box-shadow: 0 10px 30px rgba(2,6,23,.08), 0 2px 10px rgba(2,6,23,.04); }
        .heading { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; }
        .heading h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: .3px; background: linear-gradient(90deg,var(--brand),var(--brand-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .muted { color: var(--muted); font-size: 12px; }
        .section-title { font-size: 13px; font-weight: 700; color: var(--brand); margin: 18px 0 10px; text-transform: uppercase; letter-spacing: .12em; }
        .table-wrap { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        thead th { background: #f8fafc; color: #0f172a; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; padding: 12px; border-bottom: 1px solid var(--line); }
        tbody td { padding: 12px; border-bottom: 1px solid var(--line); font-size: 12px; }
        tbody tr:nth-child(odd) td { background: #fbfdff; }
        .kpi { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; margin-top: 16px; }
        .kpi > div { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: linear-gradient(180deg,#ffffff,#f8fafc); }
        .kpi .label { font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: .14em; margin-bottom: 6px; }
        .kpi .value { font-weight: 800; font-size: 18px; color: var(--ink); }
        .footer { margin-top: 18px; font-size: 11px; color: var(--muted); text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="heading">
            <h1>{$this->sanitize(APP_NAME)} · {$this->sanitize($dados['titulo'])}</h1>
            <span class="muted">Gerado em {$this->sanitize(date('d/m/Y H:i'))}</span>
        </div>

        <div class="section-title">Parâmetros</div>
        <table>
            <tr>
                <th>Valor Base</th>
                <td>R$ {$this->formatCurrency($dados['valor_base'])}</td>
            </tr>
            <tr>
                <th>Tipo de Cálculo</th>
                <td>{$this->sanitize($dados['tipo_calculo'])}</td>
            </tr>
            <tr>
                <th>Período</th>
                <td>{$dados['data_inicio']->format('d/m/Y')} até {$dados['data_final']->format('d/m/Y')}</td>
            </tr>
            <tr>
                <th>Data da Citação</th>
                <td>{$dados['data_citacao']->format('d/m/Y')}</td>
            </tr>
            <tr>
                <th>INPC acumulado</th>
                <td>{$inpcPercentual}% {$this->renderFallbackLabel($dados['utilizou_fallback'])}</td>
            </tr>
        </table>

        <div class="section-title">Detalhamento mensal</div>
        <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Mês</th>
                    <th>Valor base (R$)</th>
                    <th>INPC (%)</th>
                    <th>Após INPC (R$)</th>
                    <th>Juros (%)</th>
                    <th>Após Juros (R$)</th>
                </tr>
            </thead>
            <tbody>
HTML;

        foreach ($dados['tabela_mensal'] as $linha) {
            $html .= sprintf(
                '<tr><td>%s</td><td>R$ %s</td><td>%s%%</td><td>R$ %s</td><td>%s%%</td><td>R$ %s</td></tr>',
                htmlspecialchars($linha['mes'], ENT_QUOTES, 'UTF-8'),
                number_format($linha['valor_base'], 2, ',', '.'),
                number_format($linha['inpc_pct'], 2, ',', '.'),
                number_format($linha['apos_inpc'], 2, ',', '.'),
                number_format($linha['juros_pct'], 2, ',', '.'),
                number_format($linha['apos_juros'], 2, ',', '.')
            );
        }

        $html .= <<<HTML
            </tbody>
        </table>
        </div>

        <div class="section-title">Totais</div>
        <div class="kpi">
            <div>
                <div class="label">Valor total com juros</div>
                <div class="value">R$ {$this->formatCurrency($dados['valor_juros'])}</div>
            </div>
            <div>
                <div class="label">Valor total com INPC</div>
                <div class="value">R$ {$this->formatCurrency($dados['valor_corrigido'])}</div>
            </div>
            <div>
                <div class="label">Valor total geral</div>
                <div class="value">R$ {$this->formatCurrency($dados['resultado'])}</div>
            </div>
        </div>

        <div class="footer">
            Documento gerado automaticamente em {$this->sanitize(APP_NAME)} em {$this->sanitize(date('d/m/Y H:i'))}.
        </div>
    </div>
</body>
</html>
HTML;

        return $html;
    }

    private function sanitize(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    private function formatCurrency(float $value): string
    {
        return number_format($value, 2, ',', '.');
    }

    private function renderFallbackLabel(bool $utilizouFallback): string
    {
        if (!$utilizouFallback) {
            return '';
        }

        return '<span class="badge" style="margin-left:10px;background:#991b1b;">Fallback</span>';
    }
}
