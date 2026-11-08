import os
import re

from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.db import models
from django.urls import reverse
from django.utils.text import slugify


ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png'}
ALLOWED_ATTACHMENT_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'docx', 'pptx'}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


def sanitize_upload_name(filename):
    if not filename:
        return ''
    basename = os.path.basename(filename)
    cleaned = re.sub(r'[^A-Za-z0-9._-]+', '_', basename)
    cleaned = cleaned.strip('._')
    return cleaned or 'archivo'


def ensure_default_categories(sender=None, **kwargs):
    editor_group, _ = Group.objects.get_or_create(name='Editores')
    admin_group, _ = Group.objects.get_or_create(name='Administradores')

    core_permissions = Permission.objects.filter(content_type__app_label='core')
    admin_group.permissions.set(core_permissions)

    editor_permissions = core_permissions.filter(codename__in={
        'view_category', 'add_category', 'change_category', 'delete_category',
        'view_post', 'add_post', 'change_post', 'delete_post'
    })
    editor_group.permissions.set(editor_permissions)

    defaults = [
        {
            'name': 'Mercurio',
            'description': 'Noticias y novedades educativas para estar al día con el campo deportivo y pedagógico.',
            'accent_color': '#f472b6',
            'orbit_color': '#f472b6',
            'order': 1,
        },
        {
            'name': 'Venus',
            'description': 'Descripción: Este planeta está dedicado a mostrar, a través de videos tutoriales narrados, el proceso de elaboración de manualidades, desde la creación de títeres hasta la creación de máscaras, entre otras actividades. Estos videos podrán servir como referencia para crear sus propias manualidades y adaptarlas a sus clases.',
            'accent_color': '#f4c27a',
            'orbit_color': '#f4c27a',
            'order': 2,
        },
        {
            'name': 'Tierra',
            'description': 'Salud, bienestar y actividad física para fortalecer hábitos sostenibles.',
            'accent_color': '#5eead4',
            'orbit_color': '#5eead4',
            'order': 3,
        },
        {
            'name': 'Marte',
            'description': 'Deportes, reglamentos y competencias con una mirada estratégica y disciplinada.',
            'accent_color': '#f97316',
            'orbit_color': '#f97316',
            'order': 4,
        },
        {
            'name': 'Júpiter',
            'description': 'Entrenamiento físico y preparación deportiva para el máximo rendimiento.',
            'accent_color': '#fbbf24',
            'orbit_color': '#fbbf24',
            'order': 5,
        },
        {
            'name': 'Saturno',
            'description': 'Documentos, guías y materiales de estudio para profundizar en contenidos.',
            'accent_color': '#c084fc',
            'orbit_color': '#c084fc',
            'order': 6,
        },
        {
            'name': 'Urano',
            'description': 'Recursos y videos para ampliar práctica, fundamentos y experiencias educativas.',
            'accent_color': '#7dd3fc',
            'orbit_color': '#7dd3fc',
            'order': 7,
        },
        {
            'name': 'Neptuno',
            'description': 'Videos, demostraciones y prácticas activas para aprender en movimiento.',
            'accent_color': '#60a5fa',
            'orbit_color': '#60a5fa',
            'order': 8,
        },
    ]

    for entry in defaults:
        Category.objects.get_or_create(
            slug=slugify(entry['name']),
            defaults={
                'name': entry['name'],
                'description': entry['description'],
                'accent_color': entry['accent_color'],
                'orbit_color': entry['orbit_color'],
                'order': entry['order'],
            },
        )


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    accent_color = models.CharField(max_length=20, default='#5eead4')
    orbit_color = models.CharField(max_length=30, default='rgba(94, 234, 212, 0.70)')
    order = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('category_detail', args=[self.slug])


class Post(models.Model):
    DRAFT = 'draft'
    PUBLISHED = 'published'
    STATUS_CHOICES = [
        (DRAFT, 'Borrador'),
        (PUBLISHED, 'Publicado'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    summary = models.TextField(help_text='Resumen breve visible en la vista principal.')
    content = models.TextField(help_text='Texto completo de la publicación.')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='posts')
    cover_image = models.FileField(upload_to='covers/%Y/%m/', blank=True, null=True)
    attachment = models.FileField(upload_to='attachments/%Y/%m/', blank=True, null=True)
    video_url = models.URLField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('post_detail', args=[self.slug])

    @property
    def is_published(self):
        return self.status == self.PUBLISHED
