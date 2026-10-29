# LifeMedic

Aplicación móvil para farmacia desarrollada con **Angular** e **Ionic**. Permite a los clientes consultar el catálogo de medicamentos y productos farmacéuticos, buscar productos, conocer precios e información, y realizar pedidos desde su dispositivo; el personal autorizado administra el catálogo e inventario.

> **Estado:** Fase inicial. El proyecto base (plantilla *blank* de Ionic + Angular) está configurado y ejecutable. Las funcionalidades descritas más abajo corresponden al alcance planificado.

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Alcance funcional](#alcance-funcional)
3. [Stack tecnológico](#stack-tecnológico)
4. [Requisitos previos](#requisitos-previos)
5. [Inicio rápido](#inicio-rápido)
6. [Scripts disponibles](#scripts-disponibles)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)

## Descripción

LifeMedic centraliza la información de los productos de la farmacia y ofrece una interfaz sencilla y adaptada a móviles, reduciendo la necesidad de acudir al establecimiento solo para consultar disponibilidad o precios.

**Usuarios objetivo**

- **Clientes:** se registran, consultan el catálogo, buscan productos y realizan pedidos.
- **Personal autorizado:** gestiona productos, precios, stock y categorías.

## Alcance funcional

**Primera versión (prioridad alta)**

- Pantalla principal y navegación.
- Categorías y catálogo de productos (nombre, imagen, precio, disponibilidad).
- Búsqueda de productos por nombre.
- Detalle del producto.
- Carrito de compras (agregar, modificar cantidades, eliminar, total).
- Registro e inicio de sesión al completar una compra.

**Prioridad media:** favoritos, filtros y ordenamiento por precio, perfil de usuario, historial de pedidos, múltiples direcciones.

**Prioridad baja (futuro):** cupones, reseñas, notificaciones, seguimiento de envío, recomendaciones, repetición de pedidos.

**Módulo administrativo:** CRUD de productos, control de inventario y precios, restringido por roles.

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Angular 22 |
| UI móvil | Ionic 9 |
| Lenguaje | TypeScript |
| Pruebas | Vitest (`ng test`) |
| Linting | ESLint + angular-eslint |
| Contenedor nativo (planificado) | Capacitor |
| Diseño de interfaces | Figma |

## Requisitos previos

| Herramienta | Versión recomendada | Verificación |
|---|---|---|
| Node.js | LTS actual (≥ 20) | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Git | ≥ 2.40 | `git --version` |
| Ionic CLI | ≥ 7 | `ionic -v` |

Instalar Ionic CLI si no está disponible:

```bash
npm install -g @ionic/cli
```

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/Danielxhm/LifeMedic.git
cd LifeMedic

# 2. Instalar dependencias
npm install

# 3. Ejecutar en entorno local
npm start          # o: ionic serve
```

La aplicación queda disponible en `http://localhost:4200`. Para simular un dispositivo móvil, abra las herramientas de desarrollo del navegador y active el modo dispositivo (`Ctrl+Shift+M`).

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compilación de producción en `www/` |
| `npm run watch` | Compilación continua en modo desarrollo |
| `npm test` | Pruebas unitarias |
| `npm run lint` | Análisis estático del código |

## Estructura del proyecto

```
LifeMedic/
├── src/
│   ├── app/            # Componentes, rutas y lógica de Angular
│   ├── assets/         # Recursos estáticos
│   ├── environments/   # Configuración por entorno
│   ├── theme/          # Variables de tema de Ionic
│   └── index.html
├── angular.json        # Configuración de Angular
├── ionic.config.json   # Configuración de Ionic
├── package.json
└── README.md
```

## Flujo de trabajo con Git

Repositorio: <https://github.com/Danielxhm/LifeMedic>. El equipo (2 integrantes) usa un flujo basado en ramas de funcionalidad con *pull requests*.

### Ramas

| Rama | Propósito |
|---|---|
| `main` | Código estable. Protegida: no se hace *push* directo; solo se integra mediante PR. |
| `develop` | Integración del trabajo en curso (opcional; puede usarse `main` si el equipo prefiere simplicidad). |
| `feature/<descripcion>` | Nueva funcionalidad. Ej.: `feature/catalogo-productos` |
| `fix/<descripcion>` | Corrección de errores. Ej.: `fix/total-carrito` |
| `docs/<descripcion>` | Cambios de documentación. |
| `chore/<descripcion>` | Mantenimiento y configuración. |

### Ciclo de trabajo

```bash
git checkout main && git pull origin main          # 1. Actualizar
git checkout -b feature/catalogo-productos         # 2. Crear rama
git add . && git commit -m "feat: agrega listado de productos"   # 3. Guardar cambios
git push -u origin feature/catalogo-productos      # 4. Publicar rama
# 5. Abrir Pull Request en GitHub hacia main
# 6. El otro integrante revisa y aprueba; se fusiona con "Squash and merge"
git checkout main && git pull origin main          # 7. Sincronizar y eliminar la rama local
```

### Convención de commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/): `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Ejemplo: `feat(carrito): calcula subtotal y total`

### Reglas de colaboración

- Commits pequeños y con mensaje descriptivo.
- Todo cambio a `main` requiere un PR revisado por el otro integrante.
- Ejecutar `npm run lint` y `npm run build` antes de abrir un PR.
- Actualizar la rama con `git pull origin main` antes de abrir el PR para resolver conflictos temprano.
- Nunca subir credenciales, claves ni archivos `.env`.
- Mantener `node_modules/` y `www/` fuera del repositorio (ya están en `.gitignore`).
