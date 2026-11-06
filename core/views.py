from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.paginator import Paginator
from django.db.models import Prefetch, Q
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.text import slugify
from django.views.decorators.http import require_POST

from .forms import CategoryForm, PostForm
from .models import Category, Post


def generate_unique_slug(model_class, value, current_object=None, field_name='slug'):
    base_slug = slugify(value) or 'item'
    candidate = base_slug
    counter = 2
    queryset = model_class.objects.all()
    if current_object and getattr(current_object, 'pk', None):
        queryset = queryset.exclude(pk=current_object.pk)

    while queryset.filter(**{field_name: candidate}).exists():
        candidate = f'{base_slug}-{counter}'
        counter += 1

    return candidate


def user_can_manage_content(user):
    if not user or not user.is_authenticated:
        return False
    return user.is_staff or user.groups.filter(name__in=['Administradores', 'Editores']).exists()


def require_content_manager(view_func):
    decorated = login_required(user_passes_test(user_can_manage_content, login_url='login')(view_func))
    return decorated


def home(request):
    categories = Category.objects.filter(is_active=True).prefetch_related(
        Prefetch(
            'posts',
            queryset=Post.objects.filter(status=Post.PUBLISHED).select_related('category', 'author').order_by('-created_at'),
            to_attr='published_posts'
        )
    )
    featured_posts = Post.objects.filter(status=Post.PUBLISHED).select_related('category', 'author')[:3]
    recent_posts = Post.objects.filter(status=Post.PUBLISHED).select_related('category', 'author')[:6]

    category_data = []
    for category in categories:
        category_data.append({
            'slug': category.slug,
            'name': category.name,
            'description': category.description,
            'accent_color': category.accent_color,
            'posts': [
                {
                    'title': post.title,
                    'summary': post.summary,
                    'content': post.content,
                    'cover_image': post.cover_image.url if post.cover_image else '',
                    'attachment': post.attachment.url if post.attachment else '',
                    'video_url': post.video_url,
                    'created_at': post.created_at.isoformat(),
                }
                for post in getattr(category, 'published_posts', [])
            ],
        })

    return render(request, 'core/home.html', {
        'categories': categories,
        'featured_posts': featured_posts,
        'recent_posts': recent_posts,
        'category_data': category_data,
    })


def category_detail(request, slug):
    category = get_object_or_404(Category, slug=slug, is_active=True)
    posts = category.posts.filter(status=Post.PUBLISHED).select_related('category', 'author')
    return render(request, 'core/category_detail.html', {
        'category': category,
        'posts': posts,
    })


def post_detail(request, slug):
    post = get_object_or_404(Post, slug=slug)
    if post.status != Post.PUBLISHED and not user_can_manage_content(request.user):
        raise Http404('Publicación no disponible.')
    return render(request, 'core/post_detail.html', {'post': post})


def search_results(request):
    query = request.GET.get('q', '').strip()
    category_slug = request.GET.get('category', '').strip()

    posts = Post.objects.filter(status=Post.PUBLISHED).select_related('category', 'author')
    if query:
        posts = posts.filter(
            Q(title__icontains=query) |
            Q(summary__icontains=query) |
            Q(content__icontains=query)
        )
    if category_slug:
        posts = posts.filter(category__slug=category_slug)

    paginator = Paginator(posts, 9)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    categories = Category.objects.filter(is_active=True)
    return render(request, 'core/search_results.html', {
        'query': query,
        'category_slug': category_slug,
        'posts': page_obj,
        'categories': categories,
    })


@require_content_manager
def private_dashboard(request):
    posts = Post.objects.select_related('category', 'author').all()
    categories = Category.objects.all()

    category_filter = request.GET.get('category')
    status_filter = request.GET.get('status')
    if category_filter:
        posts = posts.filter(category__slug=category_filter)
    if status_filter:
        posts = posts.filter(status=status_filter)

    paginator = Paginator(posts.order_by('-created_at'), 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'core/dashboard.html', {
        'categories': categories,
        'posts': page_obj,
        'selected_category': category_filter,
        'selected_status': status_filter,
    })


@require_content_manager
def category_create(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save(commit=False)
            category.slug = generate_unique_slug(Category, category.name)
            category.save()
            messages.success(request, 'Categoría creada correctamente.')
            return redirect('dashboard')
    else:
        form = CategoryForm()
    return render(request, 'core/category_form.html', {'form': form, 'title': 'Nueva categoría'})


@require_content_manager
def category_update(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            category = form.save(commit=False)
            category.slug = generate_unique_slug(Category, category.name, current_object=category)
            category.save()
            messages.success(request, 'Categoría actualizada.')
            return redirect('dashboard')
    else:
        form = CategoryForm(instance=category)
    return render(request, 'core/category_form.html', {'form': form, 'title': 'Editar categoría', 'category': category})


@require_content_manager
@require_POST
def category_delete(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if category.posts.exists():
        messages.error(request, 'No puedes eliminar una categoría con publicaciones asociadas.')
        return redirect('dashboard')
    category.delete()
    messages.success(request, 'Categoría eliminada.')
    return redirect('dashboard')


@require_content_manager
def post_create(request):
    selected_category_slug = request.GET.get('category')
    media_type = request.GET.get('type')

    initial = {}
    if selected_category_slug:
        selected_category = Category.objects.filter(slug=selected_category_slug, is_active=True).first()
        if selected_category:
            initial['category'] = selected_category

    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, initial=initial)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.slug = generate_unique_slug(Post, post.title)
            post.save()
            messages.success(request, 'Publicación creada correctamente.')
            return redirect('dashboard')
    else:
        form = PostForm(initial=initial)

    if media_type:
        messages.info(request, f'Preparando carga de {media_type.upper()} para el planeta seleccionado.')

    return render(request, 'core/post_form.html', {
        'form': form,
        'title': 'Nueva publicación',
        'selected_category': selected_category_slug,
        'selected_media': media_type,
    })


@require_content_manager
def post_edit(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            post = form.save(commit=False)
            post.slug = generate_unique_slug(Post, post.title, current_object=post)
            post.save()
            messages.success(request, 'Publicación actualizada.')
            return redirect('dashboard')
    else:
        form = PostForm(instance=post)
    return render(request, 'core/post_form.html', {'form': form, 'title': 'Editar publicación', 'post': post})


@require_content_manager
@require_POST
def post_delete(request, pk):
    post = get_object_or_404(Post, pk=pk)
    post.delete()
    messages.success(request, 'Publicación eliminada.')
    return redirect('dashboard')


def page_not_found(request, exception=None):
    return render(request, '404.html', status=404)
