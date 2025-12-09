# RAE DICT

[![Compilar y probar](https://github.com/santi100a/raedict/actions/workflows/deploy.yml/badge.svg)](https://github.com/santi100a/raedict/actions)
[![Descargas en Docker](https://img.shields.io/docker/pulls/santi100/raedict?logo=docker)](https://hub.docker.com/r/santi100/raedict)

Este es un servidor escrito para Node.js que provee una interfaz TCP y emplea el protocolo DICT para consultar el **Diccionario de la Lengua Española (DLE)** de la RAE a través de [una API no oficial](https://rae-api.com). Implementa comandos del estándar RFC 2229, incluyendo `DEFINE`, `OPTION`, `SHOW`, `QUIT`, y `STATUS`.

Muchas gracias a los creadores de <https://rae-api.com/> por hacer esto posible.
Estoy buscando una VPS que me permita alojar este servidor (es decir, TCP en bruto) y
especificar el puerto, preferiblemente sin tarjeta de crédito.
Por ahora está en Fly.io. Hay dos dominios: <dict://raedict.fly.dev/> y <dict://raedict.zapto.org/>. Si uno no funciona, intenta con el otro.

## Características

* Consultar palabras y retornar definiciones con el comando `DEFINE`.
* Admite opciones de diccionario (`OPTION MIME`, `OPTION UTF8`).
* Retornar información sobre el servidor (`SHOW SERVER`) y el diccionario (`SHOW INFO dle`).
* Mostrar diccionarios (`SHOW DB`) y estrategias de búsqueda (`SHOW STRAT`).
* Verificar estado del servidor y palabra del día (`STATUS`).
* Escrito modularmente en TypeScript con seguridad de tipos.
* Pruebas unitarias de Jest para cada módulo.


## Instalación y uso

### Uso local o acceso al código fuente

```bash
git clone https://github.com/santi100a/raedict.git  # Clonar (descargar) repositorio
cd raedict                                          # Ingresar al directorio
yarn install                                        # Instalar dependencias (usa `yarn`)
yarn build                                          # Compilar a JavaScript
yarn start                                          # Inicializar el servidor (puerto 2628)
```

Ahora se aceptan conexiones de clientes TCP (p. ej., `telnet localhost 2628`) y se pueden emitir comandos:

```text
DEFINE dle probar # También "probar" o 'probar'
> 150 X definiciones encontradas para "probar"
> 151 "probar" dle "Diccionario de la Lengua Española"
>
> (Texto de la definición 1)
> .
> 151 "probar" dle "Diccionario de la Lengua Española"
>
> (Texto de la definición 2)
> .
# etc.
> .
> 250 OK
OPTION MIME # Esto hace que haya encabezados antes de las definiciones
> 250 OK
SHOW SERVER
> 114 Info. del servidor
> RAE DICT en (plataforma), Node.js (versión) <https://github.com/santi100a/raedict>
> (C) 2025 Santiago Rojas <https://github.com/santi100a>
> Funciona gracias a RAE API <https://rae-api.com>
STATUS
> 210 OK - Palabra del día: (palabra del día de la RAE), tardó X.XX ms en llegar
QUIT
> 221 Fue todo un gusto atenderte
```

O se puede configurar cualquier cliente del protocolo DICT, como GoldenDict, `dictd` o incluso cURL:

```bash
curl dict://localhost/d:probar
```

### Uso con Docker

Compila y ejecuta el servidor usando Docker:

```bash
docker pull santi100/raedict:1.0
docker run -p 2628:2628 santi100/raedict:1.0
```

## Comandos

### `DEFINE`

Consultar definiciones de una palabra:

```text
DEFINE dle <palabra>
```

### `OPTION`

Configurar opciones:

```text
OPTION MIME   # Activar encabezados MIME
OPTION UTF8   # No hace nada; el servidor ya usa Unicode UTF-8
```

### `SHOW`

Mostrar información del servidor o el diccionario:

```text
SHOW SERVER     # Información del servidor
SHOW INFO dle   # Información del diccionario
SHOW DB         # Lista de diccionarios (sólo hay uno: "dle")
SHOW STRAT      # Estrategias (`exact`, `fuzzy`)
```

### `STATUS`

Verificar el estado del servidor y obtener la palabra del día:

```text
STATUS
```

### `QUIT`

Cerrar la conexión:

```text
QUIT
```


## Pruebas

Ejecuta todas las pruebas unitarias con Jest:

```bash
yarn test
```

Las pruebas cubren todos los comandos, errores de red, y respuestas desde la API.


## Desarrollo

* El código fuente está en el directorio `src/`. Las bibliotecas compartidas del código están en `src/lib/`.
* Las pruebas están en `tests/`.
* Utiliza `yarn build` para compilar y `yarn test` para ejecutar las pruebas.
* La CI/CD con GitHub Actions ejecuta las pruebas automáticamente y sube una imagen de Docker.

## Contribuciones

1. Bifurca el repositorio.
2. Crea una rama de colaboración.
3. Ejecuta `yarn test` para asegurarte de que pasen las pruebas.
4. Envía una solicitud de cambios.


## License

Licencia del MIT — Derechos de autor (C) 2025-presente Santiago Rojas
