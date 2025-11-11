# Define las carpetas y extensiones de archivos que deseas excluir
$excludedDirs = @('node_modules', 'build', 'dist', '.git')
$includedExtensions = @('.js', '.json', '.html', '.css', '.md')

# Función recursiva para listar directorios y archivos excluyendo los especificados
function List-Directory {
    param (
        [string]$path
    )

    Get-ChildItem -Path $path -Recurse -Force | ForEach-Object {
        if ($_.PSIsContainer) {
            if ($excludedDirs -notcontains $_.Name) {
                Write-Output "$($_.FullName)\"
                List-Directory -path $_.FullName
            }
        } elseif ($includedExtensions -contains $_.Extension) {
            Write-Output $_.FullName
        }
    }
}

# Llama a la función y guarda la salida en un archivo
List-Directory -path "." > estructura_filtrada.txt
