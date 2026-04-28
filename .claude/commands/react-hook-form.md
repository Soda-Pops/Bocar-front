---
description: Crea o mejora formularios en React con react-hook-form. Prioriza UX, validación clara, accesibilidad y código mantenible con zod.
---

# Skill para Codex: Formularios en React con react-hook-form

## Objetivo

Cuando trabajes en este proyecto y necesites crear o modificar formularios en React, usa `react-hook-form` como base principal para el manejo del estado, validación y envío.

El resultado debe seguir estas prioridades:

1. **Buena experiencia de usuario**
2. **Validación clara e intuitiva**
3. **Accesibilidad**
4. **Código mantenible y escalable**
5. **Separación entre UI, reglas de validación y lógica de submit**

---

## Librerías y enfoque recomendados

Usa estas herramientas por defecto:

* `react-hook-form` para manejo del formulario
* `zod` para validación por esquema cuando el proyecto ya use TypeScript o tenga validaciones medianas/complejas
* `@hookform/resolvers/zod` para conectar `zod` con `react-hook-form`

Si el proyecto no usa `zod`, al menos usa las validaciones nativas de `react-hook-form` con `required`, `minLength`, `maxLength`, `pattern`, `validate`, `min` y `max`.

---

## Reglas de implementación

### 1. Estructura base

Siempre que crees un formulario:

* Usa `useForm()`
* Extrae al menos `register`, `handleSubmit`, `formState`, `watch` y `setFocus` cuando sea útil
* Usa `defaultValues` explícitos
* Evita inputs completamente controlados salvo que el componente realmente lo requiera
* Usa `Controller` solo para componentes complejos o de librerías externas como date pickers, selects custom o componentes que no expongan bien `ref`

### 2. Validación

La validación debe ser:

* Cercana al campo
* Clara
* Específica
* Visible en el momento correcto

Reglas:

* No mostrar errores antes de que el usuario interactúe, salvo en submit
* Mostrar errores en `onBlur` o después de submit
* Para campos con feedback útil inmediato, usar `mode: "onChange"` o `reValidateMode: "onChange"`
* Mensajes de error deben explicar qué corregir
* Evitar mensajes genéricos como `Campo inválido` si se puede ser más preciso

Ejemplos de buenos mensajes:

* `El correo debe tener un formato válido`
* `La contraseña debe tener al menos 8 caracteres`
* `La edad debe estar entre 18 y 60`

### 3. Feedback visual

Todo campo debe poder mostrar estos estados:

* normal
* foco
* error
* éxito opcional
* deshabilitado
* loading en submit

Buenas prácticas:

* Resaltar el borde del campo con error
* Mostrar texto de ayuda debajo del input
* Usar `aria-invalid` cuando haya error
* Conectar el mensaje con `aria-describedby`
* Mostrar resumen de error general si el formulario falla por backend o por validaciones cruzadas
* En submit, deshabilitar el botón mientras `isSubmitting` sea `true`

### 4. Accesibilidad

Siempre:

* Asociar `label` con `input`
* No depender solo del color para comunicar error
* Agregar `aria-invalid={true}` en inputs con error
* Vincular mensajes con `id` y `aria-describedby`
* Mantener textos claros para lectores de pantalla
* En formularios largos, enfocar el primer campo con error

### 5. Manejo del submit

El submit debe:

* Validar antes de enviar
* Deshabilitar el botón mientras se procesa
* Mostrar feedback de éxito o error global
* Manejar errores del backend de forma clara
* No limpiar el formulario automáticamente a menos que tenga sentido para el flujo

### 6. Escalabilidad

Cuando el formulario sea mediano o grande:

* Extraer esquema de validación a un archivo separado
* Crear componentes reutilizables como `FormField`, `InputField`, `FieldError`, `SubmitButton`
* Evitar duplicar reglas inline si se pueden centralizar
* Mantener consistencia entre frontend y backend en nombres y reglas

---

## Configuración recomendada

### Opción preferida con Zod

```tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no debe exceder 50 caracteres"),
  email: z
    .string()
    .email("El correo debe tener un formato válido"),
  age: z
    .number({ error: "La edad debe ser un número" })
    .min(18, "La edad mínima es 18")
    .max(60, "La edad máxima es 60"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe incluir una mayúscula")
    .regex(/[0-9]/, "La contraseña debe incluir un número"),
});

type FormValues = z.infer<typeof schema>;

export function ExampleForm() {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      age: undefined,
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      console.log(data);
    } catch {
      setFocus("name");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar"}
      </button>

      {isSubmitSuccessful && <p>Formulario enviado correctamente.</p>}
    </form>
  );
}
```

---

## Patrón recomendado para componentes reutilizables

```tsx
import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: FieldError;
  helperText?: string;
};

export function TextField({ label, error, helperText, id, ...props }: TextFieldProps) {
  const messageId = error ? `${id}-error` : helperText ? `${id}-help` : undefined;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={messageId}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert">{error.message}</p>
      ) : helperText ? (
        <p id={`${id}-help`}>{helperText}</p>
      ) : null}
    </div>
  );
}
```

---

## Antipatrones a evitar

* manejar cada input con un `useState` separado sin necesidad
* mezclar validación inline caótica en JSX
* mostrar errores desde el primer render
* usar regex incomprensibles sin mensaje claro
* olvidar accesibilidad
* permitir múltiples submits mientras se envía
* ocultar errores del backend
* usar `Controller` para todo sin necesidad

---

## Checklist antes de terminar

* ¿los mensajes de error ayudan al usuario a corregir?
* ¿los campos tienen `label`?
* ¿hay feedback visual y semántico?
* ¿el submit evita dobles envíos?
* ¿la validación está centralizada?
* ¿la UX es razonable en desktop y móvil?
