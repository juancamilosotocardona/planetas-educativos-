from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('categoria/<slug:slug>/', views.category_detail, name='category_detail'),
    path('publicacion/<slug:slug>/', views.post_detail, name='post_detail'),
    path('buscar/', views.search_results, name='search_results'),
    path('panel/', views.private_dashboard, name='dashboard'),
    path('panel/categoria/nueva/', views.category_create, name='category_create'),
    path('panel/categoria/<int:pk>/editar/', views.category_update, name='category_update'),
    path('panel/categoria/<int:pk>/eliminar/', views.category_delete, name='category_delete'),
    path('panel/publicacion/nueva/', views.post_create, name='post_create'),
    path('panel/publicacion/<int:pk>/editar/', views.post_edit, name='post_edit'),
    path('panel/publicacion/<int:pk>/eliminar/', views.post_delete, name='post_delete'),
]
