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
    queryset = Squad.objects.all()

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
    queryset = Client.objects.all().order_by('store_name')

    def perform_create(self, serializer):
        serializer.save()
