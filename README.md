# Bocar

## Get Started...

### Base de datos
Si quieren realizar alguna prueba ya en conjunto con el back, front y que se empiecen a ver reflejados los datos guardados dentro de la base de datos, es necesario que ya tengan la database creada en su dispositivo.

> [!NOTE]  
> Mas adelante pongo para agregar ya sea en Docker para Linux o Mac, y nativamente si tienen Windows

**Credenciales con las que se configurara la sesión:**  
Usuario: sa  
Password: Sodapop123!  
Host: 127.0.0.1 / localhost  
Puerto: 1433

---

## Back

He usado conda para poder generar el ambiente unciamente leyendo el archivo que se encuentra en la ruta 

```bash
./public/django-app-Bocar/
```

para poder crearlo y activarlo unicamente tienes que encontrarte en el directorio antes mencionado, donde se encuentra el archivo ***"environment.yml"***.

```bash
cd ./public/django-app-Bocar/
```

Posteriormente ejecuta el siguiente comando

```bash
conda env create -f environment.yml
```

Esto leera todas las dependencias, librerias, paquetes y versiones que estan puestas, asi como crear el ambiente con el nombre ***"django_env"***, que para activar el ambiente usa el sigueinte comando

```bash
conda activate django_app
```

> [!CAUTION]  
> Debes de ya tener Conda instalado, y usar la terminal de conda

> [!NOTE]  
> En caso de descargar mas librerias de python deberas de actualizar el archivo ***"environment.yml"***. Para hacer esto mas sencillo sigue los siguientes paso  
>
> ```bash
> # Ejemplo de descarga de librerias
> pip install numpy, cartopy...
> 
> # Deberas realizar este comando dentro del directorio donde se encuentra "environment.yml"
> conda env export > environment.yml
> ```

---  

Para poder hacer efectivos los nuevos cambios del back escencialmente por como se desarrolle y agreguen las cosas, la base de datos tiene que estar siempre con los nuevos cambios

dentro del directorio

```bash
./public/django-app-Bocar
````

Ejecuta

```bash
python manage.py migrate
```

> [!NOTE]  
> Asegurate de que el proceso de mssql, o el docker de mssql, se este ejecutando porque de otro modo no se podra hacer la migracion ya que no conectara correctamente con la Base de Datos

Finalmente para ejecutar el servidor django en modo desarrollo

```bash
python manage.py runserver
```
---

## Front

Primero instalemos las dependencias, para esto debes de estar en el directorio del proyecto, y navegar hasta el proyecto de react

Puedes usar el siguiente comando:

```bash
cd ./public/react_app_Bocar
```

Una vez dentro de la carpeta del proyecto del front instalaremos los paquetes necesarios

```bash
npm install
```

> [!CAUTION]  
> Como precaución, cada que instalen las dependencias verifiquen el numero de vulnerabilidades que contiene, en su defecto corrijanlas, o solo mantengan las menores posibles

Con dependencias y paquetes listos unicamente debemos de correr el servicio en modo desarrollo

```bash
npm run dev
```