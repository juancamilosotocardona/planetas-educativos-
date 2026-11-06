from django.core.management.base import BaseCommand

from core.models import ensure_default_categories


class Command(BaseCommand):
    help = 'Crea las categorías base del sistema solar educativo.'

    def handle(self, *args, **options):
        ensure_default_categories()
        self.stdout.write(self.style.SUCCESS('Categorías iniciales creadas o validadas correctamente.'))
