
"""
Django settings for config project.
"""

import os
from pathlib import Path

# =====================================================
# RUTAS
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =====================================================
# SEGURIDAD
# =====================================================

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-local-development-only'
    else:
        raise ValueError(
            'Debes configurar DJANGO_SECRET_KEY en producción'
        )


# =====================================================
# HOSTS PERMITIDOS
# =====================================================

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        'ALLOWED_HOSTS',
        '127.0.0.1,localhost'
    ).split(',')
    if host.strip()
]

RENDER_HOST = os.environ.get('RENDER_EXTERNAL_HOSTNAME')

if RENDER_HOST and RENDER_HOST not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_HOST)


# =====================================================
# PROTECCIÓN CSRF
# =====================================================

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        ''
    ).split(',')
    if origin.strip()
]

if RENDER_HOST:
    render_origin = f'https://{RENDER_HOST}'

    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)


# =====================================================
# CONFIGURACIÓN HTTPS
# =====================================================

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SECURE_SSL_REDIRECT = not DEBUG

SESSION_COOKIE_SECURE = not DEBUG

CSRF_COOKIE_SECURE = not DEBUG


# =====================================================
# APLICACIONES
# =====================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'core',
]


# =====================================================
# MIDDLEWARE
# =====================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# =====================================================
# URLS
# =====================================================

ROOT_URLCONF = 'config.urls'


# =====================================================
# PLANTILLAS
# =====================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


WSGI_APPLICATION = 'config.wsgi.application'


# =====================================================
# BASE DE DATOS
# =====================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# =====================================================
# VALIDACIÓN DE CONTRASEÑAS
# =====================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# =====================================================
# IDIOMA Y ZONA HORARIA
# =====================================================

LANGUAGE_CODE = 'es-co'

TIME_ZONE = 'America/Bogota'

USE_I18N = True

USE_TZ = True


# =====================================================
# ARCHIVOS ESTÁTICOS
# =====================================================

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}


# =====================================================
# ARCHIVOS MULTIMEDIA
# =====================================================

MEDIA_URL = '/media/'

MEDIA_ROOT = BASE_DIR / 'media'


# =====================================================
# AUTENTICACIÓN
# =====================================================

LOGIN_URL = '/accounts/login/'

LOGIN_REDIRECT_URL = '/panel/'


# =====================================================
# CORREO
# =====================================================

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# =====================================================
# CONFIGURACIÓN GENERAL
# =====================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
