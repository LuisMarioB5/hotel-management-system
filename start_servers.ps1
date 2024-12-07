# Configuración
# Ruta del backend
$backendPath = "./backend"

# Ruta del frontend
$frontendPath = "./frontend"

# Iniciar Backend
Write-Output "Iniciando el servidor Backend..."
Start-Process "cmd.exe" -ArgumentList "/K Title Servidor Backend && cd $backendPath && npm run start"

# Iniciar Frontend
Write-Output "Iniciando el servidor Frontend..."
Start-Process "cmd.exe" -ArgumentList "/K Title Servidor Frontend && cd $frontendPath && npm run start"

Write-Output "Ambos servidores han sido iniciados. Verifica las terminales abiertas para más detalles."
