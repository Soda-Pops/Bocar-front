import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Usuario

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # El frontend de react manda "username" y "password"
            correo = data.get('username')
            contrasena = data.get('password')

            if not correo or not contrasena:
                return JsonResponse({'error': 'Faltan credenciales'}, status=400)

            # Buscamos al usuario por correo
            try:
                usuario = Usuario.objects.get(correo=correo)
            except Usuario.DoesNotExist:
                return JsonResponse({'error': 'Credenciales incorrectas'}, status=401)

            # Validamos la contraseña usando el hasher de Django
            if usuario.check_password(contrasena):
                return JsonResponse({
                    'token': f'fake-jwt-token-para-{usuario.id}', 
                    'rol': usuario.rol.nombre,
                    'es_admin': usuario.es_admin
                }, status=200)
            else:
                return JsonResponse({'error': 'Credenciales incorrectas'}, status=401)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON Invalido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Método no permitido'}, status=405)