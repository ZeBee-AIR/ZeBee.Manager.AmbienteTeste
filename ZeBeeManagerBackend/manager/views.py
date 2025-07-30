from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Squad, RevenueHistory, SquadPerformance, Client
from .serializers import SquadSerializer, RevenueHistorySerializer, SquadPerformanceSerializer, ClientSerializer, UserSerializer

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class SquadViewSet(viewsets.ModelViewSet):
    serializer_class = SquadSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Squad.objects.all()
        # Se for usuário de squad, retorna apenas o seu squad
        if hasattr(user, 'profile') and user.profile.squad:
            return Squad.objects.filter(pk=user.profile.squad.pk)
        return Squad.objects.none()

class SquadViewSet(viewsets.ModelViewSet):
    """API endpoint para visualizar dados dos squads."""
    queryset = Squad.objects.all()
    serializer_class = SquadSerializer

class RevenueHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint para visualizar o histórico de receitas."""
    queryset = RevenueHistory.objects.all().order_by('month')
    serializer_class = RevenueHistorySerializer

class SquadPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint para visualizar o desempenho mensal dos squads."""
    queryset = SquadPerformance.objects.all().order_by('month')
    serializer_class = SquadPerformanceSerializer

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Client.objects.all().order_by('store_name')
        if hasattr(user, 'profile') and user.profile.squad:
            return Client.objects.filter(squad=user.profile.squad).order_by('store_name')
        return Client.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superuser and hasattr(user, 'profile') and user.profile.squad:
            serializer.save(squad=user.profile.squad)
        else:
            serializer.save()
