from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExpertTagViewSet, ExpertSpecializationViewSet,
    ExpertAvailabilitySlotViewSet, ExpertSearchViewSet,
    ExpertDiscoveryViewSet
)

router = DefaultRouter()
router.register(r'tags', ExpertTagViewSet)
router.register(r'specializations', ExpertSpecializationViewSet)
router.register(r'availability-slots', ExpertAvailabilitySlotViewSet)
router.register(r'searches', ExpertSearchViewSet)
router.register(r'discovery', ExpertDiscoveryViewSet, basename='discovery')

urlpatterns = [
    path('', include(router.urls)),
]
