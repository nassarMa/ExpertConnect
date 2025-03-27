from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'ratings', views.ProviderRatingViewSet, basename='provider-rating')

urlpatterns = [
    path('', include(router.urls)),
]
