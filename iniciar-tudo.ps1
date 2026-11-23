# UniFood - abre o site e os 4 servicos, cada um na sua janela.
# Como usar (na pasta unifood):
#   powershell -ExecutionPolicy Bypass -File .\iniciar-tudo.ps1
# Antes: MySQL e MongoDB precisam estar ligados. Para parar tudo, feche as janelas abertas.

$raiz = $PSScriptRoot

Write-Host ''
Write-Host 'UniFood - iniciando tudo' -ForegroundColor Cyan
$senha = Read-Host 'Senha do usuario root do MySQL (deixe vazio se nao tiver senha)'
if ($senha -eq '') { $credencial = 'root' } else { $credencial = 'root:' + [uri]::EscapeDataString($senha) }
$mysql = "mysql://$credencial@localhost:3306"

# Abre uma janela do PowerShell que roda $comando dentro de $pasta.
# O comando vai codificado (base64) para nao quebrar com espacos e acentos no caminho.
function Abrir($titulo, $pasta, $comando) {
    $script = "`$Host.UI.RawUI.WindowTitle = '$titulo'; Set-Location -LiteralPath '$pasta'; $comando"
    $codificado = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process powershell -ArgumentList '-NoExit', '-EncodedCommand', $codificado
}

$instalarSeFaltar = 'if (-not (Test-Path node_modules)) { npm install }'

# Java (usam MongoDB em localhost:27017 e Usuarios em localhost:8081 por padrao)
Abrir 'UniFood - Usuarios (8081)' "$raiz\servicos\usuarios-service" 'mvn spring-boot:run'
Abrir 'UniFood - Produtos (8082)' "$raiz\servicos\produtos-service" 'mvn spring-boot:run'

# Node (criam o banco e as tabelas sozinhos na primeira vez)
Abrir 'UniFood - Pagamentos (3002)' "$raiz\servicos\pagamentos-service" "$instalarSeFaltar; `$env:DATABASE_URL = '$mysql/pagamentos_db'; npm start"
Abrir 'UniFood - Pedidos (3001)' "$raiz\servicos\pedidos-service" "$instalarSeFaltar; `$env:DATABASE_URL = '$mysql/pedidos_db'; npm start"

# Site
Abrir 'UniFood - Site (5173)' "$raiz\frontend" "$instalarSeFaltar; npm run dev"

Write-Host ''
Write-Host 'Abri 5 janelas. Os servicos Java demoram uns 30 a 60 segundos para ficar prontos.' -ForegroundColor Yellow
Write-Host 'Quando o site mostrar o endereco, abra:  http://localhost:5173' -ForegroundColor Green
Write-Host 'Abrindo o navegador em 40 segundos...'
Start-Sleep -Seconds 40
Start-Process 'http://localhost:5173'
