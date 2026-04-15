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

### Back

Para poder hacer efectivos los nuevos cambios del back escencialmente por como se desarrolle y agreguen las cosas, la base de datos tiene que estar siempre con los nuevos cambios

```bash
python manage.py migrate
```

> [!NOTE]  
> Asegurate de que el proceso de mssql, o el docker de mssql, se este ejecutando porque de otro modo no se podra hacer la migracion ya que no conectara correctamente con la Base de Datos

Finalmente para ejecutar el servidor django en modo desarrollo

```bash
python manage.py runserver
```


### Front

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