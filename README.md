# Ledger Lite: Tu Gestor de Finanzas Personales

Ledger Lite es una aplicación web moderna y segura diseñada para ayudarte a llevar un control claro y sencillo de tus ingresos y gastos. Con una interfaz intuitiva y potentes funcionalidades, gestionar tus finanzas nunca ha sido tan fácil.

## ✨ Características Principales

- **Gestión Completa de Transacciones**: Crea, visualiza, edita y elimina transacciones de ingresos y gastos de forma rápida.
- **Gestión de Impuestos**: Registra impuestos recurrentes, visualiza su historial y márcalos como pagados, generando automáticamente la transacción de gasto correspondiente.
- **Seguridad Multiusuario**: Cada usuario tiene su propia cuenta segura. Tus registros financieros son privados y solo tú puedes acceder a ellos.
- **Autenticación con Google**: Inicia sesión de forma segura y con un solo clic utilizando tu cuenta de Google, gracias a la integración con Firebase Authentication.
- **Panel de Totales**: Obtén una visión clara de tu salud financiera con tarjetas que muestran tus ingresos totales, gastos totales y el balance actual.
- **Búsqueda y Filtrado Avanzado**: Encuentra transacciones específicas fácilmente utilizando filtros por tipo (ingreso/gasto), categoría, rango de fechas o buscando por descripción.
- **Experiencia de Usuario Moderna**: Disfruta de una interfaz pulida con efectos visuales como "glassmorphism" en las tarjetas y un fondo animado que mejora la inmersión.
- **Diseño Responsivo y Botón Flotante Inteligente**: Goza de una experiencia de usuario perfecta tanto en tu ordenador como en dispositivos móviles, con un botón de acción flotante (FAB) que se oculta al hacer scroll para no interrumpir la visualización.
- **Soporte Multilenguaje**: La interfaz está disponible en Español, Inglés y Portugués.
- **Temas Claro y Oscuro**: Cambia entre el tema claro y oscuro para adaptar la aplicación a tus preferencias visuales.

## 🛠️ Pila Tecnológica

Este proyecto está construido con tecnologías modernas y robustas para garantizar un rendimiento y escalabilidad excelentes.

- **Framework**: [Next.js](https://nextjs.org/) (usando App Router y Server Components)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI**: [ShadCN UI](https://ui.shadcn.com/) y [Radix UI](https://www.radix-ui.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) (a través de MongoDB Atlas)
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Iconos**: [Lucide React](https://lucide.dev/)

---

## 🚀 Instalación y Puesta en Marcha

Sigue estos pasos para clonar, configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- [Node.js](https://nodejs.org/en/) (versión 18 o superior)
- [Git](https://git-scm.com/)
- Una cuenta de [Google](https://google.com) para configurar Firebase.
- Una cuenta de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (puedes empezar con una capa gratuita).

### 1. Clonar el Repositorio

Abre tu terminal y clona este repositorio en tu máquina local:

```bash
git clone https://github.com/damianclancig/ledger-lite.git
cd ledger-lite
```

### 2. Instalar Dependencias

Instala todas las dependencias del proyecto usando npm:

```bash
npm install
```

### 3. Configuración de Variables de Entorno

La aplicación necesita credenciales para conectarse a Firebase y MongoDB.

1.  Crea un archivo llamado `.env.local` en la raíz del proyecto. Puedes copiar el archivo de ejemplo si existe.
2.  Este archivo contendrá todas las claves de API necesarias.

#### a. Configuración de Firebase (para Autenticación)

1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  Dentro de tu proyecto, ve a **Authentication** en el menú de la izquierda.
3.  En la pestaña **Sign-in method**, habilita el proveedor **Google**.
4.  Ve a **Project settings** (el icono de engranaje) -> **General**.
5.  En la sección "Your apps", registra una nueva **Web app** (icono `</>`).
6.  Después de registrarla, Firebase te proporcionará un objeto `firebaseConfig`. Copia estos valores.
7.  Pega las claves en tu archivo `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY="TU_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="TU_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="TU_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="TU_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="TU_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="TU_APP_ID"
```

8.  **¡Importante!** Vuelve a **Authentication** -> **Settings** -> **Authorized domains** y asegúrate de que el dominio desde donde ejecutarás la aplicación esté en la lista. Para desarrollo local, añade `localhost`. Si usas un servicio en la nube como Firebase Studio, añade la URL específica que te proporciona.

#### b. Configuración de MongoDB (para la Base de Datos)

1.  Ve a tu cuenta de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y crea un nuevo clúster (el nivel gratuito `M0` es suficiente).
2.  Una vez que el clúster esté desplegado, ve a **Database Access** y crea un usuario de base de datos. Anota el nombre de usuario y la contraseña.
3.  Ve a **Network Access** y añade tu dirección IP actual a la lista de acceso (o permite el acceso desde cualquier lugar `0.0.0.0/0` solo para fines de desarrollo).
4.  Ve a **Database**, haz clic en **Connect** en tu clúster y selecciona **Drivers**.
5.  Copia la **cadena de conexión (URI)** proporcionada.
6.  Pégala en tu archivo `.env.local`. **Recuerda reemplazar `<password>` con la contraseña del usuario que creaste.**

```
MONGODB_URI="mongodb+srv://tu_usuario:<password>@tu_cluster.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="ledger_lite"
```

### 4. Ejecutar la Aplicación

Una vez que hayas configurado todas las variables de entorno, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abre tu navegador y visita [http://localhost:3000](http://localhost:3000) (o el puerto que se indique en la terminal). ¡Ya deberías poder ver la página de inicio de sesión y empezar a usar Ledger Lite!
