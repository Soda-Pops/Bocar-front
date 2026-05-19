Sistema
-Todo en Ingles

dashboard industrializacion

-conectar login con back
-cards de status bien marcados
-grafica rfqs por mes decirle a back
-campos tabla cambiarlos usar tipo de rfq

-tabs que coincidan con status de back
Status:
Borradores tuyas IND
Activas: 
- Falta seleccion de proveedores
- En espera de cotizacion
Historicas: Completadas 

Revisar mobile en Dashboard

Crear la RFQ
-ANTES de la pantalla de crear seleccionar el tipo de RFQ si es mold o trimming
-Header que indique el tipo de rfq que se esta creando 
-Validacion de todos los campos en formulario
-llenado de campos automaticos para campos autorellenados y cancelacion de edicion para dicho campo
-Carga de archivos pantalla para indsutrializacion .stp .ppt y.pdf


DEJAR LAS RFQS POR ASIGNAR EN UNA SOLA TABLA Y AGREGAR FILTROS COMO EN LISTA

SUPER ADMIN INDUSTRIALIZACION

tiene mismo filtros que tabla de user normal
que tenga la misma info que usuario base + eliminadas y accion de eliminar
Lo unico de diferente es ver las eliminadas y Eliminrar RFQs


RFQs QUE VE COMPRAS:
Rfqs por asignar
En cotizacion vencidas

Quitar campos:
MATERIAL / PROYECTO	REGION

Se queda:

ID
TIPO
Status
Deadline
Fecha de cracion
Creado por
Progreso de proveedores
Accion

Filtros:
Tipo de Rfq
Deadline

Pantalla de detalle breve: 
Badge de Status implementar 
y opcion para ver detalle completo


SuperUsuario de Compras:
Dashboard de compras normal + Eliminadas y accion de eliminar tal cual como en industrializacion 










API

GET /rfq -todos activos borados
GET /rfq/drafts - Solo nuestros




access toke: 5 min
Refresh token: 7d dias


GET /RFQ acces token


5:01
GET /RFQ acces token A JWT expiracion 
POST /auth/refresh Refresh Original
    Deveue

GET /rfq/counter

    {
        activas: 2
        drafts: 3
        historicas: 5
        review: 5
    }

- [
    {
        Type: trimming
        RFQ-DATA{}
    }
    {
        Type: mold
        RFQ-DATA{}
    }

]

{
    AUTH:{

    }
}

{
    auth:{}

    RFQs: [{
        id
        type
        date create
        name part

    }]
}
