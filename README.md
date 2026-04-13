# Bocar

## Introduccion
Este repositorio es la pagina que se esta desarrolando para grupo Bocar, como parte de la materia TC3005B

## Get Started...

### Back

Activaremos primeramente el ambiente virtual

```bash
source venv/bin/activate
```

posteriormente si tenemos migraciones pendientes por aplicar usaremos

```bash
python manage.py migrate
```

Finalmente para ejecutar el servidor

```bash
python manage.py runserver
```


### Front

Ahora bien, para ejecutar el frontend desarrolado en react

```bash
npm start
```

## Consideraciones
Considera que el back ya tiene una conexion a la base de datos por lo que es de suma importancia que tengas la base de datos con las creedenciales predeterminadas por defecto
