from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SquadViewSet, RevenueHistoryViewSet, SquadPerformanceViewSet, ClientViewSet

router = DefaultRouter()
router.register(r'squads', SquadViewSet, basename='squad')
router.register(r'revenue-history', RevenueHistoryViewSet, basename='revenuehistory')
router.register(r'squad-performance', SquadPerformanceViewSet, basename='squadperformance')
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]
